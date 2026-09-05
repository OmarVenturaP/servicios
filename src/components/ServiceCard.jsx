import { MapPin } from "lucide-react";
import ContactButtons from "./ContactButtons";
import ServiceLogo from "./ServiceLogo";

export default function ServiceCard({ citySlug, service }) {
  const unitLabel = service.availableUnits === 1 ? "1 unidad" : `${service.availableUnits} unidades`;
  const stateDot = service.publicState === "disponible"
    ? { label: "Disponible", className: "bg-emerald-500" }
    : service.publicState === "ocupado"
      ? { label: "Ocupado", className: "bg-amber-400" }
      : { label: "No disponible", className: "bg-red-500" };

  return (
    <article className={`rounded-xl border p-3 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ${service.isAvailable ? "border-slate-100 bg-white" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <ServiceLogo key={service.logoUrl || "fallback"} logoUrl={service.logoUrl} serviceName={service.name} available={service.isAvailable} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`size-2.5 shrink-0 rounded-full ring-2 ring-white ${stateDot.className}`} title={stateDot.label} aria-label={`Estado: ${stateDot.label}`} />
            <h3 className="truncate text-[0.93rem] font-black leading-tight text-slate-950">{service.name}</h3>
          </div>
          <p className="mt-1 truncate text-[0.72rem] text-slate-600">{service.description}</p>
          <p className={`mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.7rem] font-bold ${service.isAvailable ? "text-emerald-600" : "text-slate-500"}`}>
            <span>{service.isAvailable ? "Disponible ahora" : "No disponible por el momento"}</span>
            <span className="font-semibold text-slate-400" aria-label={service.isAvailable ? `${unitLabel} disponibles` : "0 unidades disponibles"}>
              · {unitLabel}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-slate-500">
            <MapPin aria-hidden="true" size={12} /> {service.coverage || "Cobertura no especificada"}
          </p>
        </div>
      </div>
      <div className="mt-2.5 border-t border-slate-100 pt-2.5">
        {service.isAvailable ? (
          <div>
            <p className="text-xs text-slate-600">
              Desde <strong className="ml-1 text-lg font-black text-slate-950">${service.priceFrom}</strong>
            </p>
            <p className="mt-0.5 max-w-100 text-[0.58rem] leading-3 text-slate-400">Puede variar según distancia y tipo de servicio.</p>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-500">Precio no disponible</p>
        )}
      </div>
      <ContactButtons
        citySlug={citySlug}
        serviceSlug={service.slug}
        priceShown={service.priceFrom}
        disabled={!service.isAvailable}
      />
    </article>
  );
}
