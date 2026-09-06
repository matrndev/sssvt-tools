import Link from "next/link";
import {
  buildTimetableGrid,
  PERIODS,
  timetableHref,
  WEEKDAYS,
  type TimetableLesson,
  type TimetableView,
} from "@/lib/timetable";
import styles from "./timetable.module.css";

type TimetableProps = {
  title: string;
  lessons: TimetableLesson[];
  view?: TimetableView;
  classTeacher?: string | null;
  homeClassroom?: string | null;
};

export default function Timetable({
  title,
  lessons,
  view = "class",
  classTeacher,
  homeClassroom,
}: TimetableProps) {
  const grid = buildTimetableGrid(lessons);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {(classTeacher || homeClassroom) && (
        <p className={styles.metadata}>
          {classTeacher && <span>Třídní učitel: {classTeacher}</span>}
          {homeClassroom && <span>Kmenová učebna: {homeClassroom}</span>}
        </p>
      )}
      {lessons.length === 0 && <p className={styles.metadata}>Pro tento rozvrh zatím nejsou dostupné hodiny.</p>}
      <div className={styles.scroll} role="region" aria-label={title} tabIndex={0}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>{title} — pondělí až pátek</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.day}><span className={styles.srOnly}>Den</span></th>
              {PERIODS.map(([start, end], index) => (
                <th scope="col" key={start}>
                  <span className={styles.period}>{index + 1}</span>
                  <span className={styles.time}><time>{start}</time> – <time>{end}</time></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((day, dayIndex) => (
              <tr key={WEEKDAYS[dayIndex]}>
                <th scope="row" className={styles.day}>{WEEKDAYS[dayIndex]}</th>
                {day.map((cell, periodIndex) => (
                  <td key={periodIndex}>
                    {cell.length === 0 ? (
                      <span className={styles.empty} aria-label="Volná hodina">—</span>
                    ) : (
                      <div className={styles.lessons}>
                        {cell.map((lesson) => (
                          <div key={lesson.id} className={`${styles.lesson} ${lesson.subject === "oběd" ? styles.lunch : ""}`}>
                            <div>
                              <strong title={lesson.subjectName ?? undefined}>{lesson.subject}</strong>
                              {lesson.group !== null && <span className={styles.group}> ({lesson.group}.sk)</span>}
                            </div>
                            {view !== "class" && (
                              <Link prefetch={false} href={timetableHref("class", lesson.classCode)}>{lesson.classCode}</Link>
                            )}
                            {(lesson.teacher || lesson.room) && (
                              <div className={styles.details}>
                                {lesson.teacher && (
                                  <Link prefetch={false} href={timetableHref("teacher", lesson.teacher)} title={lesson.teacherName ?? undefined}>
                                    {lesson.teacher}
                                  </Link>
                                )}
                                {lesson.room && <span> (<Link prefetch={false} href={timetableHref("room", lesson.room)}>{lesson.room}</Link>)</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
