"use client";

import { useState } from "react";
import Link from "next/link";
import type { TimetableFilterMode } from "@/lib/timetable-filters";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUtensils } from "@fortawesome/free-solid-svg-icons"
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
  showToolbar?: boolean;
  showSubstitutions?: boolean;
  onToggleSubstitutions?: () => void;
  substitutionsPending?: boolean;
  classTeacher?: string | null;
  homeClassroom?: string | null;
};

export default function Timetable({
  title,
  lessons,
  view = "class",
  filterMode = "easy",
  showToolbar = false,
  showSubstitutions = false,
  onToggleSubstitutions,
  substitutionsPending = false,
}: TimetableProps) {
  const [highlightSubjects, setHighlightSubjects] = useState(true);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const grid = buildTimetableGrid(lessons);
  const filterHref = (key: "teacher" | "room" | "class", value: string) => {
    const params = new URLSearchParams({ [key]: value });
    if (filterMode === "advanced") params.set("mode", "advanced");
    if (showSubstitutions) params.set("substitutions", "true");
    return `?${params}`;
  };

  return (
    <div className="mt-4 min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-slate-500 sm:mt-8">
      {showToolbar && (
        <div className="flex flex-wrap justify-end gap-x-3 border-b border-slate-500 bg-slate-500/30 px-3 sm:px-4">
          {onToggleSubstitutions && <button type="button" role="switch" aria-checked={showSubstitutions}
            disabled={substitutionsPending} onClick={onToggleSubstitutions}
            className="group/substitutions mr-auto inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-xs text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 disabled:cursor-wait disabled:opacity-60 sm:text-sm">
            <span>Show substitutions</span>
            <span aria-hidden="true" className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${showSubstitutions ? "bg-yellow-400/60 group-hover/substitutions:bg-yellow-400/70" : "bg-slate-700 group-hover/substitutions:bg-slate-600"}`}>
              <span className={`size-4 rounded-full bg-slate-200 transition-transform motion-reduce:transition-none ${showSubstitutions ? "translate-x-4" : "translate-x-0"}`} />
            </span>
          </button>}
          <button type="button" role="switch" aria-checked={highlightSubjects}
            onClick={() => setHighlightSubjects((enabled) => !enabled)}
            className="group/highlight inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-xs text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400 sm:text-sm">
            <span>Highlight on hover</span>
            <span aria-hidden="true" className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${highlightSubjects ? "bg-blue-400/60 group-hover/highlight:bg-blue-400/70" : "bg-slate-700 group-hover/highlight:bg-slate-600"}`}>
              <span className={`size-4 rounded-full bg-slate-200 transition-transform motion-reduce:transition-none ${highlightSubjects ? "translate-x-4" : "translate-x-0"}`} />
            </span>
          </button>
        </div>
      )}
      <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain text-center" role="region" aria-label={title} tabIndex={0}>
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
                          <div key={lesson.id}
                            title={lesson.isSubstitution ? lesson.substitutionNote || "Changed lesson" : undefined}
                            onPointerEnter={(event) => {
                              if (event.pointerType !== "touch") {
                                setHoveredSubject(highlightSubjects && lesson.subject.trim() && lesson.subject !== "oběd" ? lesson.subject : null);
                              }
                            }}
                            onPointerLeave={() => setHoveredSubject(null)}
                            onPointerCancel={() => setHoveredSubject(null)}
                            className={`relative flex min-h-0 flex-col items-center justify-center px-1 pt-3 pb-1 text-sm sm:px-2 ${lesson.subject === "oběd" ? "sm:pt-3" : "sm:pt-1"} ${lesson.isSubstitution ? "bg-yellow-500/30" : lesson.subject === "oběd" || lesson.subject === "" ? "bg-slate-900" : "bg-slate-800"}`}>
                            {lesson.isSubstitution && <span className="sr-only">Substitution{lesson.substitutionNote ? `: ${lesson.substitutionNote}` : ""}. </span>}
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none absolute inset-0 z-10 ${highlightSubjects && hoveredSubject === lesson.subject ? "border-2 border-blue-400" : ""}`}
                            />
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
                                <span className="font-semibold text-base sm:text-lg">{lesson.subject || (lesson.isSubstitution ? "—" : "")}</span>
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
