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
  params.set("class", preferences.classCode);
  params.delete("group");
  for (const group of preferences.groups) params.append("group", String(group));
  params.append("group", "whole");
  return `/timetable?${params}`;
}
