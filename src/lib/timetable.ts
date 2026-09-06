export const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá"] as const;

// Bell times from https://www.sssvt.cz/IS/rozvrh-hodin/.
export const PERIODS = [
  ["08:00", "08:45"],
  ["08:55", "09:40"],
  ["10:00", "10:45"],
  ["10:55", "11:40"],
  ["11:50", "12:35"],
  ["12:45", "13:30"],
  ["13:40", "14:25"],
  ["14:35", "15:20"],
  ["15:30", "16:15"],
] as const;

export type TimetableLesson = {
  id: string;
  classCode: string;
  weekday: number;
  period: number;
  subject: string;
  subjectName: string | null;
  teacher: string | null;
  teacherName: string | null;
  room: string | null;
  group: number | null;
};

export type TimetableClass = {
  code: string;
  classTeacher: string | null;
  homeClassroom: string | null;
};

export type TimetableData = {
  classes: TimetableClass[];
  lessons: TimetableLesson[];
};

export type TimetableView = "class" | "room" | "teacher";

export function timetableHref(view: TimetableView, value: string): string {
  return `/timetable?${new URLSearchParams({ [view]: value })}`;
}

export function compareClasses(a: string, b: string): number {
  // Keep years and class letters together: T1.A, P1.B, S1.C, P2.A, ...
  return a.slice(1).localeCompare(b.slice(1), "cs", { numeric: true }) ||
    a.localeCompare(b, "cs");
}

export function buildTimetableGrid(lessons: TimetableLesson[]) {
  const grid = WEEKDAYS.map(() => PERIODS.map(() => [] as TimetableLesson[]));

  for (const lesson of lessons) {
    const cell = grid[lesson.weekday - 1]?.[lesson.period - 1];
    if (!cell) throw new Error("Timetable lesson is outside the school week.");
    cell.push(lesson);
  }

  for (const day of grid) {
    for (const cell of day) {
      cell.sort((a, b) => compareClasses(a.classCode, b.classCode) ||
        (a.group ?? 0) - (b.group ?? 0) || a.id.localeCompare(b.id, "en", { numeric: true }));
    }
  }
  return grid;
}
