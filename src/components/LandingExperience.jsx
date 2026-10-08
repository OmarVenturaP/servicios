"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bike, Cctv, Check, ChevronRight, Droplet, Ellipsis, Package, PlugZap, Search, Snowflake, Sparkles, Wrench, X } from "lucide-react";
import ServiceList from "./ServiceList";
import AdvertisementCarousel from "./AdvertisementCarousel";
import { selectedActiveCategory } from "@/domain/service-categories";
import { sendAnalyticsEvent } from "@/lib/analytics-client";

const categoryIcons = {
  bike: Bike,
  droplet: Droplet,
  ellipsis: Ellipsis,
  package: Package,
  plug: PlugZap,
  snowflake: Snowflake,
  cctv: Cctv,
  sparkles: Sparkles,
  wrench: Wrench,
};

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-MX");
}

function timestamp(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function sortByPrice(services) {
  return services
    .map((service, index) => ({ service, index }))
    .sort((left, right) => {
      const a = left.service;
      const b = right.service;
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (!a.isAvailable) return left.index - right.index;
      if (a.priceFrom !== b.priceFrom) return a.priceFrom - b.priceFrom;
      if (a.availableUnits !== b.availableUnits) return b.availableUnits - a.availableUnits;
      const recentDifference = timestamp(b.availabilityUpdatedAt) - timestamp(a.availabilityUpdatedAt);
      return recentDifference || left.index - right.index;
    })
    .map(({ service }) => service);
}

export default function LandingExperience({ citySlug, cityName, services, totals, ads = [], categories = [] }) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("recommended");
  const [selectedCategory, setSelectedCategory] = useState("mandados");
  const observedSearches = useRef(new Set());
  const normalizedQuery = normalize(query);
  const visibleCategories = useMemo(() => categories.filter((category) => (
    !normalizedQuery || category.keywords.some((keyword) => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword))
  )), [categories, normalizedQuery]);
  const selectedCategoryConfig = selectedActiveCategory(categories, selectedCategory);
  const activeCategoryKey = selectedCategoryConfig?.key;
  const selectedServices = useMemo(() => services.filter((service) => service.categorySlugs.includes(activeCategoryKey)), [activeCategoryKey, services]);
  const showsSelectedCategory = visibleCategories.some((category) => category.key === activeCategoryKey && category.active);
  const orderedServices = useMemo(() => (
    sortMode === "price" ? sortByPrice(selectedServices) : selectedServices
  ), [selectedServices, sortMode]);
  const availabilityLabel = totals.availableUnits === 1
    ? "1 repartidor disponible ahora"
    : `${totals.availableUnits} repartidores disponibles ahora`;

  useEffect(() => {
    if (normalizedQuery.length < 2 || observedSearches.current.has(normalizedQuery)) return;
    const timer = window.setTimeout(() => {
      observedSearches.current.add(normalizedQuery);
      sendAnalyticsEvent({ citySlug, event: "search", value: normalizedQuery });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [citySlug, normalizedQuery]);

  function changeSortMode(value) {
    setSortMode(value);
    sendAnalyticsEvent({ citySlug, event: "filter_change", value });
  }

  return (
    <>
      <section id="categorias" className="mt-1.5 scroll-mt-4" aria-labelledby="categories-title">
        <h2 id="categories-title" className="text-[0.92rem] font-black text-slate-950">¿Qué necesitas?</h2>
        <label className="sr-only" htmlFor="service-category-search">Buscar tipos de servicio</label>
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" size={19} />
          <input
            id="service-category-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.08)] outline-none transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--brand-blue)_14%,white)]"
            placeholder="Buscar servicios..."
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)]"><X aria-hidden="true" size={18} /></button> : null}
        </div>

        {visibleCategories.length ? (
          <div className="mt-3 flex snap-x snap-mandatory scroll-px-1 gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Categorías de servicio">
            {visibleCategories.map(({ key, name, icon, active }) => {
              const Icon = categoryIcons[icon] ?? Ellipsis;
              return active ? (
                <button key={key} type="button" onClick={() => { setSelectedCategory(key); setSortMode("recommended"); }} aria-pressed={activeCategoryKey === key} aria-label={`${name}, disponible`} className={`w-[7.5rem] shrink-0 snap-start rounded-xl border border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 p-2.5 text-left shadow-sm transition hover:[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] ${activeCategoryKey === key ? "bg-[var(--brand-blue)]/10 ring-2 ring-[var(--brand-blue)]" : ""}`}>
                  <div className="flex items-start justify-between gap-1"><Icon aria-hidden="true" size={21} /><span className="rounded-full bg-white px-1.5 py-0.5 text-[0.5rem] font-black uppercase tracking-wide text-[var(--brand-blue)]">Disponible</span></div>
                  <strong className="mt-1.5 block truncate text-xs text-[var(--brand-navy)]">{name}</strong>
                </button>
              ) : (
                <div key={key} className="w-[7.5rem] shrink-0 snap-start rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-500" aria-label={`${name}, próximamente`}>
                  <div className="flex items-start justify-between gap-1"><Icon aria-hidden="true" size={21} /><span className="rounded-full bg-white px-1.5 py-0.5 text-[0.45rem] font-black uppercase tracking-wide text-slate-500">Próximamente</span></div>
                  <strong className="mt-1.5 block truncate text-xs text-slate-700">{name}</strong>
                </div>
              );
            })}
          </div>

        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
            <p className="text-sm font-extrabold text-slate-800">No encontramos ese servicio por ahora.</p>
            <button type="button" onClick={() => setQuery("")} className="brand-soft-surface mt-3 min-h-11 rounded-xl border px-4 text-sm font-extrabold text-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)]">Limpiar búsqueda</button>
          </div>
        )}
        <div className={`brand-soft-surface ${ads.length ? "mb-2" : "mb-5"} overflow-hidden rounded-2xl border p-2 shadow-[0_8px_24px_rgba(37,99,235,0.08)]`}>
          {/* Agregamos flex, items-center y un espacio opcional con gap-2 */}
          <div className="flex items-center justify-center gap-2 ps-3 text-[var(--brand-blue)]">
            <Sparkles aria-hidden="true" size={15} />
            <h2 className="text-sm ps-3 font-semibold tracking-tight text-[var(--brand-navy)]">Próximamente más servicios</h2>
          </div>
        </div>
      </section >

      <AdvertisementCarousel ads={ads} />

      {
        showsSelectedCategory ? (
          <section id="servicios" className={`${ads.length ? "mt-2" : "mt-5"} scroll-mt-4`} aria-labelledby="services-title" >
            <h2 id="services-title" className="text-[0.92rem] font-black text-slate-950">{selectedCategoryConfig.name === "Mandados" ? `Mandaditos disponibles en ${cityName}` : `${selectedCategoryConfig.name} en ${cityName}`}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{selectedCategoryConfig.name === "Mandados" ? availabilityLabel : `${orderedServices.length} ${orderedServices.length === 1 ? "servicio publicado" : "servicios publicados"}`}</p>
            {selectedCategoryConfig.name === "Mandados" ? <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Ordenar servicios">
              {[
                ["recommended", "Recomendados"],
                ["price", "Menor precio"],
              ].map(([value, label]) => {
                const selected = sortMode === value;
                return <button key={value} type="button" onClick={() => changeSortMode(value)} aria-pressed={selected} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-extrabold transition focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)] ${selected ? "bg-white text-[var(--brand-blue)] shadow-sm ring-1 ring-slate-200" : "text-slate-600"}`}>{selected ? <Check aria-hidden="true" size={15} strokeWidth={3} /> : null}{label}</button>;
              })}
            </div> : null}
            <div className="mt-3">
              <ServiceList citySlug={citySlug} services={orderedServices} categoryName={selectedCategoryConfig.name} categoryIcon={selectedCategoryConfig.icon} />
            </div>
          </section >
        ) : null
      }
    </>
  );
}
