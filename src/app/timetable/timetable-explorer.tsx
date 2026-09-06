"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faSliders } from "@fortawesome/free-solid-svg-icons";
import Timetable from "@/app/components/timetable";
import {
  FILTER_KEYS, FILTER_LABELS, type FilterKey, type FilterOption,
  type TimetableFilters, type TimetableResult,
} from "@/lib/timetable-filters";

const PRIMARY_FILTERS: FilterKey[] = ["class", "teacher", "subject"];
const ADVANCED_FILTERS: FilterKey[] = ["group", "room", "weekday", "period"];
const clearButtonClasses = "cursor-pointer text-xs text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 disabled:cursor-default disabled:text-slate-600";

function FilterDropdown({ filterKey, options, selected, onChange }: {
  filterKey: FilterKey;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  const label = FILTER_LABELS[filterKey];
  const allOptions = [...options, ...selected.filter((value) => !options.some((option) => option.value === value))
    .map((value) => ({ value, label: `${value} (unavailable)`, count: 0 }))];
  const visibleOptions = allOptions.filter((option) => option.label.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")));

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
          {selected.length === 0 ? <span className="sr-only">Any</span> : selected.length === 1 ? allOptions.find((option) => option.value === selected[0])?.label : `${selected.length} selected`}
        </span>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <div className={`absolute top-[calc(100%+0.5rem)] left-0 w-76 min-w-full max-w-[calc(100vw-4rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl shadow-black/30 ${["room", "period", "subject"].includes(filterKey) ? "sm:right-0 sm:left-auto" : ""}`}>
        <input type="search" aria-label={`Search ${label.toLowerCase()} options`} placeholder={`Search ${label.toLowerCase()}…`}
          value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" />
        <button type="button" className={`${clearButtonClasses} my-3`} disabled={selected.length === 0} onClick={() => onChange([])}>Clear {label.toLowerCase()}</button>
        <fieldset className="max-h-64 overflow-y-auto overscroll-contain">
          <legend className="sr-only">{label}: select any matching values</legend>
          {visibleOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2.5 text-[13px] wrap-anywhere transition-colors hover:bg-slate-800">
              <input type="checkbox" className="size-4 shrink-0 accent-blue-400 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" checked={selected.includes(option.value)}
                onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((value) => value !== option.value))} />
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
  const { lessons, options, hasLessons } = data;
  const activeCount = FILTER_KEYS.reduce((total, key) => total + filters[key].length, 0);
  const advancedCount = ADVANCED_FILTERS.reduce((total, key) => total + filters[key].length, 0);

  function updateFilters(key?: FilterKey, values: string[] = []) {
    if (isPending) return;
    const url = new URL(window.location.href);
    for (const field of key ? [key] : FILTER_KEYS) url.searchParams.delete(field);
    if (key) for (const value of values) url.searchParams.append(key, value);
    // An intentionally cleared timetable must not immediately reapply defaults.
    if (FILTER_KEYS.some((field) => url.searchParams.getAll(field).some(Boolean))) url.searchParams.delete("view");
    else url.searchParams.set("view", "all");
    startTransition(() => router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false }));
  }

  return (
    <div aria-busy={isPending}>
      <fieldset disabled={isPending} aria-label="Timetable filters" className="mt-6 min-w-0 disabled:opacity-60">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            {PRIMARY_FILTERS.map((key) => <FilterDropdown key={key} filterKey={key} options={options[key]} selected={filters[key]} onChange={(values) => updateFilters(key, values)} />)}
          </div>
          <div className="flex shrink-0 items-center gap-3 md:pl-2">
            <button type="button" aria-expanded={advancedOpen} aria-controls="advanced-timetable-filters" onClick={() => setAdvancedOpen(!advancedOpen)} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs transition-colors hover:bg-slate-800/60 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 ${advancedOpen ? "bg-slate-800/60 text-slate-200" : "text-slate-400"}`}>
              <FontAwesomeIcon icon={faSliders} aria-hidden="true" className="size-3.5" />
              Advanced
              {advancedCount > 0 && <span className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-200" aria-label={`${advancedCount} active advanced filters`}>{advancedCount}</span>}
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`size-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {activeCount > 0 && <button type="button" onClick={() => updateFilters()} className={`${clearButtonClasses} inline-flex min-h-11 items-center gap-1.5 px-1`}><FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" className="size-3" />Reset</button>}
          </div>
        </div>
        <div id="advanced-timetable-filters" hidden={!advancedOpen} className="mt-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {advancedOpen && ADVANCED_FILTERS.map((key) => <FilterDropdown key={key} filterKey={key} options={options[key]} selected={filters[key]} onChange={(values) => updateFilters(key, values)} />)}
          </div>
        </div>
        {activeCount > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Active filters">
          {FILTER_KEYS.flatMap((key) => filters[key].map((value) => {
            const label = options[key].find((option) => option.value === value)?.label ?? `${value} (unavailable)`;
            return <button type="button" key={`${key}:${value}`} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-800/50 px-2.5 py-1.5 text-left text-xs text-slate-300 wrap-anywhere transition-colors hover:bg-slate-700/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" onClick={() => updateFilters(key, filters[key].filter((item) => item !== value))} aria-label={`Remove ${FILTER_LABELS[key]}: ${label}`}>
              <span><span className="text-slate-500">{FILTER_LABELS[key]}:</span> {label}</span> <span aria-hidden="true" className="text-slate-500">×</span>
            </button>;
          }))}
        </div>}
      </fieldset>
      <p role="status" className="sr-only">{isPending ? "Updating timetable…" : ""}</p>
      {lessons.length > 0 ? <Timetable title="Weekly timetable" lessons={lessons} view={filters.class.length === 1 ? "class" : "teacher"} /> : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
          <h2 className="text-lg font-medium">{!hasLessons ? "No timetable data available" : "No lessons match these filters"}</h2>
          <p className="mt-2 text-sm text-slate-400">{!hasLessons ? "The timetable will appear when lessons are available." : "Remove a filter or choose another combination."}</p>
          {activeCount > 0 && <button type="button" disabled={isPending} className={`${clearButtonClasses} mt-4 inline-flex items-center gap-1.5`} onClick={() => updateFilters()}><FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" className="size-3" />Reset all filters</button>}
        </div>
      )}
    </div>
  );
}
