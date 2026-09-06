import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faComputer } from "@fortawesome/free-solid-svg-icons"
import {
  buildTimetableGrid,
  PERIODS,
  WEEKDAYS,
  getGroupColor,
  type TimetableLesson,
  type TimetableView,
} from "@/lib/timetable";

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
}: TimetableProps) {
  const grid = buildTimetableGrid(lessons);

  return (
    <div className="mt-4 flex min-w-0 max-w-full flex-col gap-4 sm:mt-8 lg:flex-row lg:items-start">
      <div className="min-w-0 w-full max-w-full flex-1 overflow-x-auto overscroll-x-contain rounded-lg border-slate-500 border text-center" role="region" aria-label={title} tabIndex={0}>
        <table className="bg-slate-900 w-full min-w-212 table-fixed border-separate border-spacing-0 text-center text-sm sm:min-w-232 sm:text-base">
          <thead className={"bg-slate-700"}>
            <tr>
                <th scope="col" className="sticky left-0 z-1 w-12 border-slate-500 border-r bg-slate-700 sm:w-14">
                  <span className="sr-only">Day</span>
                </th>
                {PERIODS.map(([start, end], index) => (
                    <th scope="col" key={start} className="border-r border-slate-500 px-1 py-1 text-center last:border-r-0 sm:px-2 sm:py-2">
                        <span className={"block"}>{index + 1}.</span>
                        <span className="block whitespace-nowrap text-[10px] font-light tabular-nums sm:text-xs"><time>{start}</time> – <time>{end}</time></span>
                    </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((day, dayIndex) => (
              <tr key={WEEKDAYS[dayIndex]}>
                <th scope="row" className="sticky left-0 z-1 border-r border-slate-500 border-t bg-slate-700 text-xs sm:text-sm">{WEEKDAYS[dayIndex]}</th>
                {day.map((cell, periodIndex) => (
                  <td key={periodIndex} className={"border-r border-t border-slate-500 p-0 align-top last:border-r-0"}>
                      <div
                        className={`grid auto-rows-fr divide-slate-300 divide-y divide-dashed ${view === "class" ? "[--lesson-height:3rem] sm:[--lesson-height:3.5rem]" : "[--lesson-height:3.5rem] sm:[--lesson-height:4.5rem]"}`}
                        style={{ height: `calc(${Math.max(2, ...day.map((lessons) => lessons.length))} * var(--lesson-height))` }}
                        aria-label={cell.length === 0 ? "No lesson" : undefined}
                      >
                        {cell.map((lesson) => (
                          <div key={lesson.id} className={`relative flex min-h-0 flex-col items-center justify-center px-1 pt-3 pb-1 text-sm sm:px-2 sm:pt-4 ${lesson.subject === "oběd" || lesson.subject === "" ? "bg-slate-900" : "bg-slate-800"}`}>
                            {lesson.group !== null && (
                              <span title={`Group ${lesson.group}`} className={`absolute top-1 left-1 text-[9px] leading-3 sm:text-[11px] rounded p-0.5 ${getGroupColor(lesson.group)}`}>
                                {lesson.group}.
                              </span>
                            )}
                            {lesson.room && (
                                <span
                                    title={`Computer Room ${lesson.room}`}
                                    className={`absolute inline-flex items-center gap-1 text-[9px] leading-3 top-1 right-1 sm:text-[11px] rounded p-0.5 ${lesson.isComputerRoom ? "bg-teal-600/40" : "bg-gray-600/40"}`}
                                >
                                    <span>{lesson.room}</span>
                                </span>
                            )}
                            <strong className="text-sm leading-4 font-semibold sm:text-base sm:leading-5" title={lesson.subjectName ?? undefined}>
                              {lesson.subject === "oběd" ? "" : lesson.subject}
                            </strong>
                            {lesson.teacher && (
                              <Link
                                className="text-[11px] leading-3 hover:underline sm:text-xs sm:leading-4 text-slate-300"
                                prefetch={false}
                                href={"/teachers/" + lesson.teacher}
                                title={lesson.teacherName ?? undefined}
                              >
                                {lesson.teacher}
                              </Link>
                            )}
                            {view !== "class" && <span className="text-[11px] leading-3 text-slate-400 sm:text-xs">{lesson.classCode}</span>}
                          </div>
                        ))}
                      </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
