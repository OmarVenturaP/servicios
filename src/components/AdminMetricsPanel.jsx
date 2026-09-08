"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BarChart3, CalendarDays, KeyRound, MessageCircle, MousePointerClick, Phone, Users } from "lucide-react";
import BrandMark from "./BrandMark";
import Header from "./Header";

const periods = [
  ["today", "Hoy"],
  ["7d", "7 días"],
  ["30d", "30 días"],
];

const inputClass = "mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950";
const primaryButton = "brand-primary-action flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold shadow-sm disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export default function AdminMetricsPanel() {
  const [accessKey, setAccessKey] = useState("");
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function loadMetrics(nextPeriod = period) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/metricas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey, period: nextPeriod }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No se pudieron consultar las métricas.");
      setPeriod(nextPeriod);
      setData(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    await loadMetrics("7d");
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
        <main className="relative mx-auto grid min-h-screen w-full place-items-center overflow-hidden bg-[#fbfcff] px-5 py-10 shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
          <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <BrandMark className="mb-6" />
            <div className="brand-soft-surface grid size-12 place-items-center rounded-2xl border text-[var(--brand-blue)]"><KeyRound aria-hidden="true" /></div>
            <p className="mt-5 text-sm font-extrabold text-[var(--brand-blue)]">Administración</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Métricas de Servicios</h1>
            <label className="mt-6 block text-sm font-bold text-slate-600">
              Clave de acceso
              <input className={inputClass} type="password" autoComplete="off" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} required />
            </label>
            <button className={`${primaryButton} mt-4`} disabled={pending}>{pending ? "Consultando..." : "Entrar"}</button>
            {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
            <Link href="/admin" className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[var(--brand-blue)]"><ArrowLeft size={17} /> Volver a administración</Link>
          </form>
        </main>
      </div>
    );
  }

  const hasActivity = data.summary.visits > 0 || data.summary.contacts > 0;
  const dailyMaximum = Math.max(1, ...data.daily.map((day) => Math.max(day.visits, day.contacts)));

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <main className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <Header />
        <div className="px-5 pb-8 pt-4 sm:px-7">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-[var(--brand-blue)]">Administración</p>
              <h1 className="text-2xl font-semibold text-slate-950">Métricas</h1>
              <p className="mt-1 text-sm text-slate-500">Contactos iniciados y actividad anónima.</p>
            </div>
            <Link href="/admin" aria-label="Volver a administración" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-[var(--brand-navy)] shadow-sm"><ArrowLeft size={19} /></Link>
          </header>

          <div className="mt-5 grid grid-cols-3 rounded-xl bg-slate-100 p-1" role="group" aria-label="Periodo de métricas">
            {periods.map(([value, label]) => {
              const selected = value === period;
              return <button key={value} type="button" disabled={pending} aria-pressed={selected} onClick={() => loadMetrics(value)} className={`min-h-11 rounded-lg px-2 text-sm font-extrabold transition disabled:opacity-50 ${selected ? "bg-white text-[var(--brand-blue)] shadow-sm ring-1 ring-slate-200" : "text-slate-600"}`}>{label}</button>;
            })}
          </div>

          {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
          {pending ? <p className="mt-4 rounded-xl bg-white p-4 text-center text-sm font-bold text-slate-500" role="status">Actualizando métricas...</p> : null}

          <section className="mt-5 grid grid-cols-2 gap-3" aria-label="Resumen de métricas">
            <MetricCard icon={CalendarDays} label="Visitas" value={formatNumber(data.summary.visits)} />
            <MetricCard icon={Users} label="Visitantes únicos" value={formatNumber(data.summary.uniqueVisitors)} />
            <MetricCard icon={MousePointerClick} label="Contactos iniciados" value={formatNumber(data.summary.contacts)} />
            <MetricCard icon={BarChart3} label="Tasa de contacto" value={`${data.summary.contactRate}%`} />
            <MetricCard icon={MessageCircle} label="Clics en WhatsApp" value={formatNumber(data.summary.whatsapp)} accent="text-emerald-600" />
            <MetricCard icon={Phone} label="Clics en llamada" value={formatNumber(data.summary.calls)} />
          </section>

          <p className="mt-3 text-xs leading-5 text-slate-500">Los visitantes únicos son sesiones o dispositivos anónimos aproximados. Los contactos representan intención de contacto, no mensajes enviados, llamadas completadas ni contrataciones.</p>

          {!hasActivity ? (
            <div className={`${cardClass} mt-5 text-center`}>
              <BarChart3 className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="mt-3 font-bold text-slate-700">Todavía no hay actividad registrada en este periodo.</p>
            </div>
          ) : (
            <>
              <MetricsSection title="Evolución diaria">
                <div className="space-y-4">
                  {data.daily.map((day) => (
                    <div key={day.date}>
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600"><span>{formatDate(day.date)}</span><span>{day.visits} visitas · {day.contacts} contactos</span></div>
                      <div className="mt-1.5 grid gap-1" aria-label={`${day.visits} visitas y ${day.contacts} contactos`}>
                        <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand-blue)]" style={{ width: `${Math.max(2, (day.visits / dailyMaximum) * 100)}%` }} /></div>
                        <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand-teal)]" style={{ width: `${day.contacts ? Math.max(2, (day.contacts / dailyMaximum) * 100) : 0}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </MetricsSection>

              <MetricsSection title="Contactos por servicio">
                {data.services.length ? <div className="divide-y divide-slate-100">{data.services.map((service) => <ServiceMetric key={service.id} service={service} />)}</div> : <EmptyLine />}
              </MetricsSection>

              <MetricsSection title="Contactos por unidad">
                {data.units.length ? <div className="divide-y divide-slate-100">{data.units.map((unit) => <UnitMetric key={`${unit.serviceId}-${unit.unitId ?? "central"}`} unit={unit} />)}</div> : <EmptyLine />}
              </MetricsSection>

              <MetricsSection title="Actividad por ciudad">
                {data.cities.length ? <div className="divide-y divide-slate-100">{data.cities.map((city) => <CityMetric key={city.id} city={city} />)}</div> : <EmptyLine />}
              </MetricsSection>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent = "text-[var(--brand-blue)]" }) {
  return <article className={cardClass}><Icon className={accent} size={19} aria-hidden="true" /><p className="mt-3 text-2xl font-black text-[var(--brand-navy)]">{value}</p><p className="mt-1 text-xs font-bold leading-4 text-slate-500">{label}</p></article>;
}

function MetricsSection({ title, children }) {
  return <section className={`${cardClass} mt-5`}><h2 className="text-lg font-semibold text-[var(--brand-navy)]">{title}</h2><div className="mt-3">{children}</div></section>;
}

function ChannelBreakdown({ whatsapp, calls }) {
  return <p className="mt-1 text-xs text-slate-500">{whatsapp} WhatsApp · {calls} llamadas</p>;
}

function ServiceMetric({ service }) {
  return <article className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{service.name}</h3>{!service.visible ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-bold text-slate-600">Oculto</span> : null}</div><p className="text-xs text-slate-500">{service.cityName} · {service.uniqueVisitors} visitantes con contacto</p><ChannelBreakdown whatsapp={service.whatsapp} calls={service.calls} /></div><div className="shrink-0 text-right"><p className="text-lg font-black text-[var(--brand-navy)]">{service.contacts}</p><p className="text-xs font-bold text-[var(--brand-blue)]">{service.share}%</p></div></div></article>;
}

function UnitMetric({ unit }) {
  return <article className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{unit.unitName}</h3><p className="text-xs text-slate-500">{unit.serviceName}{unit.central ? " · modo central" : ""}</p><ChannelBreakdown whatsapp={unit.whatsapp} calls={unit.calls} /></div><p className="text-lg font-black text-[var(--brand-navy)]">{unit.contacts}</p></div></article>;
}

function CityMetric({ city }) {
  return <article className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{city.name}</h3><p className="text-xs text-slate-500">{city.visits} visitas · {city.uniqueVisitors} visitantes únicos</p><ChannelBreakdown whatsapp={city.whatsapp} calls={city.calls} /></div><div className="text-right"><p className="text-lg font-black text-[var(--brand-navy)]">{city.contacts}</p><p className="text-xs font-bold text-[var(--brand-blue)]">{city.contactRate}%</p></div></div></article>;
}

function EmptyLine() {
  return <p className="text-sm text-slate-500">Sin contactos en este periodo.</p>;
}
