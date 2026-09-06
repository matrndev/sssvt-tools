"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_STORAGE_KEY, type OnboardingClass } from "@/lib/onboarding";

export default function OnboardingForm({ classes }: { classes: OnboardingClass[] }) {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const groups = classes.find((option) => option.classCode === selectedClass)?.groups ?? [];
    const canSubmit = !!selectedClass && (groups.length === 0 || selectedGroups.length > 0);

    function startApp(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canSubmit || isSaving) return;
        try {
            window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
                classCode: selectedClass,
                groups: selectedGroups,
            }));
        } catch {
            setError("Your selections could not be saved. Allow local storage in your browser and try again.");
            return;
        }
        setError("");
        setIsSaving(true);
        router.push("/timetable");
    }

    const toggleGroup = (group: number) => {
        setSelectedGroups((groups) =>
            groups.includes(group)
                ? groups.filter((selectedGroup) => selectedGroup !== group)
                : [...groups, group],
        );
    };

    return (
        <main className="flex min-h-dvh w-full items-center justify-center px-4 py-8 sm:px-6">
            <section className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-black/10 sm:p-8">
                <form onSubmit={startApp} className="space-y-6">
                    <div>
                        <label htmlFor="onboarding-class" className="mb-2 block text-lg font-medium text-slate-200">
                            Select your class
                        </label>
                        <div className="relative">
                            <select
                                id="onboarding-class"
                                name="class"
                                autoComplete="off"
                                value={selectedClass}
                                required
                                onChange={(event) => {
                                    setSelectedClass(event.target.value);
                                    setSelectedGroups([]);
                                }}
                                className="min-h-12 w-full cursor-pointer appearance-none rounded-lg border border-slate-700/60 bg-slate-900 px-3 py-3 pr-10 text-sm text-slate-100 scheme-dark transition-colors invalid:text-slate-400 hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400"
                            >
                                <option value="" disabled>Select your class</option>
                                {classes.map(({ classCode }) => <option key={classCode} value={classCode}>{classCode}</option>)}
                            </select>
                            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500">
                                <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    {selectedClass && groups.length > 0 && (
                        <fieldset>
                            <legend className="text-lg font-medium text-slate-200">Select your groups</legend>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {groups.map((group) => (
                                    <label key={group} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-3 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/60 has-checked:border-blue-400/50 has-checked:bg-blue-400/10 has-checked:text-slate-100">
                                        <input
                                            type="checkbox"
                                            name="groups"
                                            value={group}
                                            autoComplete="off"
                                            checked={selectedGroups.includes(group)}
                                            onChange={() => toggleGroup(group)}
                                            className="size-4 shrink-0 accent-blue-400 scheme-dark focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400"
                                        />
                                        Group {group}
                                    </label>
                                ))}
                            </div>
                        </fieldset>)}

                    {selectedClass && <p className="text-sm text-slate-400">Whole-class lessons are included automatically.</p>}
                    {classes.length === 0 && <p role="status" className="text-sm text-slate-400">No classes are available yet.</p>}
                    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                    <button
                        type="submit"
                        disabled={!canSubmit || isSaving}
                        className="min-h-12 w-full cursor-pointer rounded-lg bg-blue-400 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-blue-300 active:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400"
                    >
                        {isSaving ? "Starting app…" : "Start app"}
                    </button>
                </form>
            </section>
        </main>
    );
}
