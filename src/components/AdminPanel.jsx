"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Check, CheckCircle2, ChevronLeft, Copy, ImageIcon, KeyRound, Plus, Search, Settings2, Siren, Trash2, Upload, X, XCircle } from "lucide-react";
import BrandMark from "./BrandMark";
import Header from "./Header";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950";
const labelClass = "block text-sm font-bold text-slate-600";
const primaryButton = "brand-primary-action flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold shadow-sm disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const maxLogoBytes = 3 * 1024 * 1024;
const allowedLogoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function FormField({ label, name, defaultValue = "", type = "text", required = false, children }) {
  return (
    <label className={labelClass}>
      {label}
      {children ?? <input className={inputClass} name={name} type={type} min={type === "number" ? "0.01" : undefined} step={type === "number" ? "0.01" : undefined} defaultValue={defaultValue ?? ""} required={required} />}
    </label>
  );
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function statusLabel(unit) {
  if (unit.effectiveState === "disponible") return "Disponible";
  if (unit.effectiveState === "ocupado") return "Ocupado";
  if (unit.effectiveState === "vencido") return "Disponibilidad vencida";
  return "No disponible";
}

function serviceStatus(service) {
  if (service.units.some((unit) => unit.effectiveState === "disponible")) {
    return { label: "Disponible", color: "bg-emerald-500" };
  }
  if (service.units.some((unit) => unit.effectiveState === "ocupado")) {
    return { label: "Ocupado", color: "bg-amber-400" };
  }
  return { label: "No disponible", color: "bg-red-500" };
}

export default function AdminPanel() {
  const [accessKey, setAccessKey] = useState("");
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [generatedAccess, setGeneratedAccess] = useState(null);
  const [createLogo, setCreateLogo] = useState({ file: null, preview: null });
  const [editLogo, setEditLogo] = useState({ file: null, preview: null });

  const selectedService = data?.services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedUnit = selectedService?.units.find((unit) => unit.id === selectedUnitId) ?? selectedService?.units[0] ?? null;
  const filteredServices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    return data?.services.filter((service) => !query || service.name.toLocaleLowerCase("es-MX").includes(query)) ?? [];
  }, [data, search]);

  useEffect(() => {
    if (!feedback || !data) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback, data]);

  useEffect(() => () => {
    if (createLogo.preview) URL.revokeObjectURL(createLogo.preview);
  }, [createLogo.preview]);

  useEffect(() => () => {
    if (editLogo.preview) URL.revokeObjectURL(editLogo.preview);
  }, [editLogo.preview]);

  function selectLogo(event, setter) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!allowedLogoTypes.has(file.type)) {
      event.target.value = "";
      setFeedback({ type: "error", message: "El logo debe ser JPG, PNG o WEBP." });
      return;
    }
    if (file.size > maxLogoBytes) {
      event.target.value = "";
      setFeedback({ type: "error", message: "El logo no puede superar 3 MB." });
      return;
    }
    setter({ file, preview: URL.createObjectURL(file) });
  }

  async function uploadLogo(serviceId, file) {
    setPending(true);
    const body = new FormData();
    body.set("accessKey", accessKey);
    body.set("serviceId", String(serviceId));
    body.set("logo", file);
    try {
      const response = await fetch("/api/admin/logos", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo subir el logo.");
      setData(result.data);
      return result;
    } finally {
      setPending(false);
    }
  }

  async function deleteLogo() {
    if (!window.confirm("¿Deseas eliminar el logo de este servicio?")) return;
    setPending(true);
    try {
      const response = await fetch("/api/admin/logos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey, serviceId: selectedService.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo eliminar el logo.");
      setData(result.data);
      setEditLogo({ file: null, preview: null });
      setFeedback({ type: "success", message: "Logo eliminado. La landing usará el ícono predeterminado." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setPending(false);
    }
  }

  async function execute(action, payload = {}) {
    setPending(true);
    setFeedback(null);
    if (action !== "rotate_access") setGeneratedAccess(null);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey, action, ...payload }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudo completar la operación.");
      setData(result.data);
      if (result.selectedServiceId) setSelectedServiceId(result.selectedServiceId);
      if (result.access) setGeneratedAccess(result.access);
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
    try {
      await execute("bootstrap");
      setFeedback(null);
    } catch {}
  }

  async function createProviderFromForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    try {
      const result = await execute("create_provider", { data: {
        cityId: values.cityId,
        contactModeId: values.contactModeId,
        service: {
          name: values["service.name"],
          phone: values["service.phone"],
          whatsapp: values["service.whatsapp"],
          coverage: values["service.coverage"],
        },
        unit: {
          name: values["unit.name"],
          phone: values["unit.phone"],
          whatsapp: values["unit.whatsapp"],
          priceBase: values["unit.priceBase"],
        },
      } });
      form.reset();
      setShowCreate(false);
      setShowAddUnit(false);
      setSelectedServiceId(result.selectedServiceId);
      const createdService = result.data.services.find((service) => service.id === result.selectedServiceId);
      setSelectedUnitId(createdService?.units[0]?.id ?? null);
      if (createLogo.file) {
        try {
          await uploadLogo(result.selectedServiceId, createLogo.file);
          setFeedback({ type: "success", message: "Proveedor, primera unidad y logo creados." });
        } catch (error) {
          setFeedback({ type: "error", message: `El proveedor fue creado sin logo. ${error.message}` });
        }
      } else {
        setFeedback({ type: "success", message: "Proveedor y primera unidad creados." });
      }
      setCreateLogo({ file: null, preview: null });
    } catch {}
  }

  async function addUnitFromForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const result = await execute("add_unit", {
        serviceId: selectedService.id,
        data: formValues(form),
      });
      form.reset();
      setShowAddUnit(false);
      const updatedService = result.data.services.find((service) => service.id === selectedService.id);
      setSelectedUnitId(updatedService?.units.at(-1)?.id ?? null);
      setFeedback({ type: "success", message: "Unidad creada correctamente." });
    } catch {}
  }

  async function updateServiceFromForm(event) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    try {
      await execute("update_service", { serviceId: selectedService.id, data: { ...values, visible: values.visible === "true" } });
      setFeedback({ type: "success", message: "Servicio actualizado." });
    } catch {}
  }

  function openService(service) {
    setSelectedServiceId(service.id);
    setSelectedUnitId(service.units[0]?.id ?? null);
    setGeneratedAccess(null);
    setFeedback(null);
    setEditLogo({ file: null, preview: null });
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
        <main className="relative mx-auto grid min-h-screen w-full place-items-center overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem] px-5 py-10">
          <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <BrandMark className="mb-6" />
            <div className="brand-soft-surface grid size-12 place-items-center rounded-2xl border text-[var(--brand-blue)]"><KeyRound aria-hidden="true" /></div>
            <p className="mt-5 text-sm font-extrabold text-[var(--brand-blue)]">Panel master</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Administración</h1>
            <label className={`${labelClass} mt-6`}>
              Clave de acceso
              <input className={inputClass} type="password" autoComplete="off" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} required />
            </label>
            <button className={`${primaryButton} mt-4`} disabled={pending}>{pending ? "Validando..." : "Entrar"}</button>
            {feedback ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{feedback.message}</p> : null}
          </form>
        </main>
      </div>
    );
  }

  if (showCreate) {
    return (
      <AdminShell title="Nuevo proveedor" onBack={() => setShowCreate(false)} feedback={feedback}>
        <form onSubmit={createProviderFromForm} className={`${cardClass} grid gap-4`}>
          <h2 className="text-lg font-black text-slate-950">Servicio</h2>
          <FormField label="Ciudad" name="cityId"><select className={inputClass} name="cityId" required>{data.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select></FormField>
          <FormField label="Nombre" name="service.name" required />
          <FormField label="Modo de contacto" name="contactModeId"><select className={inputClass} name="contactModeId" required>{data.contactModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></FormField>
          <FormField label="Teléfono" name="service.phone" inputMode="tel" />
          <FormField label="WhatsApp" name="service.whatsapp" inputMode="tel" />
          <FormField label="Cobertura" name="service.coverage" />
          <LogoPicker value={createLogo} onChange={(event) => selectLogo(event, setCreateLogo)} disabled={pending} />
          <h2 className="mt-2 border-t border-slate-200 pt-5 text-lg font-black text-slate-950">Primera unidad</h2>
          <FormField label="Nombre opcional" name="unit.name" />
          <FormField label="Teléfono" name="unit.phone" />
          <FormField label="WhatsApp" name="unit.whatsapp" />
          <FormField label="Precio base" name="unit.priceBase" type="number" required />
          <button className={primaryButton} disabled={pending}>{pending ? "Creando..." : "Crear proveedor"}</button>
        </form>
      </AdminShell>
    );
  }

  if (selectedService) {
    return (
      <AdminShell title={selectedService.name} subtitle={selectedService.cityName} onBack={() => { setSelectedServiceId(null); setGeneratedAccess(null); }} feedback={feedback}>
        <form key={`service-${selectedService.id}`} onSubmit={updateServiceFromForm} className={`${cardClass} grid gap-4`}>
          <h2 className="text-lg font-black text-slate-950">Información del servicio</h2>
          <FormField label="Nombre" name="name" defaultValue={selectedService.name} required />
          <FormField label="Modo de contacto" name="contactModeId"><select className={inputClass} name="contactModeId" defaultValue={selectedService.contactModeId}>{data.contactModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></FormField>
          <FormField label="Teléfono" name="phone" defaultValue={selectedService.phone} />
          <FormField label="WhatsApp" name="whatsapp" defaultValue={selectedService.whatsapp} />
          <FormField label="Descripción" name="description"><textarea className={`${inputClass} min-h-24 py-3`} name="description" defaultValue={selectedService.description ?? ""} /></FormField>
          <FormField label="Cobertura" name="coverage"><textarea className={`${inputClass} min-h-20 py-3`} name="coverage" defaultValue={selectedService.coverage ?? ""} /></FormField>
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" name="visible" value="true" defaultChecked={selectedService.visible} className="size-5" /> Visible públicamente</label>
          <button className={primaryButton} disabled={pending}>{pending ? "Guardando..." : "Guardar servicio"}</button>
        </form>

        <section className={`${cardClass} mt-4`}>
          <h2 className="text-lg font-black text-slate-950">Logo del servicio</h2>
          <LogoPicker currentUrl={selectedService.logoUrl} value={editLogo} onChange={(event) => selectLogo(event, setEditLogo)} disabled={pending} />
          {editLogo.file ? <button type="button" disabled={pending} onClick={async () => { try { await uploadLogo(selectedService.id, editLogo.file); setEditLogo({ file: null, preview: null }); setFeedback({ type: "success", message: selectedService.logoUrl ? "Logo reemplazado correctamente." : "Logo agregado correctamente." }); } catch (error) { setFeedback({ type: "error", message: error.message }); } }} className={`${primaryButton} mt-3`}><Upload size={18} /> {pending ? "Subiendo..." : selectedService.logoUrl ? "Reemplazar logo" : "Subir logo"}</button> : null}
          {selectedService.logoUrl ? <button type="button" disabled={pending} onClick={deleteLogo} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700 disabled:opacity-50"><Trash2 size={17} /> Eliminar logo</button> : null}
        </section>

        <section className={`${cardClass} mt-4`}>
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-950">Unidades</h2><button type="button" onClick={() => setShowAddUnit(!showAddUnit)} className="brand-soft-surface flex min-h-10 items-center gap-1 rounded-xl border px-3 text-sm font-extrabold text-[var(--brand-blue)]"><Plus size={17} /> Agregar</button></div>
          {showAddUnit ? <UnitCreateForm pending={pending} onSubmit={addUnitFromForm} onCancel={() => setShowAddUnit(false)} /> : null}
          {selectedService.units.length ? (
            <>
              <label className={`${labelClass} mt-4`}>Unidad<select className={inputClass} value={selectedUnit?.id ?? ""} onChange={(event) => { setSelectedUnitId(Number(event.target.value)); setGeneratedAccess(null); }}>{selectedService.units.map((unit, index) => <option key={unit.id} value={unit.id}>{unit.name || `Unidad ${index + 1}`}</option>)}</select></label>
              {selectedUnit ? <UnitEditor key={selectedUnit.id} unit={selectedUnit} service={selectedService} pending={pending} generatedAccess={generatedAccess} onSave={async (event) => { event.preventDefault(); const values = formValues(event.currentTarget); try { await execute("update_unit", { serviceId: selectedService.id, unitId: selectedUnit.id, data: { ...values, active: values.active === "true" } }); setFeedback({ type: "success", message: "Unidad actualizada." }); } catch {} }} onStatus={async (statusAction) => { try { await execute("update_unit_status", { serviceId: selectedService.id, unitId: selectedUnit.id, statusAction }); setFeedback({ type: "success", message: "Estado actualizado." }); } catch {} }} onAccess={async () => { if (selectedUnit.hasAccess && !window.confirm("El enlace anterior dejará de funcionar. ¿Deseas rotar el acceso?")) return; try { await execute("rotate_access", { serviceId: selectedService.id, unitId: selectedUnit.id }); setFeedback({ type: "success", message: "Acceso privado generado." }); } catch {} }} /> : null}
            </>
          ) : <p className="mt-4 text-sm text-slate-500">Este servicio todavía no tiene unidades.</p>}
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Servicios" subtitle="Administración operativa" feedback={feedback}>
      <div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={19} /><input aria-label="Buscar servicio" className={`${inputClass} mt-0 pl-10`} placeholder="Buscar servicio" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <button type="button" onClick={() => { setShowCreate(true); setFeedback(null); }} className={`${primaryButton} mt-3`}><Plus size={19} /> Nuevo proveedor</button>
      <Link href="/admin/metricas" className="brand-soft-surface mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold text-[var(--brand-blue)]"><BarChart3 size={18} /> Ver métricas</Link>
      <Link href="/admin/emergencias" className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700"><Siren size={18} /> Administrar Emergencias</Link>
      <div className="mt-4 grid gap-3">{filteredServices.map((service) => { const status = serviceStatus(service); return <article key={service.id} className={cardClass}><div className="flex items-center gap-3"><AdminServiceThumbnail key={service.logoUrl || `fallback-${service.id}`} service={service} /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-blue)]">{service.cityName}</p><div className="mt-1 flex min-w-0 items-center gap-2"><span className={`size-2.5 shrink-0 rounded-full ring-2 ring-white ${status.color}`} role="img" aria-label={`Estado: ${status.label}`} title={status.label} /><h2 className="truncate text-lg font-black text-slate-950">{service.name}</h2></div><p className="mt-1 text-sm text-slate-500">{service.units.length} {service.units.length === 1 ? "unidad" : "unidades"}</p></div></div><button type="button" onClick={() => openService(service)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-navy)] text-sm font-extrabold text-white"><Settings2 size={17} /> Administrar</button></article>; })}</div>
    </AdminShell>
  );
}

function AdminShell({ title, subtitle, onBack, feedback, children }) {
  return <main className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]"><Header /><div className="px-5 pb-8 pt-4">{feedback ? <Toast feedback={feedback} /> : null}<header className="mb-5 flex items-start gap-3">{onBack ? <button type="button" onClick={onBack} aria-label="Volver" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white"><ChevronLeft /></button> : null}<div><p className="text-sm font-extrabold text-[var(--brand-blue)]">Administración</p><h1 className="text-2xl font-semibold text-slate-950">{title}</h1>{subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}</div></header>{children}</div></main>;
}

function LogoPicker({ currentUrl = null, value, onChange, disabled }) {
  const source = value.preview || currentUrl;
  return <div><label className={labelClass}>Logo opcional<input key={source || "empty-logo"} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onChange} disabled={disabled} className="mt-1 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:min-h-11 file:border-0 file:bg-[color:color-mix(in_srgb,var(--brand-blue)_8%,white)] file:px-3 file:font-extrabold file:text-[var(--brand-blue)] disabled:opacity-50" /></label><p className="mt-1 text-xs text-slate-500">JPG, PNG o WEBP. Máximo 3 MB. Se mostrará en formato cuadrado con bordes redondeados.</p><div className="mt-3 grid min-h-28 place-items-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">{source ? <div className="relative aspect-square size-28 overflow-hidden rounded-2xl border border-slate-200 bg-white"><Image src={source} alt="Vista previa del logo" fill sizes="112px" unoptimized={Boolean(value.preview)} className="object-cover" /></div> : <div className="grid justify-items-center gap-2 p-4 text-slate-400"><ImageIcon size={28} aria-hidden="true" /><span className="text-sm font-bold">Sin logo</span></div>}</div>{value.file ? <p className="mt-2 truncate text-xs font-bold text-[var(--brand-blue)]">Vista previa: {value.file.name}</p> : null}</div>;
}

function AdminServiceThumbnail({ service }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative grid aspect-square size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">{service.logoUrl && !failed ? <Image src={service.logoUrl} alt={`Logo de ${service.name}`} fill sizes="56px" className="bg-white object-cover" onError={() => setFailed(true)} /> : <ImageIcon className="text-slate-400" size={24} aria-hidden="true" />}</div>;
}

function Toast({ feedback }) {
  const ErrorIcon = feedback.type === "error" ? XCircle : CheckCircle2;
  return <div className={`fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={feedback.type === "error" ? "alert" : "status"} aria-live="polite"><ErrorIcon className="mt-0.5 shrink-0" size={20} aria-hidden="true" /><p className="flex-1 text-sm font-bold leading-5">{feedback.message}</p></div>;
}

function UnitCreateForm({ pending, onSubmit, onCancel }) {
  return <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="font-black text-slate-900">Nueva unidad</p><button type="button" onClick={onCancel} aria-label="Cancelar nueva unidad" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200"><X size={18} /></button></div><FormField label="Nombre opcional" name="name" /><FormField label="Teléfono" name="phone" /><FormField label="WhatsApp" name="whatsapp" /><FormField label="Precio base" name="priceBase" type="number" required /><button className={primaryButton} disabled={pending}>{pending ? "Creando..." : "Guardar unidad"}</button></form>;
}

function UnitEditor({ unit, service, pending, generatedAccess, onSave, onStatus, onAccess }) {
  const [copied, setCopied] = useState(false);
  const copyAccess = async () => {
    try {
      await navigator.clipboard.writeText(generatedAccess.privateUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-sm font-bold text-slate-500">Estado efectivo</p><p className="mt-1 text-lg font-black text-slate-900">{statusLabel(unit)}</p><form onSubmit={onSave} className="mt-4 grid gap-3"><FormField label="Nombre" name="name" defaultValue={unit.name} /><FormField label="Teléfono" name="phone" defaultValue={unit.phone} /><FormField label="WhatsApp" name="whatsapp" defaultValue={unit.whatsapp} /><FormField label="Precio base" name="priceBase" type="number" defaultValue={unit.priceBase} required /><label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" name="active" value="true" defaultChecked={unit.active} className="size-5" /> Unidad activa</label><button className={primaryButton} disabled={pending}>Guardar unidad</button></form><div className="mt-5 grid grid-cols-3 gap-2"><button disabled={pending} onClick={() => onStatus("disponible")} className="min-h-11 rounded-xl bg-emerald-500 px-2 text-xs font-extrabold text-white">Disponible</button><button disabled={pending} onClick={() => onStatus("ocupado")} className="min-h-11 rounded-xl bg-amber-500 px-2 text-xs font-extrabold text-white">Ocupado</button><button disabled={pending} onClick={() => onStatus("terminar")} className="min-h-11 rounded-xl border border-slate-300 px-2 text-xs font-extrabold text-slate-700">No disponible</button></div><button type="button" disabled={pending} onClick={onAccess} className="brand-primary-action mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-extrabold shadow-sm"><KeyRound size={18} /> {unit.hasAccess ? "Rotar acceso" : "Generar acceso"}</button>{generatedAccess ? <div className="brand-soft-surface mt-4 rounded-xl border p-4"><p className="font-black text-[var(--brand-navy)]">Acceso privado generado</p><p className="mt-2 break-all text-sm text-[var(--brand-blue)]">{generatedAccess.privateUrl}</p><p className="mt-3 text-sm leading-5 text-slate-700">Guarda o comparte este enlace ahora. Por seguridad no podremos recuperarlo posteriormente. Si se pierde tendrás que generar uno nuevo.</p><div className="mt-3 grid gap-2"><button type="button" onClick={copyAccess} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-[var(--brand-blue)]"><Copy size={17} /> {copied ? "Enlace copiado" : "Copiar enlace"}</button>{generatedAccess.whatsappUrl ? <a href={generatedAccess.whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 font-extrabold text-white"><Check size={17} /> Compartir por WhatsApp</a> : null}</div></div> : null}<p className="mt-3 text-xs text-slate-400">Servicio: {service.name}</p></div>;
}
