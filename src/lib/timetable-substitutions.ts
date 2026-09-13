// Use the same effective lessons for the grid, filter counts and room history.
// Substitutions describe the current weekly snapshot; the table has no dates.
export function effectiveTimetableSql(showSubstitutions: boolean): string {
  if (!showSubstitutions) return `effective_timetable AS (
    SELECT t.*, false AS is_substitution, NULL::text AS substitution_note
    FROM public.timetable t
  )`;

  return `latest_substitutions AS (
    SELECT DISTINCT ON (class, weekday, period, group_num) *
    FROM public.substitutions
    ORDER BY class, weekday, period, group_num, id DESC
  ), effective_timetable AS (
    SELECT t.id::text AS id, t.class, t.weekday, t.period, t.group_num,
      CASE WHEN s.id IS NULL THEN t.subject ELSE COALESCE(s.new_subject, '') END AS subject,
      CASE WHEN s.id IS NULL THEN t.teacher ELSE s.new_teacher END AS teacher,
      CASE WHEN s.id IS NULL THEN t.room ELSE s.new_room END AS room,
      s.id IS NOT NULL AS is_substitution, s.note AS substitution_note
    FROM public.timetable t
    LEFT JOIN latest_substitutions s ON s.class = t.class
      AND s.weekday = t.weekday AND s.period = t.period
      AND s.group_num IS NOT DISTINCT FROM t.group_num
    UNION ALL
    SELECT 'substitution:' || s.id::text, s.class, s.weekday, s.period, s.group_num,
      COALESCE(s.new_subject, ''), s.new_teacher, s.new_room, true, s.note
    FROM latest_substitutions s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.timetable t
      WHERE t.class = s.class AND t.weekday = s.weekday AND t.period = s.period
        AND t.group_num IS NOT DISTINCT FROM s.group_num
    )
  )`;
}
