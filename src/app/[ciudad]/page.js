import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Bike,
  Check,
  Home,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
import LandingExperience from "@/components/LandingExperience";
import VisitTracker from "@/components/VisitTracker";
import { getPublicServicesByCity } from "@/db/queries/public-services";

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
              ¿Necesitas<br />un servicio?
            </h1>
            <p className="mt-3 text-[0.78rem] font-medium leading-[1.45] text-[#17266b]">
              Conecta con proveedores disponibles en {city.name}.
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
              [MapPin, "Gente local"],
            ].map(([Icon, label]) => (
              <div key={label} className="flex items-center justify-center gap-1.5 text-[0.72rem] font-bold text-[#101a5c]">
                <Icon aria-hidden="true" size={20} strokeWidth={2.2} /> {label}
              </div>
            ))}
          </section>

          <LandingExperience citySlug={city.slug} services={services} totals={totals} />
        </main>

        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-5px_18px_rgba(15,23,42,0.06)] backdrop-blur" aria-label="Navegación móvil">
          <div className="grid grid-cols-4">
            {[
              [Home, "Inicio", "#inicio"],
              [Search, "Buscar", "#categorias"],
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
