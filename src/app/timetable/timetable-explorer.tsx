"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Timetable from "@/app/components/timetable";
import {
  FILTER_KEYS, FILTER_LABELS, type FilterKey, type FilterOption,
  type TimetableFilters, type TimetableResult,
} from "@/lib/timetable-filters";

const clearButtonClasses = "cursor-pointer text-[13px] text-blue-300 underline-offset-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 disabled:cursor-default disabled:text-slate-500 disabled:no-underline";

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
      <summary className="relative cursor-pointer list-none rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 after:absolute after:top-4 after:right-3 after:text-slate-400 after:content-['⌄'] group-open:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 [&::-webkit-details-marker]:hidden">
        <span className="block text-xs font-medium text-slate-400">{label}</span>
        <span className="mt-1 block truncate pr-5 text-sm">
          {selected.length === 0 ? "Any" : selected.length === 1 ? allOptions.find((option) => option.value === selected[0])?.label : `${selected.length} selected`}
        </span>
      </summary>
      <div className={`absolute top-[calc(100%+0.5rem)] left-0 w-76 min-w-full max-w-[calc(100vw-4rem)] rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-xl shadow-black/40 ${["subject", "room", "weekday"].includes(filterKey) ? "sm:max-lg:right-0 sm:max-lg:left-auto" : ""} ${filterKey === "room" ? "lg:max-xl:right-0 lg:max-xl:left-auto" : ""} ${filterKey === "weekday" || filterKey === "period" ? "xl:right-0 xl:left-auto" : ""}`}>
        <input type="search" aria-label={`Search ${label.toLowerCase()} options`} placeholder={`Search ${label.toLowerCase()}…`}
          value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" />
        <button type="button" className={`${clearButtonClasses} my-3`} disabled={selected.length === 0} onClick={() => onChange([])}>Clear {label.toLowerCase()}</button>
        <fieldset className="max-h-64 overflow-y-auto overscroll-contain">
          <legend className="sr-only">{label}: select any matching values</legend>
          {visibleOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 rounded-sm px-1.5 py-2.5 text-[13px] wrap-anywhere hover:bg-slate-800">
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
  const { lessons, options, hasLessons } = data;
  const activeCount = FILTER_KEYS.reduce((total, key) => total + filters[key].length, 0);
  const classCount = new Set(lessons.map((lesson) => lesson.classCode)).size;

  function updateFilters(key?: FilterKey, values: string[] = []) {
    if (isPending) return;
    const url = new URL(window.location.href);
    for (const field of key ? [key] : FILTER_KEYS) url.searchParams.delete(field);
    if (key) for (const value of values) url.searchParams.append(key, value);
    startTransition(() => router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false }));
  }

  return (
    <div aria-busy={isPending}>
      <fieldset disabled={isPending} aria-label="Timetable filters" className="mt-6 min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:p-5 disabled:opacity-60">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Filters {activeCount > 0 && <span className="text-slate-400">({activeCount})</span>}</h2>
          <button type="button" onClick={() => updateFilters()} disabled={activeCount === 0} className={clearButtonClasses}>Reset all filters</button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {FILTER_KEYS.map((key) => <FilterDropdown key={key} filterKey={key} options={options[key]} selected={filters[key]} onChange={(values) => updateFilters(key, values)} />)}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">Choose multiple values in any dropdown. Different filters must all match. Option counts reflect the other filters. Group numbers apply across classes; select a class to narrow them. Select “Whole class” alongside a group to include shared lessons.</p>
        {activeCount > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
          {FILTER_KEYS.flatMap((key) => filters[key].map((value) => {
            const label = options[key].find((option) => option.value === value)?.label ?? `${value} (unavailable)`;
            return <button type="button" key={`${key}:${value}`} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-left text-xs wrap-anywhere hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" onClick={() => updateFilters(key, filters[key].filter((item) => item !== value))} aria-label={`Remove ${FILTER_LABELS[key]}: ${label}`}>
              {FILTER_LABELS[key]}: {label} <span aria-hidden="true">×</span>
            </button>;
          }))}
        </div>}
      </fieldset>
      <p role="status" className="mt-6 text-sm text-slate-400">{isPending ? "Updating timetable…" : `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"} across ${classCount} ${classCount === 1 ? "class" : "classes"}${activeCount === 0 ? " · All lessons" : " · Filtered timetable"}`}</p>
      {lessons.length > 0 ? <Timetable title="Weekly timetable" lessons={lessons} view={filters.class.length === 1 ? "class" : "teacher"} /> : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
          <h2 className="text-lg font-medium">{!hasLessons ? "No timetable data available" : "No lessons match these filters"}</h2>
          <p className="mt-2 text-sm text-slate-400">{!hasLessons ? "The timetable will appear when lessons are available." : "Remove a filter or choose another combination."}</p>
          {activeCount > 0 && <button type="button" disabled={isPending} className={`${clearButtonClasses} mt-4`} onClick={() => updateFilters()}>Reset all filters</button>}
        </div>
      )}
    </div>
  );
}
