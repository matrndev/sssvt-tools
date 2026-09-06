import "server-only";

import { getPool } from "./db";
import { compareClasses, PERIODS, WEEKDAYS, type TimetableLesson } from "./timetable";
import { FILTER_KEYS, type FilterKey, type FilterOptions, type TimetableFilters, type TimetableResult } from "./timetable-filters";

// SQL identifiers come only from this map; URL values are always parameters.
// Text comparisons also make invalid numeric URL values harmless non-matches.
const columns: Record<FilterKey, string> = {
  class: "t.class",
  subject: "t.subject",
  teacher: "COALESCE(NULLIF(t.teacher, ''), 'none')",
  room: "COALESCE(NULLIF(t.room, ''), 'none')",
  group: "COALESCE(t.group_num::text, 'whole')",
  weekday: "t.weekday::text",
  period: "t.period::text",
};

type OptionRow = { key: FilterKey; value: string; name: string | null; count: number };

export async function getTimetable(filters: TimetableFilters): Promise<TimetableResult> {
  const values = FILTER_KEYS.map((key) => filters[key]);
  function where(except?: FilterKey) {
    return FILTER_KEYS.filter((key) => key !== except).map((key) => {
      const parameter = `$${FILTER_KEYS.indexOf(key) + 1}::text[]`;
      return `(cardinality(${parameter}) = 0 OR ${columns[key]} = ANY(${parameter}))`;
    }).join(" AND ");
  }

  const [lessons, facets] = await Promise.all([
    getPool().query<TimetableLesson>(`
      SELECT t.id::text AS id, t.class AS "classCode", t.weekday, t.period,
        t.subject, s.name AS "subjectName", t.teacher, teacher.name AS "teacherName",
        t.room, COALESCE(room.is_computer_room, false) AS "isComputerRoom", t.group_num AS "group"
      FROM public.timetable t
      LEFT JOIN public.subjects s ON s.abbrev = t.subject
      LEFT JOIN public.teachers teacher ON teacher.abbrev = t.teacher
      LEFT JOIN public.rooms room ON room.id = t.room
      WHERE ${where()}
      ORDER BY t.class, t.weekday, t.period, t.group_num NULLS FIRST, t.id
    `, values),
    getPool().query<OptionRow>(`
      ${FILTER_KEYS.map((key) => `
        SELECT '${key}' AS key, ${columns[key]} AS value,
          ${key === "subject" || key === "teacher" ? "MAX(metadata.name)" : "NULL::text"} AS name,
          COUNT(*) FILTER (WHERE ${where(key)})::int AS count
        FROM public.timetable t
        ${key === "subject" ? "LEFT JOIN public.subjects metadata ON metadata.abbrev = t.subject" : ""}
        ${key === "teacher" ? "LEFT JOIN public.teachers metadata ON metadata.abbrev = t.teacher" : ""}
        GROUP BY ${columns[key]}
      `).join(" UNION ALL ")}
      UNION ALL
      SELECT 'class', c.code, NULL::text, 0
      FROM public.classes c
      WHERE NOT EXISTS (SELECT 1 FROM public.timetable t WHERE t.class = c.code)
    `, values),
  ]);

  const options: FilterOptions = { class: [], subject: [], teacher: [], room: [], group: [], weekday: [], period: [] };
  for (const { key, value, name, count } of facets.rows) {
    if (key === "weekday" || key === "period" || !value) continue;
    let label = name ? `${value} — ${name}` : value;
    if (key === "teacher" && value === "none") label = "No teacher assigned";
    if (key === "room" && value === "none") label = "No room assigned";
    if (key === "group") label = value === "whole" ? "Whole class (no group)" : `Group ${value}`;
    options[key].push({ value, label, count });
  }
  // Keep all school days and periods available, including those with no lessons.
  options.weekday = WEEKDAYS.map((label, index) => ({ value: String(index + 1), label, count: 0 }));
  options.period = PERIODS.map(([start, end], index) => ({ value: String(index + 1), label: `${index + 1}. ${start}–${end}`, count: 0 }));
  for (const row of facets.rows) {
    if (row.key !== "weekday" && row.key !== "period") continue;
    const option = options[row.key].find((item) => item.value === row.value);
    if (option) option.count = row.count;
  }
  for (const key of FILTER_KEYS) {
    options[key].sort((a, b) => key === "class" ? compareClasses(a.value, b.value) : a.value.localeCompare(b.value, "cs", { numeric: true }));
  }

  return { lessons: lessons.rows, options, hasLessons: facets.rows.some((row) => row.key === "group") };
}
