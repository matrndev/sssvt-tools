// Use the same effective lessons for the grid, filter counts and room history.
// Substitutions describe the current weekly snapshot; the table has no dates.
export function effectiveTimetableSql(showSubstitutions: boolean): string {
  const composed = !showSubstitutions ? `composed_timetable AS (
    SELECT t.id::text, t.class, t.weekday, t.period, t.group_num,
      t.subject, t.teacher, t.room, false AS is_substitution, NULL::text AS substitution_note
    FROM public.timetable t
  )` : `latest_substitutions AS (
    SELECT DISTINCT ON (class, weekday, period, group_num) *
    FROM public.substitutions
    ORDER BY class, weekday, period, group_num, id DESC
  ), composed_timetable AS (
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

  return `${composed}, active_teaching AS (
    SELECT * FROM composed_timetable WHERE btrim(subject) NOT IN ('', '—', 'oběd')
  ), lunch_replacements AS (
    ${showSubstitutions ? "SELECT class, weekday, period, group_num FROM latest_substitutions" :
      "SELECT class, weekday, period, group_num FROM composed_timetable WHERE false"}
  ), slot_groups AS (
    SELECT DISTINCT class, weekday, period, group_num
    FROM composed_timetable WHERE group_num IS NOT NULL
  ), effective_timetable AS (
    SELECT t.* FROM composed_timetable t
    WHERE t.subject <> 'oběd' OR (NOT EXISTS (
      SELECT 1 FROM active_teaching a
      WHERE a.class = t.class AND a.weekday = t.weekday AND a.period = t.period
        AND (t.group_num IS NULL OR a.group_num IS NULL OR a.group_num = t.group_num)
    ) AND NOT (t.group_num IS NULL AND EXISTS (
      SELECT 1 FROM lunch_replacements r
      WHERE r.class = t.class AND r.weekday = t.weekday AND r.period = t.period
        AND r.group_num IS NOT NULL
    )))
    UNION ALL
    -- Split only explicit whole-class lunch that overlaps active teaching.
    -- Group numbers in other periods can describe unrelated partitions.
    -- Only use this slot's groups, and never restore an overridden/cancelled lunch.
    SELECT t.id || ':lunch:' || g.group_num, t.class, t.weekday, t.period, g.group_num,
      t.subject, t.teacher, t.room, t.is_substitution, t.substitution_note
    FROM composed_timetable t JOIN slot_groups g
      ON g.class = t.class AND g.weekday = t.weekday AND g.period = t.period
    WHERE t.subject = 'oběd' AND t.group_num IS NULL
      AND (EXISTS (
        SELECT 1 FROM active_teaching a
        WHERE a.class = t.class AND a.weekday = t.weekday AND a.period = t.period
      ) OR EXISTS (
        SELECT 1 FROM lunch_replacements r
        WHERE r.class = t.class AND r.weekday = t.weekday AND r.period = t.period
          AND r.group_num IS NOT NULL
      )) AND NOT EXISTS (
        SELECT 1 FROM active_teaching a
        WHERE a.class = t.class AND a.weekday = t.weekday AND a.period = t.period
          AND (a.group_num IS NULL OR a.group_num = g.group_num)
      ) AND NOT EXISTS (
        SELECT 1 FROM lunch_replacements r
        WHERE r.class = t.class AND r.weekday = t.weekday AND r.period = t.period
          AND (r.group_num IS NULL OR r.group_num = g.group_num)
      )
  )`;
}

// Teacher abbreviations are the database's primary/foreign keys. Both tables
// describe one weekly snapshot and expose no date or alternating-week columns.
export const teacherConflictsSql = `teacher_conflicts AS (
  SELECT a.id, jsonb_agg(jsonb_build_object(
    'classCode', b.class, 'group', b.group_num, 'subject', b.subject, 'room', b.room
  ) ORDER BY b.class, b.group_num, b.id) AS conflicts
  FROM active_teaching a JOIN active_teaching b
    ON a.teacher = b.teacher AND NULLIF(btrim(a.teacher), '') IS NOT NULL
    AND a.weekday = b.weekday AND a.period = b.period AND a.id <> b.id
    AND (
      a.subject <> b.subject OR (
        NULLIF(btrim(a.room), '') IS NOT NULL AND NULLIF(btrim(b.room), '') IS NOT NULL
        AND btrim(a.room) <> btrim(b.room)
      )
    )
  -- Equal subject and room can be a combined lesson across groups/classes.
  -- Unknown rooms alone are not evidence of separate teaching assignments.
  GROUP BY a.id
)`;
