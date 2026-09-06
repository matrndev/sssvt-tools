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
    <main className="mx-auto w-full max-w-300 px-2 sm:px-8">
      <TimetableExplorer data={data} filters={filters} />
    </main>
  );
}
