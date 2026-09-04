import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Bike,
  CarFront,
  ChevronRight,
  Grid2X2,
  Home,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
import ServiceList from "@/components/ServiceList";
import VisitTracker from "@/components/VisitTracker";
import { getPublicServicesByCity } from "@/db/queries/public-services";

const categories = [
  { name: "Mandados", icon: Bike, active: true },
  { name: "Taxis", icon: CarFront },
  { name: "Fletes", icon: Package },
  { name: "Ver más", icon: Grid2X2 },
];

export default async function CityPage({ params }) {
  await connection();
  const { ciudad: citySlug } = await params;
  const availability = await getPublicServicesByCity(citySlug);

  if (!availability) {
    notFound();
  }

  const { city, services, totals } = availability;

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <VisitTracker citySlug={city.slug} />
      <div id="inicio" className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <section className="hero-reference relative h-[16.2rem] overflow-hidden">
          <Header cityName={city.name} />
          <p className="relative z-10 px-6 text-[0.72rem] font-medium text-slate-700">Gente local para tu día a día</p>
          <div className="relative z-10 mt-7 w-[58%] px-6">
            <h1 className="text-[1.9rem] font-black leading-[0.96] tracking-[-0.045em] text-[#101a5c]">
              ¿Necesitas<br />un mandado?
            </h1>
            <p className="mt-3 text-[0.78rem] font-medium leading-[1.45] text-[#17266b]">
              Conecta con motomandados disponibles en {city.name}.
            </p>
          </div>
          <Image
            className="hero-rider absolute -bottom-8 -right-2 h-[20.5rem] w-[17rem] object-cover object-bottom"
            src="/delivery-rider.png"
            alt="Repartidor de motomandados con equipo de entrega"
            width={1024}
            height={1536}
            priority
          />
        </section>

        <main className="px-5 pb-24">
          <section className="grid grid-cols-3 gap-2.5 py-3" aria-label="Beneficios">
            {[
              [Zap, "Rápido"],
              [ShieldCheck, "Confiable"],
              [MapPin, "Gente de aquí"],
            ].map(([Icon, label]) => (
              <div key={label} className="flex items-center justify-center gap-1.5 text-[0.72rem] font-bold text-[#101a5c]">
                <Icon aria-hidden="true" size={20} strokeWidth={2.2} /> {label}
              </div>
            ))}
          </section>

          <div className="relative mt-1.5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" size={19} />
            <input
              aria-label="Buscar un servicio"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-500 shadow-[0_4px_14px_rgba(15,23,42,0.08)] outline-none"
              placeholder="Busca un servicio..."
              readOnly
            />
          </div>

          <a href="#servicios" className="mt-3 flex min-h-[3.7rem] items-center rounded-xl bg-gradient-to-r from-[#4047d8] to-[#4938d4] px-4 text-white shadow-[0_6px_16px_rgba(67,56,202,0.25)]">
            <Bike aria-hidden="true" size={32} />
            <span className="ml-4">
              <strong className="block text-lg leading-tight">Mandados</strong>
              <span className="block text-xs text-indigo-100">Compras, entregas y más</span>
            </span>
            <ChevronRight className="ml-auto" aria-hidden="true" size={21} />
          </a>

          <section className="mt-4" aria-labelledby="categories-title">
            <h2 id="categories-title" className="text-[0.92rem] font-black text-slate-950">¿Qué necesitas?</h2>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {categories.map(({ name, icon: Icon, active }) => (
                <div
                  key={name}
                  aria-disabled={!active}
                  aria-label={active ? name : `${name}, no disponible`}
                  className={`text-center ${active ? "" : "select-none opacity-40 grayscale"}`}
                >
                  <div className={`mx-auto grid size-[3.9rem] place-items-center rounded-2xl border ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
                    <Icon aria-hidden="true" size={27} strokeWidth={1.9} />
                  </div>
                  <span className={`mt-1.5 block text-[0.65rem] font-bold ${active ? "text-[#101a5c]" : "text-slate-500"}`}>{name}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="servicios" className="mt-5 scroll-mt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[0.92rem] font-black text-slate-950">Motomandados disponibles ahora</h2>
              <span className="text-[0.68rem] font-bold text-blue-600">Ver todos</span>
            </div>
            <ServiceList citySlug={city.slug} services={services} totals={totals} />
          </section>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-5px_18px_rgba(15,23,42,0.06)] backdrop-blur" aria-label="Navegación móvil">
          <div className="grid grid-cols-4">
            {[
              [Home, "Inicio", "#inicio"],
              [Search, "Buscar", "#servicios"],
              [Bike, "Mandados", "#servicios"],
              [Menu, "Más", "#categorias"],
            ].map(([Icon, label, href], index) => (
              <a key={label} href={href} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold ${index === 0 ? "text-blue-600" : "text-slate-500"}`}>
                <Icon aria-hidden="true" size={20} fill={index === 0 ? "currentColor" : "none"} /> {label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
