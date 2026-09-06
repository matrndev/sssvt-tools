"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_KEYS } from "@/lib/timetable-filters";
import { defaultTimetableUrl, ONBOARDING_STORAGE_KEY, parseOnboardingPreferences } from "@/lib/onboarding";
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

export default function PreferencesGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const preferences = parseOnboardingPreferences(raw);
  const hasFilters = FILTER_KEYS.some((key) => searchParams.getAll(key).some(Boolean));
  const destination = raw === undefined ? null : !preferences ? "/onboarding"
    : !hasFilters && searchParams.get("view") !== "all" ? defaultTimetableUrl(preferences, searchParams.toString()) : null;

  useEffect(() => {
    if (destination) router.replace(`${destination}${window.location.hash}`, { scroll: false });
  }, [destination, router]);

  if (raw === undefined || destination) return <Loading />;
  return children;
}
