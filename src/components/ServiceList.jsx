import { Bike } from "lucide-react";
import ServiceCard from "./ServiceCard";

export default function ServiceList({ services, totals }) {
  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-5 py-8 text-center">
        <Bike className="mx-auto text-blue-600" aria-hidden="true" size={28} />
        <p className="mt-3 text-sm font-extrabold text-[#101a5c]">Sin servicios publicados</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Todavía no hay motomandados visibles en esta ciudad.</p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-2.5 text-[0.7rem] font-semibold text-slate-500">
        {totals.services} {totals.services === 1 ? "servicio" : "servicios"}
        <span aria-hidden="true"> · </span>
        {totals.availableUnits} {totals.availableUnits === 1 ? "unidad disponible" : "unidades disponibles"}
      </p>
      <div className="space-y-3">
        {services.map((service) => <ServiceCard key={service.id} service={service} />)}
      </div>
    </>
  );
}
