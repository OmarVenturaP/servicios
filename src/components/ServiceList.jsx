import { Bike } from "lucide-react";
import ServiceCard from "./ServiceCard";

export default function ServiceList({ services }) {
  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-5 py-8 text-center">
        <Bike className="mx-auto text-blue-600" aria-hidden="true" size={28} />
        <p className="mt-3 text-sm font-extrabold text-[#101a5c]">Directorio en preparación</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Los servicios reales aparecerán aquí próximamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => <ServiceCard key={service.id} service={service} />)}
    </div>
  );
}
