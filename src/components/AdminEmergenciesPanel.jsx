"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Pencil, Plus, ShieldCheck, Siren, X } from "lucide-react";
import BrandMark from "./BrandMark";
import { EMERGENCY_CONTACT_TYPES, EMERGENCY_TYPE_LABELS } from "@/domain/emergency-contacts";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950";
const primaryButton = "brand-primary-action flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold shadow-sm disabled:opacity-50";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

function Field({ label, name, defaultValue = "", type = "text", required = false, children }) {
  return <label className="block text-sm font-bold text-slate-600">{label}{children ?? <input name={name} defaultValue={defaultValue ?? ""} type={type} required={required} className={inputClass} />}</label>;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function todayInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function ContactForm({ cities, contact, pending, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className={`${cardClass} grid gap-3`}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-[var(--brand-navy)]">{contact ? "Editar contacto" : "Nuevo borrador"}</h2><button type="button" onClick={onCancel} className="grid size-10 place-items-center rounded-xl text-slate-500" aria-label="Cancelar"><X size={19} /></button></div>
      <Field label="Ciudad" name="cityId"><select name="cityId" defaultValue={contact?.cityId ?? cities[0]?.id} required className={inputClass}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}</select></Field>
      <Field label="Institución o línea" name="name" defaultValue={contact?.name} required />
      <Field label="Tipo" name="type"><select name="type" defaultValue={contact?.type ?? "general"} required className={inputClass}>{EMERGENCY_CONTACT_TYPES.map((type) => <option key={type} value={type}>{EMERGENCY_TYPE_LABELS[type]}</option>)}</select></Field>
      <Field label="Teléfono normalizado" name="phone" defaultValue={contact?.phone} required />
      <p className="-mt-2 text-xs leading-5 text-slate-500">Internacional: + seguido de 10 a 15 dígitos. México también admite 911, 089, 088 y 078.</p>
      <Field label="Extensión" name="extension" defaultValue={contact?.extension} />
      <Field label="¿Para qué sirve este número?" name="description"><textarea name="description" defaultValue={contact?.description ?? ""} className={`${inputClass} min-h-24 py-3`} placeholder="Describe brevemente el alcance y los casos en los que debe utilizarse." /></Field>
      <Field label="Horario confirmado" name="schedule" defaultValue={contact?.schedule} />
      <Field label="Fuente oficial (URL)" name="sourceUrl" defaultValue={contact?.sourceUrl} type="url" />
      <Field label="Orden" name="order" defaultValue={contact?.order ?? 0} type="number" required />
      <button disabled={pending} className={primaryButton}>{pending ? "Guardando..." : contact ? "Guardar cambios" : "Crear borrador"}</button>
    </form>
  );
}

export default function AdminEmergenciesPanel() {
  const [accessKey, setAccessKey] = useState("");
  const [data, setData] = useState(null);
  const [cityId, setCityId] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const contacts = useMemo(() => data?.contacts.filter((contact) => !cityId || contact.cityId === Number(cityId)) ?? [], [cityId, data]);

  async function execute(action, payload = {}) {
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/emergencias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessKey, action, ...payload }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo completar la operación.");
      setData(result.data);
      if (!cityId && result.data.cities[0]) setCityId(String(result.data.cities[0].id));
      return result;
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
      throw error;
    } finally {
      setPending(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    try { await execute("bootstrap"); } catch {}
  }

  async function save(event) {
    event.preventDefault();
    try {
      await execute(editing ? "update" : "create", { contactId: editing?.id, data: formData(event.currentTarget) });
      setEditing(null);
      setCreating(false);
      setFeedback({ type: "success", message: editing ? "Contacto actualizado. Si cambió un dato sujeto a revisión quedó oculto y sin verificación." : "Borrador creado. Verifica la fuente antes de publicarlo." });
    } catch {}
  }

  async function verify(contact) {
    const city = data.cities.find((item) => item.id === contact.cityId);
    const verifiedAt = window.prompt("Fecha real en que revisaste el teléfono (AAAA-MM-DD):", todayInTimeZone(city?.timeZone ?? "America/Mexico_City"));
    if (!verifiedAt) return;
    try { await execute("verify", { contactId: contact.id, verifiedAt }); setFeedback({ type: "success", message: "Verificación registrada. Ahora puedes publicar el contacto." }); } catch {}
  }

  async function visibility(contact, visible) {
    try { await execute("visibility", { contactId: contact.id, visible }); setFeedback({ type: "success", message: visible ? "Contacto publicado." : "Contacto ocultado." }); } catch {}
  }

  if (!data) return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8"><main className="relative mx-auto grid min-h-screen w-full place-items-center bg-[#fbfcff] px-5 py-10 shadow-xl sm:max-w-[430px] sm:rounded-[2.25rem]"><form onSubmit={login} className={`${cardClass} w-full max-w-sm p-6`}><BrandMark /><span className="mt-6 grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600"><KeyRound /></span><p className="mt-4 text-sm font-extrabold text-red-600">Panel master</p><h1 className="mt-1 text-2xl font-black text-[var(--brand-navy)]">Administrar Emergencias</h1><Field label="Clave de acceso" name="accessKey"><input type="password" autoComplete="off" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} required className={inputClass} /></Field><button disabled={pending} className={`${primaryButton} mt-4`}>{pending ? "Validando..." : "Entrar"}</button>{feedback ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{feedback.message}</p> : null}</form></main></div>
  );

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8"><main className="relative mx-auto min-h-screen w-full bg-[#fbfcff] shadow-xl sm:max-w-[430px] sm:rounded-[2.25rem]"><div className="px-5 pb-10 pt-6"><div className="flex items-center justify-between"><BrandMark /><Link href="/admin" className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white" aria-label="Volver a administración"><ArrowLeft size={20} /></Link></div><div className="mt-6 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-red-600 text-white"><Siren size={22} /></span><div><p className="text-xs font-extrabold uppercase tracking-wide text-red-600">Administración</p><h1 className="text-2xl font-black text-[var(--brand-navy)]">Emergencias</h1></div></div>
      {feedback ? <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm font-bold ${feedback.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{feedback.message}</p> : null}
      <label className="mt-5 block text-sm font-bold text-slate-600">Ciudad<select className={inputClass} value={cityId} onChange={(event) => setCityId(event.target.value)}>{data.cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}</select></label>
      {!creating && !editing ? <button type="button" onClick={() => setCreating(true)} className={`${primaryButton} mt-4`}><Plus size={18} /> Nuevo contacto</button> : null}
      <div className="mt-4">{creating || editing ? <ContactForm cities={data.cities} contact={editing} pending={pending} onSubmit={save} onCancel={() => { setCreating(false); setEditing(null); }} /> : contacts.length ? <div className="grid gap-3">{contacts.map((contact) => <article key={contact.id} className={cardClass}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wide text-red-600">{EMERGENCY_TYPE_LABELS[contact.type]}</p><h2 className="mt-1 font-black text-[var(--brand-navy)]">{contact.name}</h2><p className="mt-1 text-sm font-bold text-slate-600">{contact.phone}{contact.extension ? ` · Ext. ${contact.extension}` : ""}</p></div><span className={`rounded-full px-2 py-1 text-[0.65rem] font-black ${contact.visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{contact.visible ? "Publicado" : "Oculto"}</span></div><p className="mt-2 text-xs text-slate-500">Orden {contact.order} · {contact.verifiedAt ? `Verificado ${contact.verifiedAt.slice(0, 10)}` : "Sin verificar"}</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={pending} onClick={() => setEditing(contact)} className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-300 text-sm font-bold"><Pencil size={15} /> Editar</button><button type="button" disabled={pending} onClick={() => verify(contact)} className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-[var(--brand-blue)]"><ShieldCheck size={15} /> Verificar</button><button type="button" disabled={pending} onClick={() => visibility(contact, !contact.visible)} className={`col-span-2 flex min-h-10 items-center justify-center gap-1 rounded-xl text-sm font-bold ${contact.visible ? "border border-slate-300 text-slate-700" : "bg-red-600 text-white"}`}>{contact.visible ? <EyeOff size={16} /> : <Eye size={16} />}{contact.visible ? "Ocultar" : "Publicar"}</button></div></article>)}</div> : <div className={`${cardClass} py-8 text-center`}><CheckCircle2 className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-600">No hay contactos cargados para esta ciudad.</p></div>}</div>
      </div></main></div>
  );
}
