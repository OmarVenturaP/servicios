import { MessageCircle, Search, SlidersHorizontal } from "lucide-react";

const steps = [
  {
    title: "Busca",
    description: "Encuentra servicios disponibles en tu ciudad.",
    icon: Search,
  },
  {
    title: "Compara",
    description: "Revisa disponibilidad, precio desde y cobertura.",
    icon: SlidersHorizontal,
  },
  {
    title: "Contacta",
    description: "Habla directamente por WhatsApp o llamada.",
    icon: MessageCircle,
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-5 mt-5 mb-17 scroll-mt-5" aria-labelledby="how-it-works-title">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-blue)]">Simple y directo</p>
      <h2 id="how-it-works-title" className="mt-1 text-lg font-semibold tracking-tight text-[var(--brand-navy)]">¿Cómo funciona?</h2>

      <div className="relative mt-4">
        <div className="absolute left-[16%] right-[16%] top-5 h-px bg-gradient-to-r from-emerald-300 via-teal-300 to-blue-300" aria-hidden="true" />
        <ol className="relative grid grid-cols-3 gap-2">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="relative flex min-w-0 flex-col items-center text-center">
              <div className="relative z-10 grid size-10 place-items-center rounded-full border border-[color:color-mix(in_srgb,var(--brand-blue)_16%,white)] bg-white text-[var(--brand-blue)] shadow-sm">
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500">{index + 1}.</span>
                <h3 className="text-sm font-semibold text-[var(--brand-navy)]">{title}</h3>
              </div>
              <p className="mt-1 text-xs leading-4 text-slate-600">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
