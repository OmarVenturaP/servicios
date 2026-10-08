"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Banknote, Clock3, CreditCard, MapPin, X } from "lucide-react";
import ContactButtons from "./ContactButtons";
import ServiceLogo from "./ServiceLogo";
import { sendAnalyticsEvent } from "@/lib/analytics-client";
import { scheduleLabel } from "@/domain/service-schedule";

const IMPRESSION_WINDOW_MS = 30 * 60 * 1000;

export default function ServiceCard({ citySlug, service, resultPosition, categoryIcon }) {
  const cardRef = useRef(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const key = `servicios:impression:${citySlug}:${service.slug}`;
    try {
      const previous = Number(sessionStorage.getItem(key));
      if (previous && Date.now() - previous < IMPRESSION_WINDOW_MS) return;
    } catch { }
    let timer;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
      timer = window.setTimeout(() => {
        try { sessionStorage.setItem(key, String(Date.now())); } catch { }
        sendAnalyticsEvent({ citySlug, serviceSlug: service.slug, event: "service_impression", resultPosition });
        observer.disconnect();
      }, 600);
    }, { threshold: [0.5] });
    observer.observe(element);
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, [citySlug, resultPosition, service.isAvailable, service.slug]);
  const unitLabel = service.availableUnits === 1 ? "1 unidad" : `${service.availableUnits} unidades`;
  const isBusinessService = service.operationMode === "servicio";
  const stateDot = service.publicState === "disponible"
    ? { label: "Disponible", className: "bg-emerald-500" }
    : service.publicState === "ocupado"
      ? { label: "Ocupado", className: "bg-amber-400" }
      : { label: "No disponible", className: "bg-red-500" };

  return (
    <>
      <article ref={cardRef} data-nosnippet={service.isDevelopment ? "" : undefined} className={`rounded-xl border p-3 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ${service.isAvailable ? "border-slate-100 bg-white" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-start gap-3">
          <ServiceLogo key={service.logoUrl || `fallback-${categoryIcon}`} logoUrl={service.logoUrl} serviceName={service.name} available={service.isAvailable} categoryIcon={categoryIcon} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex min-w-0 items-center gap-2">
              {!isBusinessService ? <span className={`size-2.5 shrink-0 rounded-full ring-2 ring-white ${stateDot.className}`} title={stateDot.label} aria-hidden="true" /> : null}
              <h3 className="truncate text-[0.93rem] font-black leading-tight text-slate-950">{service.name}</h3>
            </div>
            {service.shortInformation ? <p className="mt-1 overflow-hidden text-xs leading-5 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{service.shortInformation}</p> : null}
            {isBusinessService ? <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-bold ${service.todaySchedule?.open ? "text-emerald-700" : service.todaySchedule ? "text-slate-600" : "text-[var(--brand-blue)]"}`}><span className={`size-2 shrink-0 rounded-full ${service.todaySchedule?.open ? "bg-emerald-500" : service.todaySchedule ? "bg-slate-400" : "bg-[var(--brand-blue)]"}`} aria-hidden="true" />{service.todaySchedule ? (service.todaySchedule.open ? "Abierto ahora" : "Cerrado") : "Información y contacto"}</p> : <p className={`mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-bold ${service.isAvailable ? "text-emerald-700" : "text-slate-600"}`}>
              <span>{service.isAvailable ? "Disponible ahora" : "No disponible por el momento"}</span>
              <span className="font-semibold text-slate-600">· {unitLabel}</span>
            </p>}
            {service.todaySchedule ? <span className=" flex items-start gap-2 border-t border-slate-100 pt-1 text-xs font-semibold leading-5 text-slate-600">
              <Clock3 className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden="true" size={15} /><span>
                {service.todaySchedule.closed ? "cerrado" : scheduleLabel(service.todaySchedule.blocks)}</span></span> : null}
            <p className="mt-1 flex items-center gap-1 text-xs leading-5 text-slate-500">
              <MapPin aria-hidden="true" size={12} /> {service.coverage || "Cobertura no especificada"}
            </p>
            {service.cashPayment || service.cardPayment || service.transferPayment ? <div className="mt-1.5 flex items-center gap-2 text-slate-500" aria-label="Métodos de pago aceptados">
              {service.cashPayment ? <Banknote aria-label="Efectivo" size={16} /> : null}
              {service.cardPayment ? <CreditCard aria-label="Tarjeta" size={16} /> : null}
              {service.transferPayment ? <ArrowLeftRight aria-label="Transferencia" size={16} /> : null}
            </div> : null}
          </div>
        </div>
        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
          {isBusinessService ? <p className="text-xs font-semibold text-slate-500">Consulta disponibilidad y cotización al contactar.</p> : service.isAvailable ? (
            <div>
              <p className="text-xs text-slate-600">
                Desde <strong className="ml-1 text-lg font-black text-slate-950">${service.priceFrom}</strong>
              </p>
              <p className="mt-0.5 max-w-100 text-xs leading-4 text-slate-500">Puede variar según distancia y tipo de servicio.</p>
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-500">Precio no disponible</p>
          )}
        </div>
        {isBusinessService ? <button type="button" onClick={() => setDetailsOpen(true)} className="mt-2.5 flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-blue)] px-3 text-xs font-extrabold text-white">Ver información</button> : <ContactButtons
          citySlug={citySlug}
          serviceSlug={service.slug}
          priceShown={service.priceFrom}
          resultPosition={resultPosition}
          disabled={!service.isAvailable}
        />}
      </article>
      {isBusinessService && detailsOpen ? <div role="dialog" aria-modal="true" aria-label={`Información de ${service.name}`} className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-3 sm:place-items-center" onMouseDown={() => setDetailsOpen(false)}>
        <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-slate-950">{service.name}</h3><p className="mt-1 text-xs font-bold text-[var(--brand-blue)]">{service.categoryNames.join(" · ")}</p></div><button type="button" onClick={() => setDetailsOpen(false)} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
          {service.extendedInformation ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{service.extendedInformation}</p> : null}
          <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600"><MapPin size={15} />{service.coverage || "Cobertura no especificada"}</p>
          <ContactButtons citySlug={citySlug} serviceSlug={service.slug} priceShown={null} resultPosition={resultPosition} disabled={false} />
        </section>
      </div> : null}
    </>
  );
}
