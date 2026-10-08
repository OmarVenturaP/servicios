"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import BrandMark from "./BrandMark";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950";
const buttonClass = "brand-primary-action min-h-11 rounded-xl px-4 text-sm font-bold disabled:opacity-50";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

function AdForm({ ad, cities, cityId, pending, onSave, onCancel }) {
  return <form onSubmit={onSave} className={`${cardClass} grid gap-4`}>
    <h2 className="text-lg font-semibold text-[var(--brand-navy)]">{ad ? "Editar anuncio" : "Nuevo anuncio"}</h2>
    <input type="hidden" name="id" value={ad?.id ?? ""} />
    <label className="text-sm font-medium">Ciudad<select name="cityId" defaultValue={ad?.cityId ?? cityId} required className={inputClass}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}</select></label>
    <label className="text-sm font-medium">Título descriptivo<input name="title" defaultValue={ad?.title ?? ""} maxLength={160} required className={inputClass} placeholder="Ejemplo: Servitec — sitios web profesionales" /></label>
    <label className="text-sm font-medium">Enlace de destino<input name="destinationUrl" type="url" defaultValue={ad?.destinationUrl ?? ""} maxLength={2048} required className={inputClass} placeholder="https://..." /></label>
    <p className="-mt-2 text-xs leading-5 text-slate-500">Página web con HTTPS o WhatsApp: https://wa.me/ seguido del código de país y teléfono, sin + ni espacios.</p>
    {ad?.imageUrl ? <Image src={ad.imageUrl} alt={ad.title} width={1200} height={240} className="aspect-[5/1] w-full rounded-xl object-contain" /> : null}
    <label className="text-sm font-medium">{ad ? "Reemplazar imagen (opcional)" : "Imagen del anuncio"}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!ad} className={`${inputClass} py-2`} /></label>
    <p className="-mt-2 text-xs leading-5 text-slate-500">Imagen horizontal 5:1. Recomendado: 1200 × 240 px, menos de 150 KB. JPG, PNG o WebP estático, máximo 3 MB.</p>
    <label className="text-sm font-medium">Orden<input name="order" type="number" min="0" max="2147483647" step="1" defaultValue={ad?.order ?? 0} required className={inputClass} /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Desde (opcional)<input name="startDate" type="date" defaultValue={ad?.startDate ?? ""} className={inputClass} /></label>
      <label className="text-sm font-medium">Hasta (opcional)<input name="endDate" type="date" defaultValue={ad?.endDate ?? ""} className={inputClass} /></label>
    </div>
    <p className="-mt-2 text-xs leading-5 text-slate-500">Días completos, incluida la fecha final, según la zona horaria de la ciudad. Sin fechas: sin límite de vigencia.</p>
    <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input name="active" type="checkbox" defaultChecked={ad?.active ?? false} className="size-5" /> Anuncio activo</label>
    <div className="flex gap-3"><button disabled={pending} className={`${buttonClass} flex-1`}>{pending ? "Guardando..." : "Guardar anuncio"}</button><button type="button" disabled={pending} onClick={onCancel} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm">Cancelar</button></div>
  </form>;
}

export default function AdminAdvertisementsPanel() {
  const [accessKey, setAccessKey] = useState("");
  const [data, setData] = useState(null);
  const [cityId, setCityId] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function execute(form) {
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/publicidad", { method: "POST", headers: { "x-admin-key": accessKey }, body: form });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo completar la operación.");
      setData(result.data);
      if (!cityId && result.data.cities[0]) setCityId(String(result.data.cities[0].id));
      return true;
    } catch (error) {
      setFeedback({ error: true, message: error.message });
      return false;
    } finally { setPending(false); }
  }

  async function login(event) {
    event.preventDefault();
    const form = new FormData();
    form.set("action", "bootstrap");
    await execute(form);
  }

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("action", "save");
    if (await execute(form)) {
      setEditing(null); setCreating(false);
      setFeedback({ error: false, message: "Anuncio guardado. Solo aparecerá si está activo y dentro de su vigencia." });
    }
  }

  return <div className="min-h-screen bg-[#eef1f6] px-4 py-8"><main className="mx-auto max-w-xl">
    <div className="mb-6 flex items-center justify-between gap-3"><BrandMark /><Link href="/admin" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium">Volver</Link></div>
    <h1 className="mb-4 text-2xl font-semibold text-[var(--brand-navy)]">Administrar publicidad</h1>
    {feedback ? <p role={feedback.error ? "alert" : "status"} className={`mb-4 rounded-xl p-3 text-sm ${feedback.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{feedback.message}</p> : null}
    {!data ? <form onSubmit={login} className={`${cardClass} grid gap-4`}><label className="text-sm font-medium">Clave de acceso<input type="password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} required autoComplete="off" className={inputClass} /></label><button disabled={pending} className={buttonClass}>{pending ? "Validando..." : "Entrar"}</button></form> : <>
      {!creating && !editing ? <>
        <label className="block text-sm font-medium">Ciudad<select className={inputClass} value={cityId} onChange={(event) => setCityId(event.target.value)}>{data.cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}</select></label>
        <button disabled={!cityId || pending} type="button" className={`${buttonClass} my-4 w-full`} onClick={() => setCreating(true)}>Nuevo anuncio</button>
        <div className="grid gap-4">{data.ads.filter((ad) => ad.cityId === Number(cityId)).map((ad) => <article key={ad.id} className={cardClass}>
          <Image src={ad.imageUrl} alt={ad.title} width={1200} height={240} className="aspect-[5/1] w-full rounded-xl object-contain" />
          <h2 className="mt-3 font-semibold">{ad.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{ad.active ? "Activo" : "Oculto"} · Orden {ad.order}</p>
          <p className="mt-1 text-xs text-slate-500">Vigencia: {ad.startDate ?? "sin inicio"} — {ad.endDate ?? "sin fin"}</p>
          <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-xs text-[var(--brand-blue)]">{ad.destinationUrl}</a>
          <button type="button" disabled={pending} onClick={() => setEditing(ad)} className="mt-3 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-medium">Editar / activar / ocultar</button>
        </article>)}</div>
        {!data.ads.some((ad) => ad.cityId === Number(cityId)) ? <p className={`${cardClass} text-sm text-slate-500`}>Todavía no hay anuncios para esta ciudad.</p> : null}
      </> : <AdForm key={editing?.id ?? "new"} ad={editing} cities={data.cities} cityId={cityId} pending={pending} onSave={save} onCancel={() => { setCreating(false); setEditing(null); }} />}
    </>}
  </main></div>;
}
