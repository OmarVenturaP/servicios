import { Bike, MapPin } from "lucide-react";

export default function ServiceCard({ service }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_5px_18px_rgba(15,23,42,0.09)]">
      <div className="flex gap-3">
        <div className={`grid size-[4.3rem] shrink-0 place-items-center rounded-full ${service.accent}`}>
          <Bike className="text-white" aria-hidden="true" size={35} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[0.93rem] font-black leading-tight text-slate-950">{service.name}</h3>
          <p className="mt-1 truncate text-[0.72rem] text-slate-600">{service.description}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.72rem] font-bold text-emerald-600">
            <span className="size-2 rounded-full bg-emerald-500" /> Disponible ahora
          </p>
          <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-slate-500">
            <MapPin aria-hidden="true" size={12} /> {service.coverage}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <p className="text-xs text-slate-600">
          Desde <strong className="ml-1 text-lg font-black text-slate-950">${service.priceFrom}</strong>
        </p>
        <button
          type="button"
          disabled
          className="min-h-9 rounded-lg bg-blue-600 px-5 text-xs font-extrabold text-white shadow-sm disabled:cursor-not-allowed"
        >
          Ver servicio
        </button>
      </div>
    </article>
  );
}
