export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

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
  homeClassroom: string | null;
  weekday: number;
  period: number;
  subject: string;
  subjectName: string | null;
  teacher: string | null;
  teacherName: string | null;
  room: string | null;
  isComputerRoom: boolean;
  requiresRoomTransfer: boolean;
  group: number | null;
};

export type LessonRoom = Pick<TimetableLesson, "id" | "classCode" | "weekday" | "period" | "group" | "room">;

export function getRoomTransfers(lessons: LessonRoom[]): Set<string> {
  const transfers = new Set<string>();
  const days = new Map<string, LessonRoom[]>();
  for (const lesson of lessons) {
    const key = `${lesson.classCode}:${lesson.weekday}`;
    const day = days.get(key) ?? [];
    day.push(lesson);
    days.set(key, day);
  }

  for (const day of days.values()) {
    day.sort((a, b) => a.period - b.period);
    const groups = new Set(day.map((lesson) => lesson.group).filter((group) => group !== null));
    // A whole-class lesson belongs to every group. With no splits, use one track.
    for (const group of groups.size ? groups : [null]) {
      let previous: LessonRoom[] = [];
      let current: LessonRoom[] = [];
      for (const lesson of day) {
        if (lesson.group !== null && lesson.group !== group) continue;
        if (current.length && lesson.period !== current[0].period) {
          previous = current;
          current = [];
        }
        if (lesson.room && previous.some((prior) => prior.room && prior.room !== lesson.room)) {
          transfers.add(lesson.id);
        }
        current.push(lesson);
      }
    }
  }
  return transfers;
}

export type TimetableView = "class" | "room" | "teacher";

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

export function getGroupColor(group: number | null): string {
  if (group === null) {
    return "bg-gray-600/40";
  }
  switch (group) {
    case 1:
      return "bg-blue-600/40";
    case 2:
      return "bg-green-600/40";
    case 3:
      return "bg-yellow-600/40";
    case 4:
      return "bg-orange-600/40";
    default:
      return "bg-gray-600/40";
  }
}
