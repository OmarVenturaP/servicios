import { connection } from "next/server";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { catCiudades, catCategorias, catModosContacto } from "@/db/schema";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import RegistrationForm from "@/components/RegistrationForm";

export const metadata = {
  title: "Registro de prestador sin costo",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({ params }) {
  await connection();
  const { ciudad: citySlug } = await params;
  const db = getDb();
  const [cityRecord] = await db.select().from(catCiudades).where(eq(catCiudades.slug, citySlug)).limit(1);
  if (!cityRecord || !cityRecord.activo) notFound();

  const city = { id: cityRecord.id, name: cityRecord.nombre, slug: cityRecord.slug };

  const [categoryRecords, contactModeRecords] = await Promise.all([
    db.select().from(catCategorias).where(eq(catCategorias.activo, true)),
    db.select().from(catModosContacto).where(eq(catModosContacto.activo, true)),
  ]);

  const categories = categoryRecords.map((c) => ({
    id: c.id,
    name: c.nombre,
    slug: c.slug,
    requiresUnits: Boolean(c.requiereUnidades),
  }));

  const contactModes = contactModeRecords.map((m) => ({
    id: m.id,
    name: m.nombre,
    key: m.clave,
  }));

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <main className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <Header />
        <div className="px-5 pb-12 pt-4">
          <div className="mb-6">
            <p className="text-sm font-extrabold text-[var(--brand-blue)]">Registro sin costo</p>
            <h1 className="text-2xl font-semibold text-slate-950">Únete en {city.name}</h1>
            <p className="mt-1 text-sm text-slate-600">Registra tu servicio de forma 100% gratuita y obtén tu panel administrativo privado.</p>
          </div>
          <RegistrationForm cityId={city.id} cityName={city.name} categories={categories} contactModes={contactModes} />
        </div>
        <SiteFooter compact />
      </main>
    </div>
  );
}
