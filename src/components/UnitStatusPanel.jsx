"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Power, Save, TimerReset } from "lucide-react";

const statusContent = {
  disponible: { label: "Disponible", dot: "bg-emerald-500", text: "text-emerald-700" },
  ocupado: { label: "Ocupado", dot: "bg-amber-500", text: "text-amber-700" },
  vencido: { label: "Disponibilidad vencida", dot: "bg-slate-400", text: "text-slate-600" },
  no_disponible: { label: "No disponible", dot: "bg-slate-400", text: "text-slate-600" },
};

function expirationLabel(unit) {
  if (!unit.stateUntil || !["disponible", "ocupado"].includes(unit.effectiveState)) return null;

  const time = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(unit.stateUntil));

  return `${unit.effectiveState === "ocupado" ? "Ocupado" : "Disponible"} hasta ${time}`;
}

export default function UnitStatusPanel({ token, initialUnit }) {
  const [unit, setUnit] = useState(initialUnit);
  const [price, setPrice] = useState(String(initialUnit.priceBase));
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const status = statusContent[unit.effectiveState] ?? statusContent.no_disponible;
  const expiration = expirationLabel(unit);

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

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-slate-50 px-4 py-6 sm:my-8 sm:min-h-0 sm:rounded-[2rem] sm:border sm:border-slate-200 sm:px-6 sm:py-8 sm:shadow-xl">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-extrabold text-blue-700">Servicios {unit.cityName}</p>
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
        {unit.effectiveState === "vencido" ? (
          <p className="mt-3 text-sm leading-5 text-slate-500">Activa nuevamente tu disponibilidad para aparecer en la página pública.</p>
        ) : null}
        {unit.effectiveState === "disponible" ? (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => changeStatus("renovar", "Disponibilidad renovada por 3 horas.")}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-base font-extrabold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <TimerReset aria-hidden="true" size={19} />
            {pending === "renovar" ? "Renovando..." : "Renovar 3 horas"}
          </button>
        ) : null}
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
        <button type="submit" disabled={pending !== null} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-base font-extrabold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55">
          <Save aria-hidden="true" size={18} />
          {pending === "precio" ? "Guardando..." : "Guardar precio"}
        </button>
      </form>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
      </section>

      <div className="min-h-12 pt-4" aria-live="polite">
        {feedback ? (
          <p className={`rounded-xl px-4 py-3 text-sm font-bold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role={feedback.type === "error" ? "alert" : "status"}>
            {feedback.message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
