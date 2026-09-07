"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import Timetable from "@/app/components/timetable";
import { defaultTimetableFilters } from "@/lib/onboarding";
import { useTimetablePreferences } from "./preferences-gate";
import {
  FILTER_KEYS, FILTER_LABELS, readTimetableFilters, updateEasyTimetableFilters,
  type FilterKey, type FilterOption, type TimetableFilterMode, type TimetableFilters, type TimetableResult,
} from "@/lib/timetable-filters";

const clearButtonClasses = "cursor-pointer text-xs text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 disabled:cursor-default disabled:text-slate-600";

function FilterDropdown({ filterKey, options, selected, onChange, easy = false, disabled = false }: {
  filterKey: FilterKey;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  easy?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  const label = FILTER_LABELS[filterKey];
  const single = easy && filterKey !== "group";
  const compact = easy && filterKey === "group";
  const allOptions = [...options, ...selected.filter((value) => !options.some((option) => option.value === value))
    .map((value) => ({ value, label: `${value} (unavailable)`, count: 0 }))];
  const visibleOptions = allOptions.filter((option) =>
    (option.count > 0 || selected.includes(option.value)) && !(compact && option.value === "whole")
    && `${option.label} ${option.value}`.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")));
  const selectedGroups = selected.filter((value) => value !== "whole");
  const selectionLabel = compact
    ? selected.length === 0 ? "All groups" : selectedGroups.length === 0 ? "Whole class only" : selectedGroups.join(", ")
    : selected.length === 0 ? easy ? `Choose ${filterKey === "class" ? "a class" : filterKey === "room" ? "a room" : "a teacher"}` : "Any"
      : selected.length === 1 ? allOptions.find((option) => option.value === selected[0])?.label : `${selected.length} selected`;

  function closeDropdown() {
    if (details.current) {
      details.current.open = false;
      details.current.querySelector("summary")?.focus();
    }
  }

  return (
    <details ref={details} className="group relative min-w-0 open:z-20" name="timetable-filter"
      onToggle={(event) => { if (!event.currentTarget.open) setQuery(""); }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => { if (event.key === "Escape") closeDropdown(); }}>
      <summary aria-disabled={disabled} tabIndex={disabled ? -1 : 0}
        onClick={(event) => { if (disabled) event.preventDefault(); }}
        className={`flex min-h-11 list-none gap-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 [&::-webkit-details-marker]:hidden ${disabled ? "cursor-default opacity-40" : "cursor-pointer"} ${easy
          ? `rounded-lg py-1 ${compact ? "items-center" : "flex-col items-start"} ${!disabled ? "hover:text-blue-300 group-open:text-blue-300" : ""}`
          : `items-center rounded-lg border px-3 py-2.5 text-sm hover:border-slate-600 hover:bg-slate-800/60 group-open:border-slate-500 group-open:bg-slate-800/70 ${selected.length > 0 ? "border-slate-600 bg-slate-800/60 text-slate-100" : "border-slate-700/60 bg-slate-900/40 text-slate-400"}`}`}>
        {easy ? (
          <>
            <span className={`text-xs text-slate-400 ${compact ? "shrink-0" : "order-2"}`}>Filter by {filterKey}</span>
            <span className={`flex min-w-0 items-center gap-2 ${compact ? "text-sm" : "w-full text-2xl font-medium tracking-tight sm:text-3xl"} ${selected.length > 0 ? "text-blue-200" : "text-slate-400"}`}>
              <span className="min-w-0 truncate" title={selectionLabel}>{selectionLabel}</span>
              <Chevron />
            </span>
          </>
        ) : (
          <>
            <span className="shrink-0">{label}</span>
            <span className="min-w-0 flex-1 truncate text-right text-xs text-slate-300">{selectionLabel}</span>
            <Chevron />
          </>
        )}
      </summary>
      <div className={`absolute top-[calc(100%+0.5rem)] left-0 w-76 min-w-full max-w-[calc(100vw-3rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl shadow-black/30 ${["teacher", "room", "period", "subject"].includes(filterKey) ? "sm:right-0 sm:left-auto" : ""}`}>
        <input type="search" aria-label={`Search ${label.toLowerCase()} options`} placeholder={`Search ${label.toLowerCase()}…`}
          value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" />
        <button type="button" className={`${clearButtonClasses} my-3 min-h-8`} disabled={selected.length === 0}
          onClick={() => { onChange([]); if (single) closeDropdown(); }}>{compact ? "Show all groups" : `Clear ${label.toLowerCase()}`}</button>
        {compact && <p className="mb-2 text-xs text-slate-400">Whole-class lessons are always included.</p>}
        <fieldset className="mt-2 max-h-64 overflow-y-auto overscroll-contain">
          <legend className="sr-only">{label}: {single ? "choose one" : "select any matching values"}</legend>
          {visibleOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2.5 text-[13px] wrap-anywhere transition-colors hover:bg-slate-800 has-checked:bg-blue-400/10 has-checked:text-blue-200">
              <input type={single ? "radio" : "checkbox"} name={single ? `timetable-${filterKey}` : undefined} className="size-4 shrink-0 accent-blue-400 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" checked={selected.includes(option.value)}
                onChange={(event) => {
                  onChange(single ? [option.value] : event.target.checked ? [...selected, option.value] : selected.filter((value) => value !== option.value));
                  if (single) closeDropdown();
                }} />
              <span className="min-w-0 flex-1">{option.label}</span>
              {!easy && <span className="text-xs tabular-nums text-slate-400" aria-label={`${option.count} matching lessons`}>{option.count}</span>}
            </label>
          ))}
          {visibleOptions.length === 0 && <p className="p-3 text-sm text-slate-400">No options found.</p>}
        </fieldset>
      </div>
    </details>
  );
}

function Chevron() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function TimetableExplorer({ data, filters, mode }: { data: TimetableResult; filters: TimetableFilters; mode: TimetableFilterMode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const preferences = useTimetablePreferences();
  const defaults = defaultTimetableFilters(preferences);
  const { lessons, options, hasLessons } = data;
  const activeCount = FILTER_KEYS.reduce((total, key) => total + filters[key].length, 0);
  const isAdvanced = mode === "advanced";
  const resetLabel = <span>Reset to defaults<span className="block text-xs text-slate-400">{preferences.groups.length > 0 ? `${preferences.classCode}, groups ${preferences.groups.join(", ")}` : "whole class"}</span></span>;

  function replaceFilters(next: TimetableFilters, nextMode = mode) {
    if (isPending) return;
    const url = new URL(window.location.href);
    for (const key of FILTER_KEYS) {
      url.searchParams.delete(key);
      for (const value of next[key]) url.searchParams.append(key, value);
    }
    if (nextMode === "advanced") url.searchParams.set("mode", "advanced");
    else url.searchParams.delete("mode");
    // An intentionally cleared timetable must not immediately reapply defaults.
    if (FILTER_KEYS.some((field) => next[field].length > 0)) url.searchParams.delete("view");
    else url.searchParams.set("view", "all");
    startTransition(() => router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false }));
  }

  function updateFilters(key: FilterKey, values: string[]) {
    replaceFilters(isAdvanced ? { ...filters, [key]: values } : updateEasyTimetableFilters(filters, key, values));
  }

  function resetToDefaults() {
    replaceFilters(defaults);
  }

  function toggleMode() {
    replaceFilters(isAdvanced ? defaults : readTimetableFilters({}), isAdvanced ? "easy" : "advanced");
  }

  function dropdown(key: FilterKey) {
    return <FilterDropdown key={`${mode}-${key}`} filterKey={key} options={options[key]} selected={filters[key]}
      easy={!isAdvanced} disabled={isPending || (!isAdvanced && key === "group" && filters.class.length === 0)} onChange={(values) => updateFilters(key, values)} />;
  }

  return (
    <div aria-busy={isPending}>
      <fieldset disabled={isPending} aria-label="Timetable filters" className="mt-6 min-w-0 rounded-2xl border border-slate-800 bg-slate-900/30 p-4 disabled:opacity-60 sm:p-6">
        <div className="flex justify-end">
          <button type="button" onClick={resetToDefaults} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400">
            <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" className="size-3.5 text-slate-400" />{resetLabel}
          </button>
        </div>
        <p id="filter-mode-description" className="sr-only">
          {isAdvanced ? "Combine any filters to find the lessons you need." : "Choose a class, room or teacher. Choosing another replaces your current filter."}
        </p>
        <div id="timetable-filter-controls" className="mt-6">
          {isAdvanced ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {FILTER_KEYS.map(dropdown)}
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" disabled={activeCount === 0} onClick={() => replaceFilters(readTimetableFilters({}))} className={`${clearButtonClasses} inline-flex min-h-9 items-center gap-1.5`}><FontAwesomeIcon icon={faTrash} aria-hidden="true" className="size-3" />Clear all filters</button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              <div className="min-w-0">
                {dropdown("class")}
                <div className="mt-1 border-l-2 border-slate-700/60 pl-3">{dropdown("group")}</div>
              </div>
              <div className="min-w-0 border-t border-slate-800 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">{dropdown("room")}</div>
              <div className="min-w-0 border-t border-slate-800 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">{dropdown("teacher")}</div>
            </div>
          )}
        </div>
        {isAdvanced && activeCount > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Active filters">
          {FILTER_KEYS.flatMap((key) => filters[key].map((value) => {
            const label = options[key].find((option) => option.value === value)?.label ?? `${value} (unavailable)`;
            return <button type="button" key={`${key}:${value}`} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800/50 px-2.5 py-1.5 text-left text-xs text-slate-300 wrap-anywhere transition-colors hover:bg-slate-700/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400" onClick={() => updateFilters(key, filters[key].filter((item) => item !== value))} aria-label={`Remove ${FILTER_LABELS[key]}: ${label}`}>
              <span><span className="text-slate-500">{FILTER_LABELS[key]}:</span> {label}</span><span aria-hidden="true" className="text-slate-500">×</span>
            </button>;
          }))}
        </div>}
        <div className="mt-4 flex justify-end border-t border-slate-800/60 pt-3">
          <button type="button" role="switch" aria-checked={isAdvanced} aria-label="Advanced mode" aria-describedby="filter-mode-description" aria-controls="timetable-filter-controls" onClick={toggleMode}
            className="group/mode inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-1 text-[11px] text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400">
            <span aria-hidden="true" className={!isAdvanced ? "text-slate-300" : undefined}>Easy</span>
            <span aria-hidden="true" className={`flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${isAdvanced ? "bg-blue-400/60" : "bg-slate-700 group-hover/mode:bg-slate-600"}`}>
              <span className={`size-3 rounded-full bg-slate-200 transition-transform motion-reduce:transition-none ${isAdvanced ? "translate-x-3" : "translate-x-0"}`} />
            </span>
            <span aria-hidden="true" className={isAdvanced ? "text-slate-300" : undefined}>Advanced</span>
          </button>
        </div>
      </fieldset>
      <p role="status" className="sr-only">{isPending ? "Updating timetable…" : ""}</p>
      {lessons.length > 0 ? <Timetable title="Weekly timetable" lessons={lessons} view={filters.class.length === 1 ? "class" : "teacher"} filterMode={mode} /> : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
          <h2 className="text-lg font-medium">{!hasLessons ? "No timetable data available" : "No lessons match these filters"}</h2>
          <p className="mt-2 text-sm text-slate-400">{!hasLessons ? "The timetable will appear when lessons are available." : isAdvanced ? "Remove a filter or choose another combination." : "Choose another class, room or teacher, or return to your saved timetable."}</p>
          <button type="button" disabled={isPending} className={`${clearButtonClasses} mt-4 inline-flex min-h-11 items-center gap-2 text-left`} onClick={resetToDefaults}><FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" className="size-3" />{resetLabel}</button>
        </div>
      )}
    </div>
  );
}
