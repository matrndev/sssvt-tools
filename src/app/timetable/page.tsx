import type { Metadata } from "next";
import { getTimetable } from "@/lib/timetable-data";
import { FILTER_KEYS, readTimetableFilters, readTimetableFilterMode } from "@/lib/timetable-filters";
import TimetableExplorer from "./timetable-explorer";

export const metadata: Metadata = { title: "Timetable | SSSVT Tools" };
export const runtime = "nodejs";

export default async function TimetablePage({ searchParams }: PageProps<"/timetable">) {
  const params = await searchParams;
  const filters = readTimetableFilters(params);
  const mode = readTimetableFilterMode(params.mode, filters);
  // The client gate resolves local defaults before querying an unfiltered timetable.
  if (!FILTER_KEYS.some((key) => filters[key].length) && params.view !== "all" && mode !== "advanced") return null;
  const showSubstitutions = params.substitutions === "true";
  const data = await getTimetable(filters, mode, showSubstitutions);

  return (
    <main className="mx-auto w-full max-w-300 px-2 sm:px-8">
      <TimetableExplorer data={data} filters={filters} mode={mode} showSubstitutions={showSubstitutions} />
    </main>
  );
}
