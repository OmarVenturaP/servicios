import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Info, Siren } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import SiteFooter from "@/components/SiteFooter";
import { absoluteUrl, siteConfig } from "@/config/site";
import { getPublicEmergencyContactsByCity } from "@/services/emergency-contacts";

export async function generateMetadata({ params }) {
  const { ciudad } = await params;
  const result = await getPublicEmergencyContactsByCity(ciudad);
  if (!result) return { title: "Ciudad no disponible", robots: { index: false, follow: false } };
  const title = `Servicios de emergencia en ${result.city.name}`;
  const description = `Contactos institucionales de emergencia verificados para ${result.city.name}, ${result.city.state}.`;
  const url = absoluteUrl(`/${result.city.slug}/emergencias`);
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, siteName: siteConfig.seoName, locale: "es_MX", type: "website" } };
}

export default async function EmergenciesPage({ params }) {
  await connection();
  const { ciudad } = await params;
  const result = await getPublicEmergencyContactsByCity(ciudad);
  if (!result) notFound();

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <main className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <header className="px-5 pb-5 pt-6">
          <div className="flex items-center justify-between gap-3"><BrandMark /><Link href={`/${result.city.slug}`} aria-label={`Volver a Servicios ${result.city.name}`} className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"><ArrowLeft aria-hidden="true" size={20} /></Link></div>
          <div className="mt-7 flex items-start gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-600 text-white"><Siren aria-hidden="true" size={25} /></span><div><p className="text-xs font-extrabold uppercase tracking-wide text-red-600">Directorio institucional</p><h1 className="mt-1 text-2xl font-black leading-tight text-[var(--brand-navy)]">Servicios de emergencia</h1><p className="mt-1 text-sm font-semibold text-slate-600">{result.city.name}, {result.city.state}, {result.city.country}</p></div></div>
        </header>

        <section className="px-5 pb-8">
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs leading-5 text-red-600"><Info className="mt-0.5 shrink-0 text-[var(--brand-yellow)]" aria-hidden="true" size={17} /><p><strong>Servicios</strong> facilita estos datos de contacto. No recibe reportes, despacha unidades ni garantiza tiempos de atención.</p></div>
          {result.contacts.length ? <div className="grid gap-4">{result.contacts.map((contact) => <EmergencyContactCard key={contact.id} contact={contact} city={result.city} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><Siren className="mx-auto text-slate-400" aria-hidden="true" size={30} /><h2 className="mt-3 font-black text-[var(--brand-navy)]">Contactos pendientes de publicación</h2><p className="mt-2 text-sm leading-6 text-slate-600">Aún no hay contactos de emergencia verificados publicados para esta ciudad.</p></div>}
        </section>
        <SiteFooter compact />
      </main>
    </div>
  );
}
