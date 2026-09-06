import type { Metadata } from "next";
import Link from "next/link";
import Timetable from "@/app/components/timetable";
import { getTimetable } from "@/lib/timetable-data";
import { timetableHref, type TimetableView } from "@/lib/timetable";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Rozvrh hodin | SSSVT Tools",
  description: "Rozvrhy tříd, učeben a učitelů SSSVT.",
};

export const runtime = "nodejs";

export default async function TimetablePage({ searchParams }: PageProps<"/timetable">) {
  // Awaiting searchParams makes this route dynamic: query PostgreSQL on every request.
  const params = await searchParams;
  const { classes, lessons } = await getTimetable();
  const rooms = [...new Set(lessons.flatMap((lesson) => lesson.room ? [lesson.room] : []))]
    .sort((a, b) => a.localeCompare(b, "cs", { numeric: true }));
  const teachers = [...new Set(lessons.flatMap((lesson) => lesson.teacher ? [lesson.teacher] : []))]
    .sort((a, b) => a.localeCompare(b, "cs"));

  const navigation: { view: TimetableView; label: string; values: string[] }[] = [
    { view: "class", label: "Třídy", values: classes.map((item) => item.code) },
    { view: "room", label: "Učebny", values: rooms },
    { view: "teacher", label: "Kantoři", values: teachers },
  ];
  const selected = navigation.find(({ view }) => typeof params[view] === "string" && params[view] !== "");
  const value = selected ? params[selected.view] as string : undefined;
  const validSelection = selected && value ? selected.values.includes(value) : true;
  const selectedLessons = selected?.view === "room"
    ? lessons.filter((lesson) => lesson.room === value)
    : lessons.filter((lesson) => lesson.teacher === value);

  return (
    <main lang="cs" className={styles.page}>
      {!validSelection ? (
        <p className={styles.notice}>Vybraný rozvrh nebyl nalezen. Vyberte třídu, učebnu nebo učitele ze seznamu.</p>
      ) : lessons.length === 0 ? (
        <p className={styles.notice}>Rozvrh zatím neobsahuje žádné hodiny.</p>
      ) : selected && selected.view !== "class" ? (
        <Timetable
          title={selected.view === "room" ? `Rozvrh učebny ${value}` : `Rozvrh učitele ${value}`}
          view={selected.view}
          lessons={selectedLessons}
        />
      ) : (
        classes.filter((item) => !selected || item.code === value).map((item) => (
          <Timetable
            key={item.code}
            title={`Rozvrh třídy ${item.code}`}
            classTeacher={item.classTeacher}
            homeClassroom={item.homeClassroom}
            lessons={lessons.filter((lesson) => lesson.classCode === item.code)}
          />
        ))
      )}
    </main>
  );
}
