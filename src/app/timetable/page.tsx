import type { Metadata } from "next";
import { getTimetable } from "@/lib/timetable-data";
import { readTimetableFilters } from "@/lib/timetable-filters";
import TimetableExplorer from "./timetable-explorer";

export const metadata: Metadata = { title: "Timetable | SSSVT Tools" };
export const runtime = "nodejs";

export default async function TimetablePage({ searchParams }: PageProps<"/timetable">) {
  const filters = readTimetableFilters(await searchParams);
  const data = await getTimetable(filters);

  return (
    <main className="mx-auto w-full max-w-400 px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Timetable</h1>
      <p className="mt-2 text-sm text-slate-400">Explore the weekly timetable. Combine filters to find exactly the lessons you need.</p>
      <TimetableExplorer data={data} filters={filters} />
    </main>
  );
}
