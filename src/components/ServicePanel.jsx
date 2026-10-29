"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Save, XCircle } from "lucide-react";
import Header from "./Header";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950";
const labelClass = "block text-sm font-bold text-slate-600";
const primaryButton = "brand-primary-action flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold shadow-sm disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

const scheduleDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function ScheduleFields({ initialSchedule = [] }) {
  const [schedule, setSchedule] = useState(() => initialSchedule.map((item) => ({ day: Number(item.day), block: Number(item.block), start: String(item.start).slice(0, 5), end: String(item.end).slice(0, 5) })));
  function blocksFor(day) {
    return schedule.filter((item) => item.day === day).sort((a, b) => a.block - b.block);
  }
  function addBlock(day) {
    const blocks = blocksFor(day);
    if (blocks.length >= 2) return;
    setSchedule((current) => [...current, { day, block: blocks.length + 1, start: blocks.length ? "16:00" : "08:00", end: blocks.length ? "20:00" : "18:00" }]);
  }
  function updateBlock(day, block, field, value) {
    setSchedule((current) => current.map((item) => item.day === day && item.block === block ? { ...item, [field]: value } : item));
  }
  function removeBlock(day, block) {
    setSchedule((current) => current.filter((item) => item.day !== day || item.block !== block).map((item) => item.day === day && item.block > block ? { ...item, block: item.block - 1 } : item));
  }
  return (
    <fieldset className="rounded-2xl border border-slate-200 p-3">
      <legend className="flex items-center gap-2 px-1 text-sm font-bold text-slate-700">
        <CalendarDays size={17} aria-hidden="true" /> Horario semanal
      </legend>
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} readOnly />
      <p className="mt-1 text-xs leading-5 text-slate-500">Configura hasta dos bloques por día. Déjalo cerrado si no atiende.</p>
      <div className="mt-3 grid gap-3">
        {scheduleDays.map((label, index) => {
          const day = index + 1;
          const blocks = blocksFor(day);
          return (
            <div key={day} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-slate-900">{label}</p>
                <button type="button" onClick={() => addBlock(day)} disabled={blocks.length >= 2} className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-extrabold text-[var(--brand-blue)] disabled:opacity-40">+ Horario</button>
              </div>
              {blocks.length ? (
                <div className="mt-2 grid gap-2">
                  {blocks.map((block) => (
                    <div key={block.block} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <input aria-label={`Inicio ${label}`} type="time" className={`${inputClass} mt-0 min-w-0 px-2`} value={block.start} onChange={(event) => updateBlock(day, block.block, "start", event.target.value)} required />
                      <span aria-hidden="true">—</span>
                      <input aria-label={`Fin ${label}`} type="time" className={`${inputClass} mt-0 min-w-0 px-2`} value={block.end} onChange={(event) => updateBlock(day, block.block, "end", event.target.value)} required />
                      <button type="button" onClick={() => removeBlock(day, block.block)} className="col-span-3 min-h-9 justify-self-end px-2 text-xs font-bold text-slate-500">Eliminar</button>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-2 text-xs text-slate-400">Cerrado</p>}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function ServicePanel({ token, initialService }) {
  const [service, setService] = useState(initialService);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const body = {
      token,
      name: formData.get("name"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      shortInformation: formData.get("shortInformation"),
      extendedInformation: formData.get("extendedInformation"),
      coverage: formData.get("coverage"),
      cashPayment: formData.get("cashPayment") === "true",
      cardPayment: formData.get("cardPayment") === "true",
      transferPayment: formData.get("transferPayment") === "true",
      schedule: formData.get("schedule"),
    };

    try {
      const response = await fetch("/api/servicios/panel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result.service) throw new Error(result.error || "No se pudo actualizar el servicio.");
      setService(result.service);
      setFeedback({ type: "success", message: "Servicio y horarios actualizados correctamente." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
      <Header />
      <div className="px-5 pb-8 pt-4">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-extrabold text-[var(--brand-blue)]">Panel de servicio en {service.cityName}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{service.name}</h1>
          <p className="mt-1 text-xs text-slate-500">Administra tu información, métodos de pago y horario semanal.</p>
        </header>

        {feedback ? (
          <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 shadow-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role="alert">
            {feedback.type === "error" ? <XCircle className="mt-0.5 shrink-0" size={18} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={18} />}
            <span className="text-sm font-bold leading-5">{feedback.message}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={`${cardClass} mt-4 grid gap-4`}>
          <h2 className="text-lg font-black text-slate-950">Información del servicio</h2>
          
          <label className={labelClass}>
            Nombre del negocio *
            <input className={inputClass} name="name" defaultValue={service.name} required />
          </label>

          <label className={labelClass}>
            Teléfono
            <input className={inputClass} name="phone" defaultValue={service.phone ?? ""} inputMode="tel" />
          </label>

          <label className={labelClass}>
            WhatsApp
            <input className={inputClass} name="whatsapp" defaultValue={service.whatsapp ?? ""} inputMode="tel" />
          </label>

          <label className={labelClass}>
            Información corta (tarjeta)
            <textarea className={`${inputClass} min-h-20 py-3`} name="shortInformation" maxLength={500} defaultValue={service.shortInformation ?? ""} />
          </label>

          <label className={labelClass}>
            Información extendida (detalle)
            <textarea className={`${inputClass} min-h-28 py-3`} name="extendedInformation" maxLength={4000} defaultValue={service.extendedInformation ?? ""} />
          </label>

          <label className={labelClass}>
            Cobertura
            <textarea className={`${inputClass} min-h-20 py-3`} name="coverage" defaultValue={service.coverage ?? ""} />
          </label>

          <fieldset className="rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-sm font-bold text-slate-600">Métodos de pago aceptados</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-3">
              <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="cashPayment" value="true" defaultChecked={service.cashPayment} className="size-4" /> Efectivo
              </label>
              <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="cardPayment" value="true" defaultChecked={service.cardPayment} className="size-4" /> Tarjeta
              </label>
              <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="transferPayment" value="true" defaultChecked={service.transferPayment} className="size-4" /> Transferencia
              </label>
            </div>
          </fieldset>

          <ScheduleFields key={`schedule-${service.name}`} initialSchedule={service.schedule} />

          <button className={primaryButton} disabled={pending}>
            <Save size={18} /> {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </main>
  );
}
