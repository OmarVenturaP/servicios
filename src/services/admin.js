import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/db";
import { getEffectiveUnitStatus } from "@/db/availability";
import {
  catCiudades,
  catCategorias,
  catEstadosUnidad,
  catModosContacto,
  datServicios,
  datHorariosServicio,
  datHorariosUnidad,
  datUnidades,
  relServiciosCategorias,
} from "@/db/schema";
import { hashUnitToken } from "@/lib/unit-token";
import { UnitPanelError, updateUnitStatusById } from "@/services/units";
import { normalizeScheduleInput } from "@/domain/service-schedule";
import { normalizeCategoryIds, retainedCategoryIds, validateCategorySelection } from "@/domain/service-categories";

export class AdminError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "AdminError";
    this.code = code;
    this.status = status;
  }
}

function requiredId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AdminError("invalid_id", `${label} inválido.`);
  return id;
}

function text(value, { label, max, required = false }) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if ((required && !normalized) || normalized.length > max) {
    throw new AdminError("invalid_field", `${label} no es válido.`);
  }
  return normalized || null;
}

function phone(value, label) {
  const normalized = text(value, { label, max: 30 });
  if (normalized && !/^\+?[0-9\s()-]{7,30}$/.test(normalized)) {
    throw new AdminError("invalid_phone", `${label} no es válido.`);
  }
  return normalized;
}

function price(value) {
  const normalized = typeof value === "number" ? String(value) : value?.trim();
  if (typeof normalized !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(normalized) || Number(normalized) <= 0) {
    throw new AdminError("invalid_price", "El precio debe ser mayor que cero y tener hasta dos decimales.");
  }
  return Number(normalized).toFixed(2);
}

function slugify(value) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160)
    .replace(/-$/g, "");
  if (!slug) throw new AdminError("invalid_slug", "El nombre no permite generar un slug válido.");
  return slug;
}

function boolean(value, label) {
  if (typeof value !== "boolean") throw new AdminError("invalid_field", `${label} no es válido.`);
  return value;
}

function safeUnit(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    priceBase: Number(row.priceBase),
    active: Boolean(row.active),
    storedState: row.state,
    effectiveState: getEffectiveUnitStatus({ active: row.active, state: row.state, stateUntil: row.stateUntil, availabilityMode: row.availabilityMode, overrideState: row.overrideState, overrideUntil: row.overrideUntil, schedule: row.schedule, timeZone: row.timeZone }),
    stateUntil: row.stateUntil ? new Date(row.stateUntil).toISOString() : null,
    hasAccess: Boolean(row.hasAccess),
    availabilityMode: row.availabilityMode ?? "manual",
  };
}

export async function getAdminSnapshot() {
  const db = getDb();
  const [cities, contactModes, categories, services, units, schedules, serviceSchedules, serviceCategories] = await Promise.all([
    db.select({ id: catCiudades.id, name: catCiudades.nombre, slug: catCiudades.slug, timeZone: catCiudades.zonaHoraria }).from(catCiudades).where(eq(catCiudades.activo, true)).orderBy(asc(catCiudades.nombre)),
    db.select({ id: catModosContacto.id, key: catModosContacto.clave, name: catModosContacto.nombre }).from(catModosContacto).where(eq(catModosContacto.activo, true)).orderBy(asc(catModosContacto.id)),
    db.select({ id: catCategorias.id, name: catCategorias.nombre, slug: catCategorias.slug, requiresUnits: catCategorias.requiereUnidades }).from(catCategorias).where(eq(catCategorias.activo, true)).orderBy(asc(catCategorias.nombre)),
    db.select({
      id: datServicios.id,
      cityId: datServicios.ciudadId,
      cityName: catCiudades.nombre,
      contactModeId: datServicios.modoContactoId,
      categoryId: datServicios.categoriaId,
      categoryName: catCategorias.nombre,
      categorySlug: catCategorias.slug,
      requiresUnits: catCategorias.requiereUnidades,
      name: datServicios.nombre,
      slug: datServicios.slug,
      phone: datServicios.telefono,
      whatsapp: datServicios.whatsapp,
      description: datServicios.descripcion,
      shortInformation: datServicios.informacionCorta,
      extendedInformation: datServicios.informacionExtendida,
      operationMode: datServicios.modoOperacion,
      coverage: datServicios.coberturaTexto,
      logoUrl: datServicios.logoUrl,
      cashPayment: datServicios.pagoEfectivo,
      cardPayment: datServicios.pagoTarjeta,
      transferPayment: datServicios.pagoTransferencia,
      visible: datServicios.visible,
    }).from(datServicios).innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId)).innerJoin(catCategorias, eq(catCategorias.id, datServicios.categoriaId)).orderBy(asc(datServicios.nombre)),
    db.select({
      id: datUnidades.id,
      serviceId: datUnidades.servicioId,
      name: datUnidades.nombre,
      phone: datUnidades.telefono,
      whatsapp: datUnidades.whatsapp,
      priceBase: datUnidades.precioBase,
      active: datUnidades.activo,
      state: catEstadosUnidad.clave,
      stateUntil: datUnidades.estadoHasta,
      hasAccess: datUnidades.tokenHash,
      availabilityMode: datUnidades.modoDisponibilidad,
      overrideState: datUnidades.excepcionEstado,
      overrideUntil: datUnidades.excepcionHasta,
      timeZone: catCiudades.zonaHoraria,
    }).from(datUnidades).innerJoin(datServicios, eq(datServicios.id, datUnidades.servicioId)).innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId)).innerJoin(catEstadosUnidad, eq(catEstadosUnidad.id, datUnidades.estadoId)).orderBy(asc(datUnidades.id)),
    db.select({ unitId: datHorariosUnidad.unidadId, day: datHorariosUnidad.diaSemana, block: datHorariosUnidad.bloque, start: datHorariosUnidad.horaInicio, end: datHorariosUnidad.horaFin }).from(datHorariosUnidad).orderBy(asc(datHorariosUnidad.unidadId), asc(datHorariosUnidad.diaSemana), asc(datHorariosUnidad.bloque)),
    db.select({ serviceId: datHorariosServicio.servicioId, day: datHorariosServicio.diaSemana, block: datHorariosServicio.bloque, start: datHorariosServicio.horaInicio, end: datHorariosServicio.horaFin }).from(datHorariosServicio).orderBy(asc(datHorariosServicio.servicioId), asc(datHorariosServicio.diaSemana), asc(datHorariosServicio.bloque)),
    db.select({ serviceId: relServiciosCategorias.servicioId, categoryId: relServiciosCategorias.categoriaId, categoryName: catCategorias.nombre, categorySlug: catCategorias.slug }).from(relServiciosCategorias).innerJoin(catCategorias, eq(catCategorias.id, relServiciosCategorias.categoriaId)).orderBy(asc(relServiciosCategorias.servicioId), asc(catCategorias.nombre)),
  ]);

  const schedulesByUnit = new Map();
  for (const item of schedules) schedulesByUnit.set(item.unitId, [...(schedulesByUnit.get(item.unitId) ?? []), item]);

  const unitsByService = new Map();
  for (const unit of units) {
    const list = unitsByService.get(unit.serviceId) ?? [];
    list.push(safeUnit({ ...unit, schedule: schedulesByUnit.get(unit.id) ?? [] }));
    unitsByService.set(unit.serviceId, list);
  }
  const schedulesByService = new Map();
  for (const item of serviceSchedules) schedulesByService.set(item.serviceId, [...(schedulesByService.get(item.serviceId) ?? []), item]);
  const categoriesByService = new Map();
  for (const item of serviceCategories) categoriesByService.set(item.serviceId, [...(categoriesByService.get(item.serviceId) ?? []), item]);

  return {
    cities,
    contactModes,
    categories: categories.map((category) => ({ ...category, active: true, requiresUnits: Boolean(category.requiresUnits) })),
    services: services.map((service) => ({
      ...service,
      visible: Boolean(service.visible),
      requiresUnits: service.operationMode === "unidades",
      cashPayment: Boolean(service.cashPayment),
      cardPayment: Boolean(service.cardPayment),
      transferPayment: Boolean(service.transferPayment),
      schedule: schedulesByService.get(service.id) ?? [],
      categoryIds: (categoriesByService.get(service.id) ?? [{ categoryId: service.categoryId }]).map((category) => category.categoryId),
      categoryNames: (categoriesByService.get(service.id) ?? [{ categoryName: service.categoryName }]).map((category) => category.categoryName),
      categorySlugs: (categoriesByService.get(service.id) ?? [{ categorySlug: service.categorySlug }]).map((category) => category.categorySlug),
      units: unitsByService.get(service.id) ?? [],
    })),
  };
}

async function validatedCategories(tx, value) {
  const ids = normalizeCategoryIds(value);
  if (!ids.length) throw new AdminError("invalid_categories", "Selecciona al menos una categoría.");
  const categories = await tx.select({ id: catCategorias.id, active: catCategorias.activo, requiresUnits: catCategorias.requiereUnidades }).from(catCategorias).where(inArray(catCategorias.id, ids));
  const result = validateCategorySelection(ids, categories.map((category) => ({ ...category, active: Boolean(category.active), requiresUnits: Boolean(category.requiresUnits) })));
  if (!result.valid) throw new AdminError("invalid_categories", result.error);
  return result;
}

async function activeCatalogRecord(tx, table, id, label) {
  const [record] = await tx.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.activo, true))).limit(1);
  if (!record) throw new AdminError("invalid_relation", `${label} no existe o está inactivo.`);
  return record;
}

async function unavailableState(tx) {
  const [state] = await tx.select({ id: catEstadosUnidad.id }).from(catEstadosUnidad).where(and(eq(catEstadosUnidad.clave, "no_disponible"), eq(catEstadosUnidad.activo, true))).limit(1);
  if (!state) throw new AdminError("state_unavailable", "No se encontró el estado inicial.", 409);
  return state;
}

function serviceValues(input) {
  return {
    name: text(input.name, { label: "Nombre del servicio", max: 160, required: true }),
    phone: phone(input.phone, "Teléfono del servicio"),
    whatsapp: phone(input.whatsapp, "WhatsApp del servicio"),
    shortInformation: text(input.shortInformation, { label: "Información corta", max: 500 }),
    extendedInformation: text(input.extendedInformation, { label: "Información extendida", max: 4000 }),
    coverage: text(input.coverage, { label: "Cobertura", max: 2000 }),
    cashPayment: boolean(input.cashPayment, "Pago en efectivo"),
    cardPayment: boolean(input.cardPayment, "Pago con tarjeta"),
    transferPayment: boolean(input.transferPayment, "Pago por transferencia"),
  };
}

function serviceSchedule(value) {
  let parsed;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new AdminError("invalid_schedule", "El horario no es válido.");
  }
  const result = normalizeScheduleInput(parsed ?? []);
  if (!result.valid) throw new AdminError("invalid_schedule", result.error);
  return result.schedule;
}

function unitValues(input) {
  return {
    name: text(input.name, { label: "Nombre de la unidad", max: 120 }),
    phone: phone(input.phone, "Teléfono de la unidad"),
    whatsapp: phone(input.whatsapp, "WhatsApp de la unidad"),
    priceBase: price(input.priceBase),
  };
}

function duplicateError(error) {
  return error?.code === "ER_DUP_ENTRY" || error?.cause?.code === "ER_DUP_ENTRY";
}

export async function createProvider(input) {
  const cityId = requiredId(input.cityId, "Ciudad");
  const contactModeId = requiredId(input.contactModeId, "Modo de contacto");
  const categoryIds = normalizeCategoryIds(input.categoryIds);
  const service = serviceValues(input.service ?? {});
  const schedule = serviceSchedule(input.service?.schedule ?? []);

  try {
    return await getDb().transaction(async (tx) => {
      await activeCatalogRecord(tx, catCiudades, cityId, "La ciudad");
      const [contactMode] = await tx.select({ key: catModosContacto.clave }).from(catModosContacto).where(and(eq(catModosContacto.id, contactModeId), eq(catModosContacto.activo, true))).limit(1);
      if (!contactMode) throw new AdminError("invalid_relation", "El modo de contacto no existe o está inactivo.");
      const categorySelection = await validatedCategories(tx, categoryIds);
      if (!categorySelection.requiresUnits && contactMode.key !== "central") throw new AdminError("invalid_contact_mode", "Los servicios sin unidades requieren contacto central.");
      const [createdService] = await tx.insert(datServicios).values({
        ciudadId: cityId,
        modoContactoId: contactModeId,
        categoriaId: categorySelection.ids[0],
        nombre: service.name,
        slug: slugify(service.name),
        telefono: service.phone,
        whatsapp: service.whatsapp,
        descripcion: service.extendedInformation,
        informacionCorta: service.shortInformation,
        informacionExtendida: service.extendedInformation,
        modoOperacion: categorySelection.requiresUnits ? "unidades" : "servicio",
        coberturaTexto: service.coverage,
        pagoEfectivo: service.cashPayment,
        pagoTarjeta: service.cardPayment,
        pagoTransferencia: service.transferPayment,
        visible: true,
      });
      const serviceId = Number(createdService.insertId);
      await tx.insert(relServiciosCategorias).values(categorySelection.ids.map((categoriaId) => ({ servicioId: serviceId, categoriaId })));
      if (!categorySelection.requiresUnits && schedule.length) await tx.insert(datHorariosServicio).values(schedule.map((item) => ({ servicioId: serviceId, diaSemana: item.day, bloque: item.block, horaInicio: item.start, horaFin: item.end })));
      if (!categorySelection.requiresUnits) return serviceId;
      const unit = unitValues(input.unit ?? {});
      const state = await unavailableState(tx);
      await tx.insert(datUnidades).values({
        servicioId: serviceId,
        nombre: unit.name,
        telefono: unit.phone,
        whatsapp: unit.whatsapp,
        precioBase: unit.priceBase,
        estadoId: state.id,
        estadoHasta: null,
        tokenHash: null,
        activo: true,
      });
      return serviceId;
    });
  } catch (error) {
    if (error instanceof AdminError) throw error;
    if (duplicateError(error)) throw new AdminError("slug_conflict", "Ya existe un servicio con ese nombre en la ciudad.", 409);
    throw error;
  }
}

export async function updateService(serviceIdValue, input) {
  const serviceId = requiredId(serviceIdValue, "Servicio");
  const contactModeId = requiredId(input.contactModeId, "Modo de contacto");
  const categoryIds = normalizeCategoryIds(input.categoryIds);
  const values = serviceValues(input);
  const schedule = serviceSchedule(input.schedule ?? []);
  await getDb().transaction(async (tx) => {
    const [currentService] = await tx
      .select({ operationMode: datServicios.modoOperacion, categoryId: datServicios.categoriaId })
      .from(datServicios)
      .where(eq(datServicios.id, serviceId))
      .limit(1);
    if (!currentService) throw new AdminError("service_not_found", "El servicio no existe.", 404);
    const [contactMode] = await tx.select({ key: catModosContacto.clave }).from(catModosContacto).where(and(eq(catModosContacto.id, contactModeId), eq(catModosContacto.activo, true))).limit(1);
    if (!contactMode) throw new AdminError("invalid_relation", "El modo de contacto no existe o está inactivo.");
    const inactiveCategories = await tx.select({ id: catCategorias.id }).from(catCategorias).where(and(
      eq(catCategorias.activo, false),
      or(eq(catCategorias.id, currentService.categoryId), inArray(catCategorias.id,
        tx.select({ id: relServiciosCategorias.categoriaId }).from(relServiciosCategorias).where(eq(relServiciosCategorias.servicioId, serviceId)))),
    ));
    const inactiveIds = inactiveCategories.map((category) => category.id);
    const categorySelection = categoryIds.length || !inactiveIds.length
      ? await validatedCategories(tx, categoryIds)
      : { ids: [], requiresUnits: currentService.operationMode === "unidades" };
    const savedCategoryIds = retainedCategoryIds(categorySelection.ids, inactiveIds);
    const nextOperationMode = categorySelection.requiresUnits ? "unidades" : "servicio";
    if (currentService.operationMode !== nextOperationMode) {
      throw new AdminError(
        "operation_mode_change_not_allowed",
        "Las categorías seleccionadas no son compatibles con el modo operativo actual del servicio.",
        409,
      );
    }
    if (!categorySelection.requiresUnits && contactMode.key !== "central") throw new AdminError("invalid_contact_mode", "Los servicios sin unidades requieren contacto central.");
    const result = await tx.update(datServicios).set({
      modoContactoId: contactModeId,
      categoriaId: categorySelection.ids[0] ?? (inactiveIds.includes(currentService.categoryId) ? currentService.categoryId : inactiveIds[0]),
      nombre: values.name,
      telefono: values.phone,
      whatsapp: values.whatsapp,
      descripcion: values.extendedInformation,
      informacionCorta: values.shortInformation,
      informacionExtendida: values.extendedInformation,
      modoOperacion: nextOperationMode,
      coberturaTexto: values.coverage,
      pagoEfectivo: values.cashPayment,
      pagoTarjeta: values.cardPayment,
      pagoTransferencia: values.transferPayment,
      visible: boolean(input.visible, "Visibilidad"),
    }).where(eq(datServicios.id, serviceId));
    if (!result[0].affectedRows) throw new AdminError("service_not_found", "El servicio no existe.", 404);
    await tx.delete(relServiciosCategorias).where(eq(relServiciosCategorias.servicioId, serviceId));
    await tx.insert(relServiciosCategorias).values(savedCategoryIds.map((categoriaId) => ({ servicioId: serviceId, categoriaId })));
    await tx.delete(datHorariosServicio).where(eq(datHorariosServicio.servicioId, serviceId));
    if (!categorySelection.requiresUnits && schedule.length) await tx.insert(datHorariosServicio).values(schedule.map((item) => ({ servicioId: serviceId, diaSemana: item.day, bloque: item.block, horaInicio: item.start, horaFin: item.end })));
  });
}

export async function addUnit(serviceIdValue, input) {
  const serviceId = requiredId(serviceIdValue, "Servicio");
  const values = unitValues(input);
  await getDb().transaction(async (tx) => {
    const [service] = await tx.select({ id: datServicios.id, operationMode: datServicios.modoOperacion }).from(datServicios).where(eq(datServicios.id, serviceId)).limit(1);
    if (!service) throw new AdminError("service_not_found", "El servicio no existe.", 404);
    if (service.operationMode !== "unidades") throw new AdminError("units_not_supported", "Este servicio no utiliza unidades.");
    const state = await unavailableState(tx);
    await tx.insert(datUnidades).values({
      servicioId: serviceId,
      nombre: values.name,
      telefono: values.phone,
      whatsapp: values.whatsapp,
      precioBase: values.priceBase,
      estadoId: state.id,
      estadoHasta: null,
      tokenHash: null,
      activo: true,
    });
  });
}

export async function updateAdminUnit(serviceIdValue, unitIdValue, input) {
  const serviceId = requiredId(serviceIdValue, "Servicio");
  const unitId = requiredId(unitIdValue, "Unidad");
  const values = unitValues(input);
  const result = await getDb().update(datUnidades).set({
    nombre: values.name,
    telefono: values.phone,
    whatsapp: values.whatsapp,
    precioBase: values.priceBase,
    activo: boolean(input.active, "Estado activo"),
  }).where(and(eq(datUnidades.id, unitId), eq(datUnidades.servicioId, serviceId)));
  if (!result[0].affectedRows) throw new AdminError("unit_not_found", "La unidad no pertenece al servicio.", 404);
}

export async function updateAdminUnitStatus(serviceIdValue, unitIdValue, action) {
  try {
    await updateUnitStatusById({
      serviceId: requiredId(serviceIdValue, "Servicio"),
      unitId: requiredId(unitIdValue, "Unidad"),
      action,
    });
  } catch (error) {
    if (error instanceof UnitPanelError) throw new AdminError(error.code, error.message, error.status);
    throw error;
  }
}

function normalizedWhatsapp(value) {
  const number = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return /^\d{10,15}$/.test(number) ? number : null;
}

export async function rotateUnitAccess(serviceIdValue, unitIdValue, requestUrl) {
  const serviceId = requiredId(serviceIdValue, "Servicio");
  const unitId = requiredId(unitIdValue, "Unidad");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashUnitToken(token);
  const db = getDb();
  const [unit] = await db.select({
    id: datUnidades.id,
    unitWhatsapp: datUnidades.whatsapp,
    serviceWhatsapp: datServicios.whatsapp,
    servicePhone: datServicios.telefono,
    cityName: catCiudades.nombre,
  }).from(datUnidades)
    .innerJoin(datServicios, eq(datServicios.id, datUnidades.servicioId))
    .innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId))
    .where(and(eq(datUnidades.id, unitId), eq(datUnidades.servicioId, serviceId)))
    .limit(1);
  if (!unit) throw new AdminError("unit_not_found", "La unidad no pertenece al servicio.", 404);

  await db.update(datUnidades).set({ tokenHash }).where(and(eq(datUnidades.id, unitId), eq(datUnidades.servicioId, serviceId)));
  const privateUrl = new URL(`/u/${token}`, requestUrl).toString();
  const whatsapp = normalizedWhatsapp(unit.unitWhatsapp) ?? normalizedWhatsapp(unit.serviceWhatsapp) ?? normalizedWhatsapp(unit.servicePhone);
  const message = `Hola.\n\nEste es tu enlace privado para actualizar tu disponibilidad y precio en Servicios ${unit.cityName}:\n\n${privateUrl}\n\nGuárdalo, ya que desde este enlace podrás indicar si estás disponible, ocupado o fuera de servicio.`;

  return {
    privateUrl,
    whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : null,
  };
}
