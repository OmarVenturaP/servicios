import { and, asc, count, countDistinct, desc, eq, gte, lte, min, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { catCiudades, datServicios, datUnidades, logContactos, logEventosAnalitica, logVisitas } from "@/db/schema";

export const METRICS_TIME_ZONE = "America/Mexico_City";

const PERIODS = new Set(["today", "7d", "30d"]);

export class AdminMetricsError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "AdminMetricsError";
    this.code = code;
    this.status = status;
  }
}

function zonedParts(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: METRICS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]),
  );
}

function timeZoneOffsetMs(date) {
  const parts = zonedParts(date);
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return representedAsUtc - date.getTime();
}

function localMidnightUtc(year, month, day) {
  const approximation = new Date(Date.UTC(year, month - 1, day));
  const firstPass = new Date(approximation.getTime() - timeZoneOffsetMs(approximation));
  return new Date(approximation.getTime() - timeZoneOffsetMs(firstPass));
}

function mysqlOffset(date) {
  const totalMinutes = Math.round(timeZoneOffsetMs(date) / 60000);
  const sign = totalMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(totalMinutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

export function resolveMetricsPeriod(value, now = new Date()) {
  if (!PERIODS.has(value)) {
    throw new AdminMetricsError("invalid_period", "El periodo seleccionado no es válido.");
  }

  const today = zonedParts(now);
  const days = value === "today" ? 1 : value === "7d" ? 7 : 30;
  const localStart = new Date(Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day)));
  localStart.setUTCDate(localStart.getUTCDate() - (days - 1));

  return {
    key: value,
    start: localMidnightUtc(localStart.getUTCFullYear(), localStart.getUTCMonth() + 1, localStart.getUTCDate()),
    end: now,
    offset: mysqlOffset(now),
    timeZone: METRICS_TIME_ZONE,
  };
}

function numeric(value) {
  return Number(value ?? 0);
}

function percentage(numerator, denominator) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function contactSummary(row) {
  return {
    contacts: numeric(row.contacts),
    whatsapp: numeric(row.whatsapp),
    calls: numeric(row.calls),
  };
}

export async function getAdminMetrics(periodKey) {
  const period = resolveMetricsPeriod(periodKey);
  const db = getDb();
  const visitRange = and(gte(logVisitas.createdAt, period.start), lte(logVisitas.createdAt, period.end));
  const contactRange = and(gte(logContactos.createdAt, period.start), lte(logContactos.createdAt, period.end));
  const eventRange = and(gte(logEventosAnalitica.createdAt, period.start), lte(logEventosAnalitica.createdAt, period.end));
  const whatsappCount = sql`sum(case when ${logContactos.canal} = 'whatsapp' then 1 else 0 end)`;
  const callCount = sql`sum(case when ${logContactos.canal} = 'llamada' then 1 else 0 end)`;

  const impressionCount = sql`sum(case when ${logEventosAnalitica.evento} = 'service_impression' then 1 else 0 end)`;
  const interactionCount = sql`sum(case when ${logEventosAnalitica.evento} = 'service_interaction' then 1 else 0 end)`;
  const firstVisits = db.select({ sessionId: logVisitas.sessionId, firstSeen: min(logVisitas.createdAt).as("first_seen") }).from(logVisitas).groupBy(logVisitas.sessionId).as("first_visits");

  const [visitRows, contactRows, serviceRows, unitRows, visitCityRows, contactCityRows, visitDailyRows, contactDailyRows, eventRows, serviceEventRows, eventDailyRows, visitorTypeRows, visitTrafficRows, contactTrafficRows, sourceVisitRows, sourceContactRows] = await Promise.all([
    db.select({ visits: count(logVisitas.id), uniqueVisitors: countDistinct(logVisitas.sessionId), newVisitors: sql`count(distinct case when ${firstVisits.firstSeen} >= ${period.start} then ${logVisitas.sessionId} end)`, returningVisitors: sql`count(distinct case when ${firstVisits.firstSeen} < ${period.start} then ${logVisitas.sessionId} end)` }).from(logVisitas).innerJoin(firstVisits, eq(firstVisits.sessionId, logVisitas.sessionId)).where(visitRange),
    db.select({ contacts: count(logContactos.id), uniqueVisitors: countDistinct(logContactos.sessionId), attributedContactVisitors: sql`count(distinct case when ${logContactos.tipoTrafico} is not null then ${logContactos.sessionId} end)`, whatsapp: whatsappCount, calls: callCount }).from(logContactos).where(contactRange),
    db.select({
      serviceId: datServicios.id,
      serviceName: datServicios.nombre,
      cityName: catCiudades.nombre,
      visible: datServicios.visible,
      contacts: count(logContactos.id),
      uniqueVisitors: countDistinct(logContactos.sessionId),
      attributedContactVisitors: sql`count(distinct case when ${logContactos.tipoTrafico} is not null then ${logContactos.sessionId} end)`,
      whatsapp: whatsappCount,
      calls: callCount,
    }).from(logContactos)
      .innerJoin(datServicios, eq(datServicios.id, logContactos.servicioId))
      .innerJoin(catCiudades, eq(catCiudades.id, logContactos.ciudadId))
      .where(contactRange)
      .groupBy(datServicios.id, datServicios.nombre, catCiudades.nombre, datServicios.visible)
      .orderBy(desc(count(logContactos.id)), asc(datServicios.nombre)),
    db.select({
      serviceId: datServicios.id,
      serviceName: datServicios.nombre,
      unitId: logContactos.unidadId,
      unitName: datUnidades.nombre,
      contacts: count(logContactos.id),
      whatsapp: whatsappCount,
      calls: callCount,
    }).from(logContactos)
      .innerJoin(datServicios, eq(datServicios.id, logContactos.servicioId))
      .leftJoin(datUnidades, eq(datUnidades.id, logContactos.unidadId))
      .where(contactRange)
      .groupBy(datServicios.id, datServicios.nombre, logContactos.unidadId, datUnidades.nombre)
      .orderBy(desc(count(logContactos.id)), asc(datServicios.nombre), asc(datUnidades.nombre)),
    db.select({
      cityId: catCiudades.id,
      cityName: catCiudades.nombre,
      visits: count(logVisitas.id),
      uniqueVisitors: countDistinct(logVisitas.sessionId),
    }).from(logVisitas)
      .innerJoin(catCiudades, eq(catCiudades.id, logVisitas.ciudadId))
      .where(visitRange)
      .groupBy(catCiudades.id, catCiudades.nombre),
    db.select({
      cityId: catCiudades.id,
      cityName: catCiudades.nombre,
      contacts: count(logContactos.id),
      whatsapp: whatsappCount,
      calls: callCount,
    }).from(logContactos)
      .innerJoin(catCiudades, eq(catCiudades.id, logContactos.ciudadId))
      .where(contactRange)
      .groupBy(catCiudades.id, catCiudades.nombre),
    db.select({
      date: sql`date_format(convert_tz(${logVisitas.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`,
      visits: count(logVisitas.id),
      uniqueVisitors: countDistinct(logVisitas.sessionId),
    }).from(logVisitas)
      .where(visitRange)
      .groupBy(sql`date_format(convert_tz(${logVisitas.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`)
      .orderBy(asc(sql`date_format(convert_tz(${logVisitas.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`)),
    db.select({
      date: sql`date_format(convert_tz(${logContactos.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`,
      contacts: count(logContactos.id),
    }).from(logContactos)
      .where(contactRange)
      .groupBy(sql`date_format(convert_tz(${logContactos.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`)
      .orderBy(asc(sql`date_format(convert_tz(${logContactos.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`)),
    db.select({ impressions: impressionCount, interactions: interactionCount, exposedVisitors: sql`count(distinct case when ${logEventosAnalitica.evento} = 'service_impression' then ${logEventosAnalitica.sessionId} end)`, interactingVisitors: sql`count(distinct case when ${logEventosAnalitica.evento} = 'service_interaction' then ${logEventosAnalitica.sessionId} end)` }).from(logEventosAnalitica).where(eventRange),
    db.select({ serviceId: datServicios.id, serviceName: datServicios.nombre, cityName: catCiudades.nombre, visible: datServicios.visible, impressions: impressionCount, interactions: interactionCount, exposedVisitors: sql`count(distinct case when ${logEventosAnalitica.evento} = 'service_impression' then ${logEventosAnalitica.sessionId} end)`, interactingVisitors: sql`count(distinct case when ${logEventosAnalitica.evento} = 'service_interaction' then ${logEventosAnalitica.sessionId} end)`, averagePosition: sql`avg(case when ${logEventosAnalitica.evento} = 'service_impression' then ${logEventosAnalitica.resultPosition} end)` }).from(logEventosAnalitica).innerJoin(datServicios, eq(datServicios.id, logEventosAnalitica.servicioId)).innerJoin(catCiudades, eq(catCiudades.id, logEventosAnalitica.ciudadId)).where(and(eventRange, sql`${logEventosAnalitica.servicioId} is not null`)).groupBy(datServicios.id, datServicios.nombre, catCiudades.nombre, datServicios.visible),
    db.select({ date: sql`date_format(convert_tz(${logEventosAnalitica.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`, impressions: impressionCount, interactions: interactionCount }).from(logEventosAnalitica).where(eventRange).groupBy(sql`date_format(convert_tz(${logEventosAnalitica.createdAt}, '+00:00', ${period.offset}), '%Y-%m-%d')`),
    db.select({ type: sql`case when ${firstVisits.firstSeen} >= ${period.start} then 'nuevo' else 'recurrente' end`, visitors: countDistinct(logVisitas.sessionId) }).from(logVisitas).innerJoin(firstVisits, eq(firstVisits.sessionId, logVisitas.sessionId)).where(visitRange).groupBy(sql`case when ${firstVisits.firstSeen} >= ${period.start} then 'nuevo' else 'recurrente' end`),
    db.select({ type: sql`coalesce(${logVisitas.tipoTrafico}, 'sin_clasificar')`, visits: count(logVisitas.id), visitors: countDistinct(logVisitas.sessionId) }).from(logVisitas).where(visitRange).groupBy(sql`coalesce(${logVisitas.tipoTrafico}, 'sin_clasificar')`),
    db.select({ type: sql`coalesce(${logContactos.tipoTrafico}, 'sin_clasificar')`, contacts: count(logContactos.id) }).from(logContactos).where(contactRange).groupBy(sql`coalesce(${logContactos.tipoTrafico}, 'sin_clasificar')`),
    db.select({ source: sql`coalesce(${logVisitas.utmSource}, ${logVisitas.origen}, 'desconocido')`, medium: sql`coalesce(${logVisitas.utmMedium}, 'no_disponible')`, campaign: sql`coalesce(${logVisitas.utmCampaign}, 'sin_campaña')`, visits: count(logVisitas.id), visitors: countDistinct(logVisitas.sessionId) }).from(logVisitas).where(visitRange).groupBy(sql`coalesce(${logVisitas.utmSource}, ${logVisitas.origen}, 'desconocido')`, sql`coalesce(${logVisitas.utmMedium}, 'no_disponible')`, sql`coalesce(${logVisitas.utmCampaign}, 'sin_campaña')`),
    db.select({ source: sql`coalesce(${logContactos.utmSource}, ${logContactos.origen}, 'desconocido')`, medium: sql`coalesce(${logContactos.utmMedium}, 'no_disponible')`, campaign: sql`coalesce(${logContactos.utmCampaign}, 'sin_campaña')`, contacts: count(logContactos.id) }).from(logContactos).where(contactRange).groupBy(sql`coalesce(${logContactos.utmSource}, ${logContactos.origen}, 'desconocido')`, sql`coalesce(${logContactos.utmMedium}, 'no_disponible')`, sql`coalesce(${logContactos.utmCampaign}, 'sin_campaña')`),
  ]);

  const visits = numeric(visitRows[0]?.visits);
  const contacts = numeric(contactRows[0]?.contacts);
  const cityMap = new Map();
  for (const row of visitCityRows) {
    cityMap.set(row.cityId, {
      id: row.cityId,
      name: row.cityName,
      visits: numeric(row.visits),
      uniqueVisitors: numeric(row.uniqueVisitors),
      contacts: 0,
      whatsapp: 0,
      calls: 0,
    });
  }
  for (const row of contactCityRows) {
    const city = cityMap.get(row.cityId) ?? {
      id: row.cityId,
      name: row.cityName,
      visits: 0,
      uniqueVisitors: 0,
      contacts: 0,
      whatsapp: 0,
      calls: 0,
    };
    Object.assign(city, contactSummary(row));
    cityMap.set(row.cityId, city);
  }

  const dailyMap = new Map();
  for (const row of visitDailyRows) {
    dailyMap.set(row.date, { date: row.date, visits: numeric(row.visits), uniqueVisitors: numeric(row.uniqueVisitors), contacts: 0, impressions: 0, interactions: 0 });
  }
  for (const row of contactDailyRows) {
    const day = dailyMap.get(row.date) ?? { date: row.date, visits: 0, uniqueVisitors: 0, contacts: 0, impressions: 0, interactions: 0 };
    day.contacts = numeric(row.contacts);
    dailyMap.set(row.date, day);
  }
  for (const row of eventDailyRows) {
    const day = dailyMap.get(row.date) ?? { date: row.date, visits: 0, uniqueVisitors: 0, contacts: 0, impressions: 0, interactions: 0 };
    day.impressions = numeric(row.impressions);
    day.interactions = numeric(row.interactions);
    dailyMap.set(row.date, day);
  }

  const serviceMap = new Map(serviceEventRows.map((row) => [row.serviceId, {
    id: row.serviceId,
    name: row.serviceName,
    cityName: row.cityName,
    visible: Boolean(row.visible),
    impressions: numeric(row.impressions),
    exposedVisitors: numeric(row.exposedVisitors),
    interactions: numeric(row.interactions),
    interactingVisitors: numeric(row.interactingVisitors),
    averagePosition: row.averagePosition === null ? null : Number(Number(row.averagePosition).toFixed(1)),
    contacts: 0, whatsapp: 0, calls: 0, uniqueVisitors: 0, attributedContactVisitors: 0,
  }]));
  for (const row of serviceRows) {
    const service = serviceMap.get(row.serviceId) ?? { id: row.serviceId, name: row.serviceName, cityName: row.cityName, visible: Boolean(row.visible), impressions: 0, exposedVisitors: 0, interactions: 0, averagePosition: null };
    Object.assign(service, contactSummary(row), { uniqueVisitors: numeric(row.uniqueVisitors), attributedContactVisitors: numeric(row.attributedContactVisitors) });
    serviceMap.set(row.serviceId, service);
  }

  const trafficMap = new Map();
  for (const row of visitTrafficRows) trafficMap.set(row.type, { type: row.type, visits: numeric(row.visits), visitors: numeric(row.visitors), contacts: 0 });
  for (const row of contactTrafficRows) {
    const item = trafficMap.get(row.type) ?? { type: row.type, visits: 0, visitors: 0, contacts: 0 };
    item.contacts = numeric(row.contacts);
    trafficMap.set(row.type, item);
  }

  const sourceKey = (row) => `${row.source}|${row.medium}|${row.campaign}`;
  const sourceMap = new Map();
  for (const row of sourceVisitRows) sourceMap.set(sourceKey(row), { source: row.source, medium: row.medium, campaign: row.campaign, visits: numeric(row.visits), visitors: numeric(row.visitors), contacts: 0 });
  for (const row of sourceContactRows) {
    const key = sourceKey(row);
    const item = sourceMap.get(key) ?? { source: row.source, medium: row.medium, campaign: row.campaign, visits: 0, visitors: 0, contacts: 0 };
    item.contacts = numeric(row.contacts);
    sourceMap.set(key, item);
  }

  return {
    period: {
      key: period.key,
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      timeZone: period.timeZone,
    },
    summary: {
      visits,
      uniqueVisitors: numeric(visitRows[0]?.uniqueVisitors),
      contacts,
      whatsapp: numeric(contactRows[0]?.whatsapp),
      calls: numeric(contactRows[0]?.calls),
      contactRate: percentage(contacts, visits),
      sessions: visits,
      newVisitors: numeric(visitRows[0]?.newVisitors),
      returningVisitors: numeric(visitRows[0]?.returningVisitors),
      impressions: numeric(eventRows[0]?.impressions),
      exposedVisitors: numeric(eventRows[0]?.exposedVisitors),
      interactions: numeric(eventRows[0]?.interactions),
      interactionRate: percentage(numeric(eventRows[0]?.interactingVisitors), numeric(eventRows[0]?.exposedVisitors)),
      exposureContactRate: percentage(numeric(contactRows[0]?.attributedContactVisitors), numeric(eventRows[0]?.exposedVisitors)),
    },
    services: [...serviceMap.values()].map((service) => ({ ...service, share: percentage(service.contacts, contacts), interactionRate: percentage(service.interactingVisitors, service.exposedVisitors), contactRate: percentage(service.attributedContactVisitors, service.exposedVisitors) })).sort((a, b) => b.contacts - a.contacts || b.impressions - a.impressions || a.name.localeCompare(b.name, "es-MX")),
    units: unitRows.map((row) => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      unitId: row.unitId,
      unitName: row.unitId === null ? "Contacto central del servicio" : row.unitName || `Unidad ${row.unitId}`,
      central: row.unitId === null,
      ...contactSummary(row),
    })),
    cities: [...cityMap.values()]
      .map((city) => ({ ...city, contactRate: percentage(city.contacts, city.visits) }))
      .sort((left, right) => right.contacts - left.contacts || left.name.localeCompare(right.name, "es-MX")),
    daily: [...dailyMap.values()].sort((left, right) => left.date.localeCompare(right.date)),
    visitorTypes: visitorTypeRows.map((row) => ({ type: row.type, visitors: numeric(row.visitors) })),
    traffic: [...trafficMap.values()].sort((a, b) => b.visits - a.visits),
    sources: [...sourceMap.values()].map((item) => ({ ...item, contactRate: percentage(item.contacts, item.visits) })).sort((a, b) => b.visits - a.visits || b.contacts - a.contacts),
  };
}
