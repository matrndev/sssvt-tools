"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faSliders, faTrash } from "@fortawesome/free-solid-svg-icons";
import Timetable from "@/app/components/timetable";
import { defaultTimetableFilters } from "@/lib/onboarding";
import { useTimetablePreferences } from "./preferences-gate";
import {
  FILTER_KEYS, FILTER_LABELS, readTimetableFilters, type FilterKey, type FilterOption,
  type TimetableFilters, type TimetableResult,
} from "@/lib/timetable-filters";

const PRIMARY_FILTERS: FilterKey[] = ["class", "group", "teacher", "room"];
const ADVANCED_FILTERS: FilterKey[] = ["subject", "weekday", "period"];
const clearButtonClasses = "cursor-pointer text-xs text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 disabled:cursor-default disabled:text-slate-600";

function FilterDropdown({ filterKey, options, selected, onChange, requiredSingle = false }: {
  filterKey: FilterKey;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  requiredSingle?: boolean;
}) {
  const [query, setQuery] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  const label = FILTER_LABELS[filterKey];
  const allOptions = [...options, ...selected.filter((value) => !options.some((option) => option.value === value))
    .map((value) => ({ value, label: `${value} (unavailable)`, count: 0 }))];
  const visibleOptions = allOptions.filter((option) => option.count > 0 && option.label.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")));

  return (
    <details ref={details} className="group relative min-w-0 open:z-10" name="timetable-filter"
      onToggle={(event) => { if (!event.currentTarget.open) setQuery(""); }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && details.current) {
          details.current.open = false;
          details.current.querySelector("summary")?.focus();
        }
      }}>
      <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:border-slate-600 hover:bg-slate-800/60 group-open:border-slate-500 group-open:bg-slate-800/70 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 [&::-webkit-details-marker]:hidden ${selected.length > 0 ? "border-slate-600 bg-slate-800/60 text-slate-100" : "border-slate-700/60 bg-slate-900/40 text-slate-400"}`}>
        <span className="shrink-0">{label}</span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-slate-300">
          {selected.length === 0 ? "Any" : selected.length === 1 ? allOptions.find((option) => option.value === selected[0])?.label : `${selected.length} selected`}
        </span>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <div className={`absolute top-[calc(100%+0.5rem)] left-0 w-76 min-w-full max-w-[calc(100vw-4rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl shadow-black/30 ${["room", "period", "subject"].includes(filterKey) ? "sm:right-0 sm:left-auto" : ""}`}>
        <input type="search" aria-label={`Search ${label.toLowerCase()} options`} placeholder={`Search ${label.toLowerCase()}…`}
          value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" />
        {!requiredSingle && <button type="button" className={`${clearButtonClasses} my-3`} disabled={selected.length === 0} onClick={() => onChange([])}>Clear {label.toLowerCase()}</button>}
        <fieldset className="mt-2 max-h-64 overflow-y-auto overscroll-contain">
          <legend className="sr-only">{label}: {requiredSingle ? "choose one class" : "select any matching values"}</legend>
          {visibleOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2.5 text-[13px] wrap-anywhere transition-colors hover:bg-slate-800">
              <input type={requiredSingle ? "radio" : "checkbox"} name={requiredSingle ? "timetable-class" : undefined} className="size-4 shrink-0 accent-blue-400 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" checked={selected.includes(option.value)}
                onChange={(event) => {
                  onChange(requiredSingle ? [option.value] : event.target.checked ? [...selected, option.value] : selected.filter((value) => value !== option.value));
                  if (requiredSingle && details.current) {
                    details.current.open = false;
                    details.current.querySelector("summary")?.focus();
                  }
                }} />
              <span className="min-w-0 flex-1">{option.label}</span>
              <span className="text-xs tabular-nums text-slate-400" aria-label={`${option.count} matching lessons`}>{option.count}</span>
            </label>
          ))}
          {visibleOptions.length === 0 && <p className="p-3 text-sm text-slate-400">No options found.</p>}
        </fieldset>
      </div>
    </details>
  );
}

export default function TimetableExplorer({ data, filters }: { data: TimetableResult; filters: TimetableFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const preferences = useTimetablePreferences();
  const defaults = defaultTimetableFilters(preferences);
  const { lessons, options, hasLessons } = data;
  const activeCount = FILTER_KEYS.reduce((total, key) => total + filters[key].length, 0);
  const advancedCount = ADVANCED_FILTERS.reduce((total, key) => total + filters[key].length, 0);
  // URLs and browser history can restore combinations that need advanced mode.
  const isAdvanced = advancedOpen || filters.class.length !== 1 || advancedCount > 0;

  function replaceFilters(next: TimetableFilters) {
    if (isPending) return;
    const url = new URL(window.location.href);
    for (const key of FILTER_KEYS) {
      url.searchParams.delete(key);
      for (const value of next[key]) url.searchParams.append(key, value);
    }
    // An intentionally cleared timetable must not immediately reapply defaults.
    if (FILTER_KEYS.some((field) => url.searchParams.getAll(field).some(Boolean))) url.searchParams.delete("view");
    else url.searchParams.set("view", "all");
    startTransition(() => router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false }));
  }

  function updateFilters(key: FilterKey, values: string[]) {
    if (!isAdvanced && key === "class" && values.length !== 1) return;
    replaceFilters({ ...filters, [key]: values });
  }

  function resetToDefaults() {
    replaceFilters(defaults);
  }

  function clearAllFilters() {
    replaceFilters(readTimetableFilters({}));
  }

  function toggleAdvanced() {
    if (isAdvanced) {
      // Basic mode has exactly one class and no hidden advanced constraints.
      const next = { ...filters, class: [filters.class[0] ?? preferences.classCode] };
      for (const key of ADVANCED_FILTERS) next[key] = [];
      replaceFilters(next);
    }
    setAdvancedOpen(!isAdvanced);
  }

  return (
    <div aria-busy={isPending}>
      <fieldset disabled={isPending} aria-label="Timetable filters" className="mt-6 min-w-0 disabled:opacity-60">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PRIMARY_FILTERS.map((key) => <FilterDropdown key={key} filterKey={key} options={options[key]} selected={filters[key]} requiredSingle={!isAdvanced && key === "class"} onChange={(values) => updateFilters(key, values)} />)}
          </div>
          <div className="flex shrink-0 items-center gap-3 md:pl-2">
            <button type="button" aria-expanded={isAdvanced} aria-controls="advanced-timetable-filters" onClick={toggleAdvanced} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs transition-colors hover:bg-slate-800/60 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 ${isAdvanced ? "bg-slate-800/60 text-slate-200" : "text-slate-400"}`}>
              <FontAwesomeIcon icon={faSliders} aria-hidden="true" className="size-3.5" />
              Advanced
              {advancedCount > 0 && <span className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-200" aria-label={`${advancedCount} active advanced filters`}>{advancedCount}</span>}
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`size-3 transition-transform ${isAdvanced ? "rotate-180" : ""}`}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={resetToDefaults} className={`${clearButtonClasses} inline-flex min-h-11 items-center gap-1.5 px-1`}><FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" className="size-3" />Reset to defaults</button>
          </div>
        </div>
        <div id="advanced-timetable-filters" hidden={!isAdvanced} className="mt-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-400">This menu allows mixing and matching all filter options as you desire.<br />Feeling overwhelmed? <button type="button" onClick={toggleAdvanced} className="cursor-pointer underline decoration-slate-600 underline-offset-2 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400">Revert to simple mode.</button></p>
            <button type="button" disabled={activeCount === 0} onClick={clearAllFilters} className={`${clearButtonClasses} inline-flex min-h-9 items-center gap-1.5`}><FontAwesomeIcon icon={faTrash} aria-hidden="true" className="size-3" />Clear all filters</button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {isAdvanced && ADVANCED_FILTERS.map((key) => <FilterDropdown key={key} filterKey={key} options={options[key]} selected={filters[key]} onChange={(values) => updateFilters(key, values)} />)}
          </div>
        </div>
        {activeCount > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Active filters">
          {FILTER_KEYS.flatMap((key) => filters[key].map((value) => {
            const label = options[key].find((option) => option.value === value)?.label ?? `${value} (unavailable)`;
            const requiredClass = !isAdvanced && key === "class";
            return <button type="button" key={`${key}:${value}`} disabled={requiredClass} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800/50 px-2.5 py-1.5 text-left text-xs text-slate-300 wrap-anywhere transition-colors hover:bg-slate-700/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 disabled:cursor-default disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300" onClick={() => updateFilters(key, filters[key].filter((item) => item !== value))} aria-label={`${requiredClass ? "Selected" : "Remove"} ${FILTER_LABELS[key]}: ${label}${requiredClass ? " (one class required)" : ""}`}>
              <span>{defaults[key].includes(value) && <span className="mb-0.5 block text-[10px] text-blue-300">default</span>}<span><span className="text-slate-500">{FILTER_LABELS[key]}:</span> {label}</span></span> {!requiredClass && <span aria-hidden="true" className="text-slate-500">×</span>}
            </button>;
          }))}
        </div>}
      </fieldset>
      <p role="status" className="sr-only">{isPending ? "Updating timetable…" : ""}</p>
      {lessons.length > 0 ? <Timetable title="Weekly timetable" lessons={lessons} view={filters.class.length === 1 ? "class" : "teacher"} /> : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
          <h2 className="text-lg font-medium">{!hasLessons ? "No timetable data available" : "No lessons match these filters"}</h2>
          <p className="mt-2 text-sm text-slate-400">{!hasLessons ? "The timetable will appear when lessons are available." : "Remove a filter or choose another combination."}</p>
          <button type="button" disabled={isPending} className={`${clearButtonClasses} mt-4 inline-flex items-center gap-1.5`} onClick={resetToDefaults}><FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" className="size-3" />Reset to defaults</button>
        </div>
      )}
    </div>
  );
}
