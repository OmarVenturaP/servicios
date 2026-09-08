import { ArrowRight, Sparkles } from "lucide-react";
import { pilotWhatsappUrl, siteConfig } from "@/config/site";

export default function PilotInvitation() {
  return (
    <section className="brand-soft-surface mx-5 mb-5 overflow-hidden rounded-2xl border p-5 shadow-[0_8px_24px_rgba(37,99,235,0.08)]" aria-labelledby="pilot-title">
      <h2 id="pilot-title" className="mt-2 text-lg font-semibold tracking-tight text-[var(--brand-navy)]">Unete al piloto!</h2>
      <p className="mt-2 text-sm leading-5 text-slate-600">¿Quieres ofrecer tu servicio de mandaditos? Únete sin ningún compromiso durante 30 días.</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">Solicita información aquí 👇🏻.</p>
      <a href={pilotWhatsappUrl()} target="_blank" rel="noreferrer" className="brand-primary-action mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition">
        Unirme al piloto <ArrowRight aria-hidden="true" size={17} />
      </a>
    </section>
  );
}
