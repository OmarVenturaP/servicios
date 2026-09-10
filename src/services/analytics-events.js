import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { catCiudades, datServicios, logEventosAnalitica } from "@/db/schema";
import { normalizeAttribution, normalizeResultPosition } from "@/lib/analytics-context";

const EVENTS = new Set(["service_impression", "service_interaction", "search", "filter_change"]);

export class AnalyticsEventError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function registerAnalyticsEvent({ citySlug, serviceSlug, event, resultPosition, value, sessionId, trafficType, attribution }) {
  if (!EVENTS.has(event)) throw new AnalyticsEventError("invalid_event", "Evento no válido.");
  const db = getDb();
  const [city] = await db.select({ id: catCiudades.id }).from(catCiudades).where(and(eq(catCiudades.slug, citySlug), eq(catCiudades.activo, true))).limit(1);
  if (!city) throw new AnalyticsEventError("city_not_found", "Ciudad no encontrada.", 404);

  let serviceId = null;
  if (event.startsWith("service_")) {
    const [service] = await db.select({ id: datServicios.id }).from(datServicios).where(and(eq(datServicios.ciudadId, city.id), eq(datServicios.slug, serviceSlug), eq(datServicios.visible, true))).limit(1);
    if (!service) throw new AnalyticsEventError("service_not_found", "Servicio no encontrado.", 404);
    serviceId = service.id;
  }

  const normalizedValue = typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : null;
  if (event === "service_impression") {
    const [recent] = await db.select({ id: logEventosAnalitica.id }).from(logEventosAnalitica).where(and(eq(logEventosAnalitica.sessionId, sessionId), eq(logEventosAnalitica.evento, event), eq(logEventosAnalitica.servicioId, serviceId), sql`${logEventosAnalitica.createdAt} > date_sub(now(), interval 30 minute)`)).limit(1);
    if (recent) return { status: "already_registered" };
  }

  const context = normalizeAttribution(attribution);
  await db.insert(logEventosAnalitica).values({
    ciudadId: city.id,
    servicioId: serviceId,
    sessionId,
    evento: event,
    resultPosition: normalizeResultPosition(resultPosition),
    valor: normalizedValue,
    tipoTrafico: trafficType,
    origen: context.origin,
    utmSource: context.utmSource,
    utmMedium: context.utmMedium,
    utmCampaign: context.utmCampaign,
    utmContent: context.utmContent,
  });
  return { status: "registered" };
}
