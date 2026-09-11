"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function EmergenciesError({ reset }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef1f6] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-xl">
        <AlertTriangle className="mx-auto text-red-600" aria-hidden="true" size={34} />
        <h1 className="mt-4 text-xl font-black text-[var(--brand-navy)]">No pudimos consultar los contactos</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">La información no está disponible en este momento. Intenta nuevamente.</p>
        <button type="button" onClick={() => reset()} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white"><RotateCw aria-hidden="true" size={17} /> Reintentar</button>
      </section>
    </main>
  );
}
