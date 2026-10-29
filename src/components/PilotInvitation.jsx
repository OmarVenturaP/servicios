import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PilotInvitation({ citySlug = "tonala" }) {
  return (
    <section className="brand-soft-surface mx-5 mb-5 overflow-hidden rounded-2xl border p-5 shadow-[0_8px_24px_rgba(37,99,235,0.08)]" aria-labelledby="pilot-title">
      <h2 id="pilot-title" className="mt-2 text-lg font-semibold tracking-tight text-[var(--brand-navy)]">¡Regístrate sin costo!</h2>
      <p className="mt-2 text-sm leading-5 text-slate-600">Ofrece tu servicio en la plataforma totalmente gratis. Cada proveedor cuenta con su propio panel administrativo para gestionar su información, unidades y precios.</p>
      <Link href={`/${citySlug}/registro`} className="brand-primary-action mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition">
        Unirme a servicios <ArrowRight aria-hidden="true" size={17} />
      </Link>
    </section>
  );
}
