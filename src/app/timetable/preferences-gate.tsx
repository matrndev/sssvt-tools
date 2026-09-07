"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_KEYS } from "@/lib/timetable-filters";
import { defaultTimetableUrl, ONBOARDING_STORAGE_KEY, parseOnboardingPreferences, type OnboardingPreferences } from "@/lib/onboarding";
import Loading from "./loading";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  } catch {
    return null;
  }
}

const getServerSnapshot = () => undefined;

const PreferencesContext = createContext<OnboardingPreferences | null>(null);

export function useTimetablePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error("Timetable preferences require PreferencesGate.");
  return preferences;
}

export default function PreferencesGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const preferences = parseOnboardingPreferences(raw);
  const hasFilters = FILTER_KEYS.some((key) => searchParams.getAll(key).some(Boolean));
  const destination = raw === undefined ? null : !preferences ? "/onboarding"
    : !hasFilters && searchParams.get("view") !== "all" && searchParams.get("mode") !== "advanced"
      ? defaultTimetableUrl(preferences, searchParams.toString()) : null;

  useEffect(() => {
    if (destination) router.replace(`${destination}${window.location.hash}`, { scroll: false });
  }, [destination, router]);

  if (raw === undefined || destination || !preferences) return <Loading />;
  return <PreferencesContext value={preferences}>{children}</PreferencesContext>;
}
