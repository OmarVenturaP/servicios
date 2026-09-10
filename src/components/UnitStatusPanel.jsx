"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Power, Save, TimerReset, CalendarDays, Plus, X } from "lucide-react";
import Header from "./Header";

const statusContent = {
  disponible: { label: "Disponible", dot: "bg-emerald-500", text: "text-emerald-700" },
  ocupado: { label: "Ocupado", dot: "bg-amber-500", text: "text-amber-700" },
  vencido: { label: "Disponibilidad vencida", dot: "bg-slate-400", text: "text-slate-600" },
  no_disponible: { label: "No disponible", dot: "bg-slate-400", text: "text-slate-600" },
  fuera_horario: { label: "Fuera de horario", dot: "bg-slate-400", text: "text-slate-600" },
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function scheduleFromUnit(unit) {
  return DAYS.map((_, index) => ({ day: index + 1, blocks: unit.schedule.filter((item) => Number(item.day) === index + 1).map((item) => ({ start: String(item.start).slice(0, 5), end: String(item.end).slice(0, 5) })) }));
}

function expirationLabel(unit) {
  if (unit.availabilityMode === "programado" || !unit.stateUntil || !["disponible", "ocupado"].includes(unit.effectiveState)) return null;

  const time = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(unit.stateUntil));

  return `${unit.effectiveState === "ocupado" ? "Ocupado" : "Disponible"} hasta ${time}`;
}

function formatScheduleTime(value) {
  const match = /^(\d{2}):(\d{2})/.exec(value ?? "");
  if (!match) return null;
  const date = new Date(Date.UTC(2026, 0, 1, Number(match[1]), Number(match[2])));
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function nextChangeLabel(unit) {
  if (unit.availabilityMode !== "programado" || !unit.nextAvailability) return null;
  if (unit.nextAvailability.type === "available_now" && unit.nextAvailability.until && /^\d{2}:\d{2}/.test(unit.nextAvailability.until)) {
    const time = formatScheduleTime(unit.nextAvailability.until);
    return time ? `Se desactivará automáticamente a las ${time}.` : null;
  }
  if (unit.nextAvailability.type === "next") {
    const next = new Date(unit.nextAvailability.at);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: unit.timeZone, dateStyle: "short" }).format(new Date());
    const target = new Intl.DateTimeFormat("en-CA", { timeZone: unit.timeZone, dateStyle: "short" }).format(next);
    const time = new Intl.DateTimeFormat("es-MX", { timeZone: unit.timeZone, hour: "numeric", minute: "2-digit" }).format(next);
    return `${today === target ? "Se activará hoy" : "Siguiente disponibilidad"} a las ${time}.`;
  }
  return null;
}

export default function UnitStatusPanel({ token, initialUnit }) {
  const [unit, setUnit] = useState(initialUnit);
  const [price, setPrice] = useState(String(initialUnit.priceBase));
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [schedule, setSchedule] = useState(() => scheduleFromUnit(initialUnit));
  const [duration, setDuration] = useState("1h");
  const status = unit.availabilityReason === "excepcion" && unit.effectiveState === "no_disponible"
    ? { label: "Pausado temporalmente", dot: "bg-amber-500", text: "text-amber-700" }
    : statusContent[unit.effectiveState] ?? statusContent.no_disponible;
  const expiration = expirationLabel(unit);
  const nextChange = nextChangeLabel(unit);

  async function requestUpdate(endpoint, body, successMessage, pendingKey) {
    setPending(pendingKey);
    setFeedback(null);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...body }),
      });
      const result = await response.json();

      if (!response.ok || !result.unit) {
        throw new Error(result.error || "No se pudo completar la acción.");
      }

      setUnit(result.unit);
      setSchedule(scheduleFromUnit(result.unit));
      setPrice(String(result.unit.priceBase));
      setFeedback({ type: "success", message: successMessage });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setPending(null);
    }
  }

  const changeStatus = (action, message) =>
    requestUpdate("/api/unidades/estado", { action }, message, action);

  const savePrice = (event) => {
    event.preventDefault();
    requestUpdate("/api/unidades/precio", { price }, "Precio actualizado.", "precio");
  };

  const updateAvailability = (body, message, key) => requestUpdate("/api/unidades/disponibilidad", body, message, key);
  const saveSchedule = () => updateAvailability({ action: "schedule", schedule: schedule.flatMap((day) => day.blocks.map((block, index) => ({ day: day.day, block: index + 1, ...block }))) }, "Horario actualizado.", "schedule");

  function updateDay(dayNumber, updater) {
    setSchedule((current) => current.map((day) => day.day === dayNumber ? updater(day) : day));
  }

  return (
    <main className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
      <Header />
      <div className="px-5 pb-8 pt-4">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-extrabold text-[var(--brand-blue)]">Servicio en {unit.cityName}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{unit.serviceName}</h1>
          {unit.unitName ? <p className="mt-1 text-base font-medium text-slate-500">{unit.unitName}</p> : null}
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">Tu estado</p>
        <div className={`mt-2 flex items-center gap-2 text-xl font-black ${status.text}`}>
          <span className={`size-3 rounded-full ${status.dot}`} aria-hidden="true" />
          {status.label}
        </div>
        {expiration ? (
          <p className="mt-3 flex items-center gap-2 text-base font-semibold text-slate-700">
            <Clock3 aria-hidden="true" size={18} /> {expiration}
          </p>
        ) : null}
        {nextChange ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><Clock3 aria-hidden="true" size={17} /> {nextChange}</p> : null}
        {unit.effectiveState === "vencido" ? (
          <p className="mt-3 text-sm leading-5 text-slate-500">Activa nuevamente tu disponibilidad para aparecer en la página pública.</p>
        ) : null}
        {unit.availabilityMode === "manual" && unit.effectiveState === "disponible" ? (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => changeStatus("renovar", "Disponibilidad renovada por 3 horas.")}
            className="brand-soft-surface mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-base font-extrabold text-[var(--brand-blue)] transition disabled:cursor-not-allowed disabled:opacity-55"
          >
            <TimerReset aria-hidden="true" size={19} />
            {pending === "renovar" ? "Renovando..." : "Renovar 3 horas"}
          </button>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><CalendarDays size={19} className="text-[var(--brand-blue)]" /><h2 className="font-black text-slate-950">Disponibilidad</h2></div>
        <p className="mt-1 text-sm text-slate-500">Elige cómo quieres aparecer disponible.</p>
        <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Modo de disponibilidad">
          {[{ value: "manual", label: "Manual" }, { value: "programado", label: "Por horario" }].map((mode) => <button key={mode.value} type="button" aria-pressed={unit.availabilityMode === mode.value} disabled={pending !== null} onClick={() => updateAvailability({ action: "mode", mode: mode.value }, `Modo ${mode.label.toLowerCase()} activado.`, `mode-${mode.value}`)} className={`min-h-11 rounded-lg px-2 text-sm font-extrabold ${unit.availabilityMode === mode.value ? "bg-white text-[var(--brand-blue)] shadow-sm ring-1 ring-slate-200" : "text-slate-600"}`}>{mode.label}</button>)}
        </div>

        {unit.availabilityMode === "manual" ? <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm leading-5 text-slate-700">Tu disponibilidad permanece como la indiques hasta que termine el periodo actual o vuelvas a cambiarla.</p> : (
          <>
            <div className="mt-5 grid gap-4">
              {schedule.map((day) => <div key={day.day} className="min-w-0 rounded-xl border border-slate-200 p-3"><div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><p className="font-extrabold text-slate-900">{DAYS[day.day - 1]}</p><button type="button" disabled={day.blocks.length >= 2 || pending !== null} onClick={() => updateDay(day.day, (current) => ({ ...current, blocks: [...current.blocks, { start: "08:00", end: "18:00" }] }))} className="flex min-h-9 shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-[var(--brand-blue)] disabled:opacity-40"><Plus size={15} /> Horario</button></div>{day.blocks.length ? <div className="mt-2 grid min-w-0 gap-2">{day.blocks.map((block, index) => <div key={index} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"><input aria-label={`Inicio ${DAYS[day.day - 1]}`} type="time" value={block.start} onChange={(event) => updateDay(day.day, (current) => ({ ...current, blocks: current.blocks.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item) }))} className="min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-2" /><span aria-hidden="true">—</span><input aria-label={`Fin ${DAYS[day.day - 1]}`} type="time" value={block.end} onChange={(event) => updateDay(day.day, (current) => ({ ...current, blocks: current.blocks.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item) }))} className="min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-2" /><button type="button" aria-label={`Eliminar horario de ${DAYS[day.day - 1]}`} onClick={() => updateDay(day.day, (current) => ({ ...current, blocks: current.blocks.filter((_, itemIndex) => itemIndex !== index) }))} className="col-span-3 flex min-h-9 justify-self-end items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500"><X size={16} /> Eliminar</button></div>)}</div> : <p className="mt-2 text-sm text-slate-400">Cerrado</p>}</div>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => { const monday = schedule[0].blocks; setSchedule((current) => current.map((day) => day.day <= 5 ? { ...day, blocks: monday.map((block) => ({ ...block })) } : day)); }} className="min-h-11 rounded-xl border border-slate-300 px-2 text-xs font-extrabold text-slate-700">Copiar lunes a viernes</button><button type="button" onClick={() => { const first = schedule.find((day) => day.blocks.length)?.blocks ?? []; setSchedule((current) => current.map((day) => ({ ...day, blocks: first.map((block) => ({ ...block })) }))); }} className="min-h-11 rounded-xl border border-slate-300 px-2 text-xs font-extrabold text-slate-700">Usar todos los días</button></div>
            <button type="button" disabled={pending !== null} onClick={saveSchedule} className="brand-primary-action mt-3 min-h-12 w-full rounded-xl px-4 font-extrabold">{pending === "schedule" ? "Guardando..." : "Guardar horario"}</button>
            <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="font-extrabold text-slate-900">Cambio temporal</h3><select aria-label="Duración del cambio temporal" value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"><option value="30m">30 minutos</option><option value="1h">1 hora</option><option value="2h">2 horas</option><option value="indefinido">Hasta que yo lo cambie</option></select><div className="mt-2 grid gap-2"><button type="button" disabled={pending !== null} onClick={() => updateAvailability({ action: "override", state: "no_disponible", duration }, "Disponibilidad pausada temporalmente.", "pause")} className="min-h-11 rounded-xl border border-slate-300 font-extrabold text-slate-700">Pausar disponibilidad</button><button type="button" disabled={pending !== null} onClick={() => updateAvailability({ action: "override", state: "disponible", duration }, "Disponibilidad temporal activada.", "temporary")} className="min-h-11 rounded-xl bg-emerald-500 font-extrabold text-white">Disponible temporalmente</button>{unit.overrideState ? <button type="button" disabled={pending !== null} onClick={() => updateAvailability({ action: "clear_override" }, "Se reanudó tu horario automático.", "clear")} className="min-h-11 text-sm font-extrabold text-[var(--brand-blue)]">Volver al horario automático</button> : null}</div></div>
          </>
        )}
      </section>

      <form onSubmit={savePrice} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="precio-base" className="text-sm font-bold text-slate-500">Precio base</label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-black text-slate-950">$</span>
          <input
            id="precio-base"
            name="precio-base"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="99999999.99"
            step="0.01"
            required
            disabled={pending !== null}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-lg font-bold text-slate-950"
          />
        </div>
        <button type="submit" disabled={pending !== null} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-navy)] px-4 text-base font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55">
          <Save aria-hidden="true" size={18} />
          {pending === "precio" ? "Guardando..." : "Guardar precio"}
        </button>
      </form>

      {unit.availabilityMode === "manual" ? <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500">Cambiar estado</h2>
        <div className="mt-3 grid gap-2.5">
          <button type="button" disabled={pending !== null} onClick={() => changeStatus("disponible", "Ahora estás disponible por 3 horas.")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-base font-extrabold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-55">
            <CheckCircle2 aria-hidden="true" size={19} /> {pending === "disponible" ? "Actualizando..." : "Estoy disponible"}
          </button>
          <button type="button" disabled={pending !== null} onClick={() => changeStatus("ocupado", "Estado ocupado por 1 hora.")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-base font-extrabold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-55">
            <Clock3 aria-hidden="true" size={19} /> {pending === "ocupado" ? "Actualizando..." : "Estoy ocupado"}
          </button>
          <button type="button" disabled={pending !== null} onClick={() => changeStatus("terminar", "Tu disponibilidad terminó.")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-base font-extrabold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55">
            <Power aria-hidden="true" size={19} /> {pending === "terminar" ? "Actualizando..." : "Ya terminé"}
          </button>
        </div>
      </section> : null}

      <div className="min-h-12 pt-4" aria-live="polite">
        {feedback ? (
          <p className={`rounded-xl px-4 py-3 text-sm font-bold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role={feedback.type === "error" ? "alert" : "status"}>
            {feedback.message}
          </p>
        ) : null}
      </div>
      </div>
    </main>
  );
}
