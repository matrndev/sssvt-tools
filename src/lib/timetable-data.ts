import "server-only";

import { getPool } from "./db";
import { compareClasses, type TimetableData } from "./timetable";

export async function getTimetable(): Promise<TimetableData> {
  // One statement gives classes and lessons a consistent PostgreSQL snapshot.
  // Only timetable fields are selected; teacher contact details stay private.
  const { rows } = await getPool().query<TimetableData>(`
    SELECT
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'code', c.code,
          'classTeacher', c.class_teacher,
          'homeClassroom', c.home_classroom
        )) FROM public.classes c
      ), '[]'::jsonb) AS classes,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', t.id::text,
          'classCode', t.class,
          'weekday', t.weekday,
          'period', t.period,
          'subject', t.subject,
          'subjectName', s.name,
          'teacher', t.teacher,
          'teacherName', teacher.name,
          'room', t.room,
          'group', t.group_num
        ) ORDER BY t.class, t.weekday, t.period, t.group_num NULLS FIRST, t.id)
        FROM public.timetable t
        LEFT JOIN public.subjects s ON s.abbrev = t.subject
        LEFT JOIN public.teachers teacher ON teacher.abbrev = t.teacher
      ), '[]'::jsonb) AS lessons
  `);

  const data = rows[0];
  // Also display lessons if class metadata has not yet been imported.
  const classes = new Map(data.classes.map((item) => [item.code, item]));
  for (const lesson of data.lessons) {
    if (!classes.has(lesson.classCode)) {
      classes.set(lesson.classCode, {
        code: lesson.classCode,
        classTeacher: null,
        homeClassroom: null,
      });
    }
  }

  return {
    classes: [...classes.values()].sort((a, b) => compareClasses(a.code, b.code)),
    lessons: data.lessons,
  };
}
