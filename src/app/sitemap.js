import { eq } from "drizzle-orm";
import { absoluteUrl } from "@/config/site";
import { isIndexableCity } from "@/config/seo";
import { getDb } from "@/db";
import { catCiudades, datServicios } from "@/db/schema";

export const dynamic = "force-dynamic";

const stablePublicPages = [
  ["/preguntas-frecuentes", "2026-09-07", "monthly", 0.6],
  ["/terminos-condiciones", "2026-09-07", "yearly", 0.3],
  ["/aviso-privacidad", "2026-09-07", "yearly", 0.3],
];

export default async function sitemap() {
  const db = getDb();
  const cities = await db.select({
    id: catCiudades.id,
    name: catCiudades.nombre,
    slug: catCiudades.slug,
    state: catCiudades.estado,
    country: catCiudades.pais,
    updatedAt: catCiudades.updatedAt,
  }).from(catCiudades).where(eq(catCiudades.activo, true));
  const services = await db.select({
    cityId: datServicios.ciudadId,
    source: datServicios.fuente,
  }).from(datServicios).where(eq(datServicios.visible, true));

  const cityEntries = cities
    .filter((city) => isIndexableCity(city, services.filter((service) => service.cityId === city.id)))
    .map((city) => ({
      url: absoluteUrl(`/${city.slug}`),
      lastModified: city.updatedAt,
      changeFrequency: "daily",
      priority: 1,
    }));
  const emergencyEntries = cities.map((city) => ({
    url: absoluteUrl(`/${city.slug}/emergencias`),
    lastModified: city.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...cityEntries,
    ...emergencyEntries,
    ...stablePublicPages.map(([path, date, changeFrequency, priority]) => ({
      url: absoluteUrl(path),
      lastModified: new Date(`${date}T00:00:00-06:00`),
      changeFrequency,
      priority,
    })),
  ];
}
