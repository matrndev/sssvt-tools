"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faInfo, faXmark } from "@fortawesome/free-solid-svg-icons";

const DESKTOP_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const focusClasses = "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400";

function ProjectDetails() {
  return (
    <>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Tools for everyday life at SSSVT. Explore your timetable by class, group,
        teacher, or room, and save your class and groups for next time.
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
        <span className="text-slate-500">Made by</span>
        <a href="https://matrn.dev" target="_blank" rel="noreferrer"
          className={`inline-flex items-center gap-2 rounded-sm text-slate-200 transition-colors hover:text-blue-400 ${focusClasses}`}>
          matrn.dev
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" className="size-3" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </>
  );
}

export default function ProjectInfo() {
  const [expanded, setExpanded] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const reset = () => {
      setExpanded(false);
      dialog.current?.close();
    };
    media.addEventListener("change", reset);
    return () => media.removeEventListener("change", reset);
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [popupOpen]);

  function expandOnDesktop() {
    if (window.matchMedia(DESKTOP_QUERY).matches) setExpanded(true);
  }

  return (
    <>
      <aside
        aria-label="About this project"
        className={`fixed right-4 bottom-4 z-30 max-w-[calc(100vw-2rem)] overflow-hidden border border-slate-800 bg-slate-900 shadow-lg shadow-black/20 transition-[width,border-radius] duration-300 ease-out motion-reduce:transition-none ${expanded ? "w-80 rounded-2xl" : "w-11 rounded-3xl"}`}
        onMouseEnter={expandOnDesktop}
        onMouseLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) setExpanded(false);
        }}
        onFocus={expandOnDesktop}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            trigger.current?.focus();
            setExpanded(false);
          }
        }}
      >
        <div id="project-info-details" aria-hidden={!expanded} inert={!expanded}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0 overflow-hidden">
            <div className="w-80 max-w-[calc(100vw-2rem)] px-5 pt-5 pb-1">
              <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">About this project</p>
              <h2 className="mt-1 text-lg font-medium text-slate-100">SSSVT Tools</h2>
              <ProjectDetails />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button ref={trigger} type="button" aria-label="About this project"
            aria-expanded={expanded || popupOpen} aria-controls="project-info-details project-info-dialog"
            className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-100 ${focusClasses} focus-visible:-outline-offset-4`}
            onClick={() => {
              if (window.matchMedia(DESKTOP_QUERY).matches) {
                setExpanded(true);
              } else {
                setExpanded(false);
                dialog.current?.showModal();
                setPopupOpen(true);
              }
            }}>
            <FontAwesomeIcon icon={faInfo} aria-hidden="true" className="size-4" />
          </button>
        </div>
      </aside>

      <dialog ref={dialog} id="project-info-dialog" aria-labelledby="project-info-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm"
        onClose={() => setPopupOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">About this project</p>
              <h2 id="project-info-title" className="mt-1 text-xl font-medium">SSSVT Tools</h2>
            </div>
            <button type="button" aria-label="Close project information"
              onClick={() => dialog.current?.close()}
              className={`-mt-2 -mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 ${focusClasses}`}>
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" className="size-4" />
            </button>
          </div>
          <ProjectDetails />
        </div>
      </dialog>
    </>
  );
}
