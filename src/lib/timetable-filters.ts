import type { TimetableLesson } from "./timetable";

export const FILTER_LABELS = {
  class: "Class",
  subject: "Subject",
  teacher: "Teacher",
  room: "Room",
  group: "Group",
  weekday: "Weekday",
  period: "Period",
} as const;

export type FilterKey = keyof typeof FILTER_LABELS;
export const FILTER_KEYS = Object.keys(FILTER_LABELS) as FilterKey[];
export type TimetableFilters = Record<FilterKey, string[]>;
export type FilterOption = { value: string; label: string; count: number };
export type FilterOptions = Record<FilterKey, FilterOption[]>;
export type TimetableResult = {
  lessons: TimetableLesson[];
  options: FilterOptions;
  hasLessons: boolean;
};

export function readTimetableFilters(params: Record<string, string | string[] | undefined>): TimetableFilters {
  // Only accept known fields and nonempty, unique values. Unknown option values
  // remain visible and match nothing in SQL, rather than broadening a stale URL.
  return Object.fromEntries(FILTER_KEYS.map((key) => {
    const value = params[key];
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    return [key, [...new Set(values.filter((item) => item !== ""))]];
  })) as TimetableFilters;
}
