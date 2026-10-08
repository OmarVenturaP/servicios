import { cache } from "react";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activeServiceCategoryCondition } from "@/db/category-visibility";
import { buildPublicCategories } from "@/domain/service-categories";
import { serviceCategories } from "@/config/service-categories";
import { effectiveAvailableCondition, effectiveOccupiedCondition, getTimeZoneOffsetMinutes } from "@/db/availability";
import {
  catCiudades,
  catCategorias,
  catEstadosUnidad,
  datServicios,
  datHorariosServicio,
  datHorariosUnidad,
  datUnidades,
  relServiciosCategorias,
} from "@/db/schema";
import { getTodaySchedule, mergeScheduleRanges } from "@/domain/service-schedule";

export const getPublicServicesByCity = cache(async function getPublicServicesByCity(citySlug) {
  const db = getDb();

  const [city] = await db
    .select({
      id: catCiudades.id,
      name: catCiudades.nombre,
      slug: catCiudades.slug,
      state: catCiudades.estado,
      country: catCiudades.pais,
      updatedAt: catCiudades.updatedAt,
      timeZone: catCiudades.zonaHoraria,
    })
    .from(catCiudades)
    .where(and(eq(catCiudades.slug, citySlug), eq(catCiudades.activo, true)))
    .limit(1);

  if (!city) {
    return null;
  }

  const categoryRecords = await db.select({ id: catCategorias.id, slug: catCategorias.slug, name: catCategorias.nombre, icon: catCategorias.icono, active: catCategorias.activo }).from(catCategorias).orderBy(asc(catCategorias.id));
  const categories = buildPublicCategories(categoryRecords, serviceCategories);

  const effectiveAvailability = effectiveAvailableCondition({ timeZoneOffsetMinutes: getTimeZoneOffsetMinutes(city.timeZone) });
  const effectiveOccupation = effectiveOccupiedCondition();
  const availableUnits = sql`sum(case when ${effectiveAvailability} then 1 else 0 end)`;
  const occupiedUnits = sql`sum(case when ${effectiveOccupation} then 1 else 0 end)`;
  const minimumAvailablePrice = sql`min(case when ${effectiveAvailability} then ${datUnidades.precioBase} else null end)`;
  const latestAvailabilityUpdate = sql`max(case when ${effectiveAvailability} then ${datUnidades.estadoActualizadoAt} else null end)`;

  const rows = await db
    .select({
      id: datServicios.id,
      slug: datServicios.slug,
      name: datServicios.nombre,
      shortInformation: datServicios.informacionCorta,
      extendedInformation: datServicios.informacionExtendida,
      operationMode: datServicios.modoOperacion,
      coverage: datServicios.coberturaTexto,
      logoUrl: datServicios.logoUrl,
      source: datServicios.fuente,
      categorySlug: catCategorias.slug,
      categoryName: catCategorias.nombre,
      requiresUnits: catCategorias.requiereUnidades,
      cashPayment: datServicios.pagoEfectivo,
      cardPayment: datServicios.pagoTarjeta,
      transferPayment: datServicios.pagoTransferencia,
      availableUnits,
      occupiedUnits,
      priceFrom: minimumAvailablePrice,
      availabilityUpdatedAt: latestAvailabilityUpdate,
    })
    .from(datServicios)
    .innerJoin(catCategorias, eq(catCategorias.id, datServicios.categoriaId))
    .leftJoin(datUnidades, eq(datUnidades.servicioId, datServicios.id))
    .leftJoin(catEstadosUnidad, eq(catEstadosUnidad.id, datUnidades.estadoId))
    .where(and(eq(datServicios.ciudadId, city.id), eq(datServicios.visible, true), activeServiceCategoryCondition(db)))
    .groupBy(
      datServicios.id,
      datServicios.slug,
      datServicios.nombre,
      datServicios.informacionCorta,
      datServicios.informacionExtendida,
      datServicios.modoOperacion,
      datServicios.coberturaTexto,
      datServicios.logoUrl,
      datServicios.fuente,
      catCategorias.slug,
      catCategorias.nombre,
      catCategorias.requiereUnidades,
      datServicios.pagoEfectivo,
      datServicios.pagoTarjeta,
      datServicios.pagoTransferencia,
    )
    .orderBy(
      desc(sql`(${availableUnits}) > 0`),
      asc(sql`rand()`),
    );

  const serviceIds = rows.map((row) => row.id);
  const [serviceScheduleRows, unitScheduleRows, serviceCategoryRows] = serviceIds.length ? await Promise.all([
    db.select({ serviceId: datHorariosServicio.servicioId, day: datHorariosServicio.diaSemana, block: datHorariosServicio.bloque, start: datHorariosServicio.horaInicio, end: datHorariosServicio.horaFin }).from(datHorariosServicio).where(inArray(datHorariosServicio.servicioId, serviceIds)).orderBy(asc(datHorariosServicio.servicioId), asc(datHorariosServicio.diaSemana), asc(datHorariosServicio.bloque)),
    db.select({ serviceId: datUnidades.servicioId, day: datHorariosUnidad.diaSemana, block: datHorariosUnidad.bloque, start: datHorariosUnidad.horaInicio, end: datHorariosUnidad.horaFin }).from(datHorariosUnidad).innerJoin(datUnidades, eq(datUnidades.id, datHorariosUnidad.unidadId)).where(and(inArray(datUnidades.servicioId, serviceIds), eq(datUnidades.activo, true), eq(datUnidades.modoDisponibilidad, "programado"))).orderBy(asc(datUnidades.servicioId), asc(datHorariosUnidad.diaSemana), asc(datHorariosUnidad.horaInicio)),
    db.select({ serviceId: relServiciosCategorias.servicioId, categorySlug: catCategorias.slug, categoryName: catCategorias.nombre }).from(relServiciosCategorias).innerJoin(catCategorias, eq(catCategorias.id, relServiciosCategorias.categoriaId)).where(and(inArray(relServiciosCategorias.servicioId, serviceIds), eq(catCategorias.activo, true))).orderBy(asc(relServiciosCategorias.servicioId), asc(catCategorias.nombre)),
  ]) : [[], [], []];
  const serviceSchedules = new Map();
  for (const item of serviceScheduleRows) serviceSchedules.set(item.serviceId, [...(serviceSchedules.get(item.serviceId) ?? []), item]);
  const unitSchedules = new Map();
  for (const item of unitScheduleRows) unitSchedules.set(item.serviceId, [...(unitSchedules.get(item.serviceId) ?? []), item]);
  const categoriesByService = new Map();
  for (const item of serviceCategoryRows) categoriesByService.set(item.serviceId, [...(categoriesByService.get(item.serviceId) ?? []), item]);

  const services = rows.map((row) => {
    const weeklySchedule = row.operationMode === "servicio"
      ? serviceSchedules.get(row.id) ?? []
      : mergeScheduleRanges(unitSchedules.get(row.id) ?? []);
    const relatedCategories = categoriesByService.get(row.id) ?? [{ categorySlug: row.categorySlug, categoryName: row.categoryName }];
    return ({
      ...row,
      availableUnits: Number(row.availableUnits),
      occupiedUnits: Number(row.occupiedUnits),
      requiresUnits: Boolean(row.requiresUnits),
      cashPayment: Boolean(row.cashPayment),
      cardPayment: Boolean(row.cardPayment),
      transferPayment: Boolean(row.transferPayment),
      isAvailable: row.operationMode === "servicio" || Number(row.availableUnits) > 0,
      publicState: row.operationMode === "servicio" ? "informacion"
        : Number(row.availableUnits) > 0
          ? "disponible"
          : Number(row.occupiedUnits) > 0
            ? "ocupado"
            : "no_disponible",
      priceFrom: row.priceFrom === null ? null : Number(row.priceFrom),
      weeklySchedule,
      todaySchedule: getTodaySchedule(weeklySchedule, city.timeZone),
      categorySlugs: relatedCategories.map((category) => category.categorySlug),
      categoryNames: relatedCategories.map((category) => category.categoryName),
    });
  });

  return {
    city,
    categories,
    services,
    totals: {
      services: services.length,
      availableUnits: services.reduce(
        (total, service) => total + service.availableUnits,
        0,
      ),
    },
  };
});
