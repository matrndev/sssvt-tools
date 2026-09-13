import Link from "next/link";
import type { TimetableFilterMode } from "@/lib/timetable-filters";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faComputer, faTriangleExclamation, faUtensils } from "@fortawesome/free-solid-svg-icons"
import {
  buildTimetableGrid,
  PERIODS,
  WEEKDAYS,
  getGroupColor,
  getLunchDescription,
  type TimetableLesson,
  type TimetableView,
} from "@/lib/timetable";

type TimetableProps = {
  title: string;
  lessons: TimetableLesson[];
  view?: TimetableView;
  filterMode?: TimetableFilterMode;
  classTeacher?: string | null;
  homeClassroom?: string | null;
};

export default function Timetable({
  title,
  lessons,
  view = "class",
  filterMode = "easy",
}: TimetableProps) {
  const grid = buildTimetableGrid(lessons);
  const filterHref = (key: "teacher" | "room" | "class", value: string) => {
    const params = new URLSearchParams({ [key]: value });
    if (filterMode === "advanced") params.set("mode", "advanced");
    return `?${params}`;
  };

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
                        className="grid auto-rows-fr divide-slate-600 divide-y divide-dashed [--lesson-height:3rem] sm:[--lesson-height:3.5rem]"
                        style={{ height: `calc(${Math.max(2, ...day.map((lessons) => lessons.length))} * var(--lesson-height))` }}
                        aria-label={cell.length === 0 ? "No lesson" : undefined}
                      >
                        {cell.map((lesson) => (
                          <div key={lesson.id} className={`relative flex min-h-0 flex-col items-center justify-center px-1 pt-3 pb-1 text-sm sm:px-2 ${lesson.subject === "oběd" ? "sm:pt-3" : "sm:pt-1"} ${lesson.subject === "oběd" || lesson.subject === "" ? "bg-slate-900" : "bg-slate-800"}`}>
                            {lesson.group !== null && (
                              <span title={`Group ${lesson.group}`} className={`absolute top-1 left-1 text-[9px] leading-3 sm:text-[11px] rounded p-0.5 ${getGroupColor(lesson.group)}`}>
                                {lesson.group}.
                              </span>
                            )}
                            {lesson.room && (
                                <Link
                                    href={filterHref("room", lesson.room)}
                                    prefetch={false}
                                    title={lesson.isComputerRoom ? `Computer Room ${lesson.room}` : `Room ${lesson.room}`}
                                    className={`hover:underline absolute inline-flex items-center gap-1 text-[9px] leading-3 top-1 right-1 sm:text-[11px] rounded p-0.5 ${lesson.requiresRoomTransfer ? "font-bold border" : ""} ${lesson.room === lesson.homeClassroom ? "bg-purple-600/40 border-purple-600" : lesson.isComputerRoom ? "bg-teal-600/40 border-teal-600" : "bg-gray-600/40 border-gray-600"}`}
                                >
                                    <span>{lesson.room}</span>
                                </Link>
                            )}
                            <p className="leading-4 sm:leading-5">
                              {lesson.subject === "oběd" ? (
                                <>
                                  <FontAwesomeIcon icon={faUtensils} className="text-lg sm:text-xl" /><br/>
                                  <span title={getLunchDescription(lesson.otherLunchClasses)} aria-label={getLunchDescription(lesson.otherLunchClasses)} className="text-[11px] leading-3 sm:text-xs text-slate-300">+{lesson.otherLunchClasses.length}</span>
                                </>
                              ) : (
                                <span className="font-semibold text-base sm:text-lg">{lesson.subject}</span>
                              )}
                            </p>
                            {lesson.teacher && (
                              <Link
                                className="text-[11px] leading-3 hover:underline sm:text-xs sm:leading-4 text-slate-300"
                                prefetch={false}
                                href={filterHref("teacher", lesson.teacher)}
                                title={lesson.teacherName ?? undefined}
                              >
                                {lesson.teacher}
                              </Link>
                            )}
                            {view !== "class" && (
                              <Link
                                    href={filterHref("class", lesson.classCode)}
                                    prefetch={false}
                                    title={`Class ${lesson.classCode}`}
                                    className={`hover:underline absolute bottom-1 left-1 rounded bg-gray-600/40 p-0.5 text-[9px] leading-3 sm:text-[11px]`}
                                >
                                    <span>{lesson.classCode}</span>
                                </Link>
                            )}
                            {/* {lesson.isComputerRoom && (
                              <span title="Computer room" className="absolute bottom-1 right-1 inline-flex h-4 items-center rounded bg-yellow-600/40 p-0.5 text-[9px] leading-3 sm:text-[11px]">
                                <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden="true" />
                                <span className="sr-only">Computer room</span>
                              </span>
                            )} */}
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
