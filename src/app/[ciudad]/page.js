import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import LandingExperience from "@/components/LandingExperience";
import LocalSeoContent from "@/components/LocalSeoContent";
import PilotInvitation from "@/components/PilotInvitation";
import SiteFooter from "@/components/SiteFooter";
import VisitTracker from "@/components/VisitTracker";
import { absoluteUrl, siteConfig } from "@/config/site";
import { cityDisplayName, generateCityMetadata, isRealPublicService, safeJsonLd } from "@/config/seo";
import { getPublicServicesByCity } from "@/db/queries/public-services";

export async function generateMetadata({ params }) {
  const { ciudad: citySlug } = await params;
  const availability = await getPublicServicesByCity(citySlug);

  if (!availability) return { title: "Ciudad no disponible", robots: { index: false, follow: false } };
  return generateCityMetadata(availability.city, availability.services);
}

export default async function CityPage({ params }) {
  await connection();
  const { ciudad: citySlug } = await params;
  const availability = await getPublicServicesByCity(citySlug);

  if (!availability) {
    notFound();
  }

  const { city, services, totals } = availability;
  const cityUrl = absoluteUrl(`/${city.slug}`);
  const realServices = services.filter(isRealPublicService);
  const publicServices = services.map(({ source, ...service }) => ({
    ...service,
    isDevelopment: !isRealPublicService({ source }),
  }));
  const location = cityDisplayName(city);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${cityUrl}#webpage`,
        url: cityUrl,
        name: `Servicios locales en ${location}`,
        description: `Directorio para encontrar información, comparar opciones y contactar servicios locales en ${location}.`,
        inLanguage: "es-MX",
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: { "@type": "Place", name: location },
        mainEntity: { "@id": `${cityUrl}#services` },
      },
      {
        "@type": "ItemList",
        "@id": `${cityUrl}#services`,
        name: `Proveedores de mandados en ${city.name}`,
        numberOfItems: realServices.length,
        itemListElement: realServices.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: service.name,
            description: service.description || undefined,
            areaServed: service.coverage || location,
            provider: { "@type": "Organization", name: service.name },
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <VisitTracker citySlug={city.slug} />
      <div id="inicio" className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <section className="hero-reference relative h-[16.2rem] overflow-hidden">
          <Header href="#inicio" />
          <h1 className="relative z-10 px-6 text-xs font-semibold text-slate-700">
            Servicios en {city.name}, {city.state}
          </h1>
          <p className="relative z-10 px-6 text-xs font-semibold text-slate-700">
            {siteConfig.tagline}
          </p>
          <div className="relative z-10 mt-7 w-[58%] px-6">
            <p className="text-[1.9rem] font-black leading-[0.96] tracking-[-0.045em] text-[var(--brand-navy)]">
              ¿Necesitas<br />un servicio?
            </p>
            <p className="mt-3 text-[0.82rem] font-medium leading-[1.5] text-[var(--brand-navy)]">
              Encuentra, compara y contacta proveedores locales en {city.name}.
            </p>
          </div>
          <Image
            className="hero-rider absolute -bottom-8 -right-2 h-[20.5rem] w-[17rem] object-cover object-bottom"
            src="/delivery-rider.png"
            alt="Repartidor de motomandados con equipo de entrega"
            width={1024}
            height={1536}
            sizes="272px"
            priority
          />
        </section>

        <main className="px-5 pb-12">
          <section className="grid grid-cols-3 gap-2.5 py-3" aria-label="Beneficios">
            {[
              [Zap, "Rápido"],
              [ShieldCheck, "Confiable"],
              [MapPin, "Gente local"],
            ].map(([Icon, label]) => (
              <div key={label} className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--brand-navy)]">
                <Icon aria-hidden="true" size={20} strokeWidth={2.2} /> {label}
              </div>
            ))}
          </section>

          <LandingExperience citySlug={city.slug} cityName={city.name} services={publicServices} totals={totals} />
        </main>

        <HowItWorks />
        <LocalSeoContent city={city} />
        <PilotInvitation />
        <SiteFooter compact />

      </div>
    </div>
  );
}
