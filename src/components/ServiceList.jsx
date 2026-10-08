import { Bike, Cctv, Droplet, Ellipsis, Package, Plug, Snowflake, Sparkles, Wrench } from "lucide-react";
import ServiceCard from "./ServiceCard";

const icons = { bike: Bike, cctv: Cctv, droplet: Droplet, ellipsis: Ellipsis, package: Package, plug: Plug, snowflake: Snowflake, sparkles: Sparkles, wrench: Wrench };

export default function ServiceList({ citySlug, services, categoryName = "servicios", categoryIcon = "bike" }) {
  const EmptyIcon = icons[categoryIcon] ?? Ellipsis;
  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--brand-blue)_22%,white)] bg-white px-5 py-8 text-center">
        <EmptyIcon className="mx-auto text-[var(--brand-blue)]" aria-hidden="true" size={28} />
        <p className="mt-3 text-sm font-extrabold text-[var(--brand-navy)]">No se encuentra ningún servicio</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Todavía no hay proveedores de {categoryName.toLocaleLowerCase("es-MX")} visibles en esta ciudad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service, index) => (
        <ServiceCard key={service.id} citySlug={citySlug} service={service} resultPosition={index + 1} categoryIcon={categoryIcon} />
      ))}
    </div>
  );
}
