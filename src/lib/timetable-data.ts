import "server-only";

import { getPool } from "./db";
import type { OnboardingClass } from "./onboarding";
import { compareClasses, getRoomTransfers, PERIODS, WEEKDAYS, type LessonRoom, type TimetableLesson } from "./timetable";
import { FILTER_KEYS, isTrailingFilterOption, type FilterKey, type FilterOptions, type TimetableFilters, type TimetableFilterMode, type TimetableResult } from "./timetable-filters";

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

export async function getOnboardingClasses(): Promise<OnboardingClass[]> {
  const { rows } = await getPool().query<OnboardingClass>(`
    SELECT c.code AS "classCode",
      COALESCE(array_agg(DISTINCT t.group_num ORDER BY t.group_num)
        FILTER (WHERE t.group_num IS NOT NULL), ARRAY[]::integer[]) AS groups
    FROM (SELECT code FROM public.classes UNION SELECT class FROM public.timetable) c
    LEFT JOIN public.timetable t ON t.class = c.code
    GROUP BY c.code
  `);
  return rows.sort((a, b) => compareClasses(a.classCode, b.classCode));
}

export async function getTimetable(filters: TimetableFilters, mode: TimetableFilterMode = "advanced"): Promise<TimetableResult> {
  const values = FILTER_KEYS.map((key) => filters[key]);
  function where(except?: FilterKey) {
    return FILTER_KEYS.filter((key) => key !== except).map((key) => {
      const parameter = `$${FILTER_KEYS.indexOf(key) + 1}::text[]`;
      return `(cardinality(${parameter}) = 0 OR ${columns[key]} = ANY(${parameter}))`;
    }).join(" AND ");
  }

  function optionWhere(key: FilterKey) {
    if (mode === "advanced") return where(key);
    // Easy selections replace other filters. Only groups depend on the class.
    return key === "group" ? "(cardinality($1::text[]) = 0 OR t.class = ANY($1::text[]))" : "TRUE";
  }

  const [lessons, facets, roomHistory] = await Promise.all([
    getPool().query<Omit<TimetableLesson, "requiresRoomTransfer">>(`
      WITH lunch_classes AS (
        SELECT class, weekday, period,
          CASE WHEN bool_or(group_num IS NULL) THEN ARRAY[]::integer[]
            ELSE array_agg(DISTINCT group_num ORDER BY group_num) END AS groups
        FROM public.timetable
        WHERE subject = 'oběd'
        GROUP BY class, weekday, period
      )
      SELECT t.id::text AS id, t.class AS "classCode", t.weekday, t.period,
        c.home_classroom AS "homeClassroom",
        t.subject, s.name AS "subjectName", t.teacher, teacher.name AS "teacherName",
        t.room, COALESCE(room.is_computer_room, false) AS "isComputerRoom", t.group_num AS "group",
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object('classCode', lunch.class, 'groups', lunch.groups))
          FROM lunch_classes lunch
          WHERE t.subject = 'oběd' AND lunch.weekday = t.weekday AND lunch.period = t.period
            AND lunch.class <> t.class
        ), '[]'::jsonb) AS "otherLunchClasses"
      FROM public.timetable t
      LEFT JOIN public.classes c ON c.code = t.class
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
          COUNT(*) FILTER (WHERE ${optionWhere(key)})::int AS count
        FROM public.timetable t
        ${key === "subject" ? "LEFT JOIN public.subjects metadata ON metadata.abbrev = t.subject" : ""}
        ${key === "teacher" ? "LEFT JOIN public.teachers metadata ON metadata.abbrev = t.teacher" : ""}
        GROUP BY ${columns[key]}
      `).join(" UNION ALL ")}
      UNION ALL
      SELECT 'class', c.code, NULL::text, 0
      FROM public.classes c
      WHERE NOT EXISTS (SELECT 1 FROM public.timetable t WHERE t.class = c.code)
    `, mode === "advanced" ? values : [filters.class]),
    // Keep the full day for each matching class, even when filters hide earlier lessons.
    getPool().query<LessonRoom>(`
      SELECT history.id::text AS id, history.class AS "classCode", history.weekday,
        history.period, history.group_num AS "group", history.room
      FROM public.timetable history
      WHERE EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class = history.class AND t.weekday = history.weekday AND ${where()}
      )
    `, values),
  ]);

  const options: FilterOptions = { class: [], subject: [], teacher: [], room: [], group: [], weekday: [], period: [] };
  for (const { key, value, name, count } of facets.rows) {
    if (key === "weekday" || key === "period" || !value) continue;
    let label = name ? `${name}` : value;
    if (key === "teacher" && value === "none") label = "No teacher assigned";
    if (key === "room" && value === "none") label = "No room assigned";
    if (key === "group") label = value === "whole" ? "Whole class" : `Group ${value}`;
    options[key].push({ value, label, count });
  }
  // Keep all school days and periods available, including those with no lessons.
  options.weekday = WEEKDAYS.map((label, index) => ({ value: String(index + 1), label, count: 0 }));
  options.period = PERIODS.map(([start, end], index) => ({ value: String(index + 1), label: `${index + 1}. (${start} – ${end})`, count: 0 }));
  for (const row of facets.rows) {
    if (row.key !== "weekday" && row.key !== "period") continue;
    const option = options[row.key].find((item) => item.value === row.value);
    if (option) option.count = row.count;
  }
  for (const key of FILTER_KEYS) {
    options[key].sort((a, b) => {
      const trailingDifference = Number(isTrailingFilterOption(key, a.value)) - Number(isTrailingFilterOption(key, b.value));
      if (trailingDifference !== 0) return trailingDifference;
      return key === "class" ? compareClasses(a.value, b.value) : a.value.localeCompare(b.value, "cs", { numeric: true });
    });
  }

  const transfers = getRoomTransfers(roomHistory.rows);
  return {
    lessons: lessons.rows.map((lesson) => ({
      ...lesson,
      requiresRoomTransfer: transfers.has(lesson.id),
      otherLunchClasses: lesson.otherLunchClasses.sort((a, b) => compareClasses(a.classCode, b.classCode)),
    })),
    options,
    hasLessons: facets.rows.some((row) => row.key === "group"),
  };
}
