"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, KeyRound, XCircle } from "lucide-react";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950";
const labelClass = "block text-sm font-bold text-slate-600";
const primaryButton = "brand-primary-action flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold shadow-sm disabled:cursor-not-allowed disabled:opacity-50";

export default function RegistrationForm({ cityId, cityName, categories = [], contactModes = [] }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(categories[0] ? [categories[0].id] : []);

  const selectedCategory = categories.find((c) => selectedCategoryIds.includes(c.id));
  const requiresUnits = selectedCategory ? selectedCategory.requiresUnits : true;

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const data = {
      cityId,
      contactModeId: formData.get("contactModeId"),
      categoryIds: formData.getAll("categoryIds"),
      service: {
        name: formData.get("service.name"),
        phone: formData.get("service.phone"),
        whatsapp: formData.get("service.whatsapp"),
        coverage: formData.get("service.coverage"),
        shortInformation: formData.get("service.shortInformation"),
        extendedInformation: formData.get("service.extendedInformation"),
        cashPayment: formData.get("service.cashPayment") === "true",
        cardPayment: formData.get("service.cardPayment") === "true",
        transferPayment: formData.get("service.transferPayment") === "true",
      },
      unit: {
        name: formData.get("unit.name") || "Unidad 1",
        phone: formData.get("unit.phone") || formData.get("service.phone"),
        whatsapp: formData.get("unit.whatsapp") || formData.get("service.whatsapp"),
        priceBase: formData.get("unit.priceBase"),
      },
    };

    try {
      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo completar el registro.");
      setSuccessResult(result);
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setPending(false);
    }
  }

  if (successResult) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-lg text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-950">¡Registro exitoso!</h2>
        <p className="mt-2 text-sm font-semibold text-slate-700">Creaste tu servicio, ingresa a tu panel para administrar horarios en {cityName}.</p>

        {(() => {
          const privateUrl = successResult?.privateUrl || successResult?.access?.privateUrl;
          return privateUrl ? (
            <div className="brand-soft-surface mt-6 rounded-2xl border p-4 text-left">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--brand-blue)]">Tu enlace privado de administración</p>
              <p className="mt-2 break-all text-xs font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800">{privateUrl}</p>
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs leading-5 text-amber-900 font-semibold">
                ⚠️ <strong>Guarda muy bien tu enlace privado.</strong> Es tu único acceso a tu panel administrativo; si lo pierdes, deberás contactar al administrador para que te proporcione uno nuevo.
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(privateUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    } catch { }
                  }}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Copy size={17} /> {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <Link href={privateUrl} className={primaryButton}>
                  <KeyRound size={17} /> Ingresar a mi panel
                </Link>
              </div>
            </div>
          ) : null;
        })()}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Datos del servicio</h2>

      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-bold text-slate-600">Categoría</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {categories.map((category) => {
            const checked = selectedCategoryIds.includes(category.id);
            return (
              <label key={category.id} className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${checked ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/5 text-[var(--brand-blue)]" : "border-slate-200 bg-white text-slate-700"}`}>
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  checked={checked}
                  onChange={() => setSelectedCategoryIds([category.id])}
                  className="size-4"
                />
                {category.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className={labelClass}>
        Nombre del servicio o negocio *
        <input className={inputClass} name="service.name" required placeholder="Ej. Motomandados Rápido" />
      </label>

      <label className={labelClass}>
        Modo de contacto
        <select className={inputClass} name="contactModeId" required>
          {contactModes.map((mode) => (
            <option key={mode.id} value={mode.id}>{mode.name}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Teléfono de contacto
        <input className={inputClass} name="service.phone" inputMode="tel" placeholder="Ej. 9611234567" />
      </label>

      <label className={labelClass}>
        WhatsApp de contacto *
        <input className={inputClass} name="service.whatsapp" inputMode="tel" required placeholder="Ej. 9611234567" />
      </label>

      <label className={labelClass}>
        Información corta (para la tarjeta)
        <textarea className={`${inputClass} min-h-20 py-3`} name="service.shortInformation" maxLength={500} placeholder="Ej. Servicio rápido en toda la ciudad." />
      </label>

      <label className={labelClass}>
        Cobertura
        <input className={inputClass} name="service.coverage" placeholder="Ej. Centro, barrios y alrededores." />
      </label>

      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-bold text-slate-600">Métodos de pago aceptados</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" name="service.cashPayment" value="true" defaultChecked className="size-4" /> Efectivo
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" name="service.cardPayment" value="true" className="size-4" /> Tarjeta
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" name="service.transferPayment" value="true" className="size-4" /> Transferencia
          </label>
        </div>
      </fieldset>

      {requiresUnits ? (
        <>
          <h3 className="mt-2 border-t border-slate-200 pt-4 text-base font-black text-slate-950">Información de la unidad / precio</h3>
          <label className={labelClass}>
            Precio base inicial ($) *
            <input className={inputClass} name="unit.priceBase" type="number" step="0.01" min="1" required placeholder="Ej. 40.00" />
          </label>
        </>
      ) : null}

      {feedback ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <button className={primaryButton} disabled={pending}>
        {pending ? "Registrando..." : "Registrarme sin costo"}
      </button>
    </form>
  );
}
