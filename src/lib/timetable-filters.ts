import type { TimetableLesson } from "./timetable";

export const FILTER_LABELS = {
  class: "Class",
  group: "Group",
  room: "Room",
  teacher: "Teacher",
  subject: "Subject",
  weekday: "Weekday",
  period: "Period",
} as const;

export type FilterKey = keyof typeof FILTER_LABELS;
export const FILTER_KEYS = Object.keys(FILTER_LABELS) as FilterKey[];
export type TimetableFilters = Record<FilterKey, string[]>;
export type TimetableFilterMode = "easy" | "advanced";
export type FilterOption = { value: string; label: string; count: number };
export type FilterOptions = Record<FilterKey, FilterOption[]>;
export type TimetableResult = {
  lessons: TimetableLesson[];
  options: FilterOptions;
  hasLessons: boolean;
};

export function isTrailingFilterOption(key: FilterKey, value: string): boolean {
  return (key === "teacher" || key === "room") ? value === "none" : key === "subject" && value === "oběd";
}

export function readTimetableFilters(params: Record<string, string | string[] | undefined>): TimetableFilters {
  // Only accept known fields and nonempty, unique values. Unknown option values
  // remain visible and match nothing in SQL, rather than broadening a stale URL.
  return Object.fromEntries(FILTER_KEYS.map((key) => {
    const value = params[key];
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    return [key, [...new Set(values.filter((item) => item !== ""))]];
  })) as TimetableFilters;
}

export function readTimetableFilterMode(mode: string | string[] | undefined, filters: TimetableFilters): TimetableFilterMode {
  // Preserve older shared URLs with combinations that easy mode cannot express.
  const primaryCount = [filters.class, filters.teacher, filters.room].filter((values) => values.length > 0).length;
  const needsAdvanced = primaryCount > 1 || [filters.class, filters.teacher, filters.room].some((values) => values.length > 1)
    || [filters.subject, filters.weekday, filters.period].some((values) => values.length > 0)
    || (filters.group.length > 0 && (filters.class.length !== 1 || !filters.group.includes("whole")));
  return mode === "advanced" || needsAdvanced ? "advanced" : "easy";
}

export function updateEasyTimetableFilters(filters: TimetableFilters, key: FilterKey, values: string[]): TimetableFilters {
  const next = readTimetableFilters({});
  if (key === "group") {
    if (filters.class.length !== 1) return filters;
    next.class = filters.class;
    // The implicit whole-class selection must not keep the last group filter active.
    next.group = values.some((value) => value !== "whole") ? [...new Set([...values, "whole"])] : [];
  } else if (key === "class" || key === "teacher" || key === "room") {
    next[key] = values.slice(0, 1);
    if (key === "class" && next.class[0] === filters.class[0]) next.group = filters.group;
  }
  return next;
}
