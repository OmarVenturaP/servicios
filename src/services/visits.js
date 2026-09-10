import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { catCiudades, logVisitas } from "@/db/schema";

const VISIT_WINDOW_MINUTES = 30;

export async function registerCityVisit({ citySlug, sessionId, attribution, trafficType }) {
  const db = getDb();
  const [city] = await db
    .select({ id: catCiudades.id })
    .from(catCiudades)
    .where(and(eq(catCiudades.slug, citySlug), eq(catCiudades.activo, true)))
    .limit(1);

  if (!city) {
    return { status: "city_not_found" };
  }

  const [recentVisit] = await db
    .select({ id: logVisitas.id })
    .from(logVisitas)
    .where(
      and(
        eq(logVisitas.ciudadId, city.id),
        eq(logVisitas.sessionId, sessionId),
        sql`${logVisitas.createdAt} > date_sub(now(), interval ${VISIT_WINDOW_MINUTES} minute)`,
      ),
    )
    .limit(1);

  if (recentVisit) {
    return { status: "already_registered" };
  }

  await db.insert(logVisitas).values({
    ciudadId: city.id,
    sessionId,
    origen: attribution.origin,
    tipoTrafico: trafficType,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmContent: attribution.utmContent,
  });

  return { status: "registered" };
}
