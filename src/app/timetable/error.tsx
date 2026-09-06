"use client";

export default function TimetableError() {
  return (
    <main lang="cs" className="mx-auto w-full max-w-360 p-8">
      <h1 className="text-2xl font-semibold">Rozvrh se nepodařilo načíst</h1>
      <p className="mt-3 text-slate-400">Data jsou dočasně nedostupná. Zkuste stránku načíst znovu.</p>
      <button className="mt-6 cursor-pointer rounded border border-slate-600 px-4 py-2 hover:bg-slate-800" onClick={() => window.location.reload()}>
        Zkusit znovu
      </button>
    </main>
  );
}
