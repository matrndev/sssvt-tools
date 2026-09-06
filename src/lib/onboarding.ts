import { FILTER_KEYS, readTimetableFilters } from "./timetable-filters";

export const ONBOARDING_STORAGE_KEY = "sssvt-tools:onboarding";

export type OnboardingPreferences = { classCode: string; groups: number[] };
export type OnboardingClass = OnboardingPreferences;

export function parseOnboardingPreferences(raw: string | null | undefined): OnboardingPreferences | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("classCode" in value) || !("groups" in value)) return null;
    if (typeof value.classCode !== "string" || !value.classCode.trim() || !Array.isArray(value.groups) ||
      !value.groups.every((group: unknown) => typeof group === "number" && Number.isSafeInteger(group) && group > 0)) return null;
    return { classCode: value.classCode, groups: [...new Set<number>(value.groups)] };
  } catch {
    return null;
  }
}

export function defaultTimetableUrl(preferences: OnboardingPreferences, search = ""): string {
  const params = new URLSearchParams(search);
  params.delete("view");
  const defaults = defaultTimetableFilters(preferences);
  for (const key of FILTER_KEYS) {
    params.delete(key);
    for (const value of defaults[key]) params.append(key, value);
  }
  return `/timetable?${params}`;
}

export function defaultTimetableFilters(preferences: OnboardingPreferences) {
  return readTimetableFilters({ class: preferences.classCode, group: [...preferences.groups.map(String), "whole"] });
}
