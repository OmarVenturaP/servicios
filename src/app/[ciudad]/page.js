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
import PilotInvitation from "@/components/PilotInvitation";
import SiteFooter from "@/components/SiteFooter";
import VisitTracker from "@/components/VisitTracker";
import { absoluteUrl, siteConfig } from "@/config/site";
import { getPublicServicesByCity } from "@/db/queries/public-services";

export async function generateMetadata({ params }) {
  const { ciudad: citySlug } = await params;
  const availability = await getPublicServicesByCity(citySlug);

  if (!availability) return { title: "Ciudad no disponible", robots: { index: false, follow: false } };

  const { city } = availability;
  const title = `Servicios locales en ${city.name}`;
  const description = `Encuentra mandados y servicios locales disponibles en ${city.name}, compara precios desde y contacta directamente con prestadores.`;
  const url = absoluteUrl(`/${city.slug}`);
  const socialImage = {
    url: siteConfig.assets.socialImage,
    width: 1200,
    height: 630,
    alt: `Servicios locales disponibles en ${city.name}`,
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      locale: "es_MX",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [siteConfig.assets.socialImage],
    },
  };
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${cityUrl}#webpage`,
    url: cityUrl,
    name: `Servicios locales en ${city.name}`,
    description: `Directorio de mandados y servicios locales disponibles en ${city.name}.`,
    inLanguage: "es-MX",
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    about: {
      "@type": "Place",
      name: city.name,
    },
  };

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
      <VisitTracker citySlug={city.slug} />
      <div id="inicio" className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <section className="hero-reference relative h-[16.2rem] overflow-hidden">
          <Header href="#inicio" />
          <p className="relative z-10 px-6 text-xs font-semibold text-slate-700">
            Servicios en {city.name}
          </p>
          <p className="relative z-10 px-6 text-xs font-semibold text-slate-700">
            {siteConfig.tagline}
          </p>
          <div className="relative z-10 mt-7 w-[58%] px-6">
            <h1 className="text-[1.9rem] font-black leading-[0.96] tracking-[-0.045em] text-[var(--brand-navy)]">
              ¿Necesitas<br />un servicio?
            </h1>
            <p className="mt-3 text-[0.82rem] font-medium leading-[1.5] text-[var(--brand-navy)]">
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

          <LandingExperience citySlug={city.slug} services={services} totals={totals} />
        </main>

        <HowItWorks />
        <PilotInvitation />
        <SiteFooter compact />

      </div>
    </div>
  );
}
