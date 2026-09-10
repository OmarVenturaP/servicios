import { Bike } from "lucide-react";
import ServiceCard from "./ServiceCard";

export default function ServiceList({ citySlug, services }) {
  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--brand-blue)_22%,white)] bg-white px-5 py-8 text-center">
        <Bike className="mx-auto text-[var(--brand-blue)]" aria-hidden="true" size={28} />
        <p className="mt-3 text-sm font-extrabold text-[var(--brand-navy)]">Sin servicios publicados</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Todavía no hay motomandados visibles en esta ciudad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service, index) => (
        <ServiceCard key={service.id} citySlug={citySlug} service={service} resultPosition={index + 1} />
      ))}
    </div>
  );
}
