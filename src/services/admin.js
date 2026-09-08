import { randomBytes } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getEffectiveUnitStatus } from "@/db/availability";
import {
  catCiudades,
  catEstadosUnidad,
  catModosContacto,
  datServicios,
  datHorariosUnidad,
  datUnidades,
} from "@/db/schema";
import { hashUnitToken } from "@/lib/unit-token";
import { UnitPanelError, updateUnitStatusById } from "@/services/units";

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
  const [cities, contactModes, services, units, schedules] = await Promise.all([
    db.select({ id: catCiudades.id, name: catCiudades.nombre, slug: catCiudades.slug, timeZone: catCiudades.zonaHoraria }).from(catCiudades).where(eq(catCiudades.activo, true)).orderBy(asc(catCiudades.nombre)),
    db.select({ id: catModosContacto.id, key: catModosContacto.clave, name: catModosContacto.nombre }).from(catModosContacto).where(eq(catModosContacto.activo, true)).orderBy(asc(catModosContacto.id)),
    db.select({
      id: datServicios.id,
      cityId: datServicios.ciudadId,
      cityName: catCiudades.nombre,
      contactModeId: datServicios.modoContactoId,
      name: datServicios.nombre,
      slug: datServicios.slug,
      phone: datServicios.telefono,
      whatsapp: datServicios.whatsapp,
      description: datServicios.descripcion,
      coverage: datServicios.coberturaTexto,
      logoUrl: datServicios.logoUrl,
      visible: datServicios.visible,
    }).from(datServicios).innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId)).orderBy(asc(datServicios.nombre)),
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
  ]);

  const schedulesByUnit = new Map();
  for (const item of schedules) schedulesByUnit.set(item.unitId, [...(schedulesByUnit.get(item.unitId) ?? []), item]);

  const unitsByService = new Map();
  for (const unit of units) {
    const list = unitsByService.get(unit.serviceId) ?? [];
    list.push(safeUnit({ ...unit, schedule: schedulesByUnit.get(unit.id) ?? [] }));
    unitsByService.set(unit.serviceId, list);
  }

  return {
    cities,
    contactModes,
    services: services.map((service) => ({
      ...service,
      visible: Boolean(service.visible),
      units: unitsByService.get(service.id) ?? [],
    })),
  };
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
    description: text(input.description, { label: "Descripción", max: 2000 }),
    coverage: text(input.coverage, { label: "Cobertura", max: 2000 }),
  };
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
  const service = serviceValues(input.service ?? {});
  const unit = unitValues(input.unit ?? {});

  try {
    return await getDb().transaction(async (tx) => {
      await activeCatalogRecord(tx, catCiudades, cityId, "La ciudad");
      await activeCatalogRecord(tx, catModosContacto, contactModeId, "El modo de contacto");
      const state = await unavailableState(tx);
      const [createdService] = await tx.insert(datServicios).values({
        ciudadId: cityId,
        modoContactoId: contactModeId,
        nombre: service.name,
        slug: slugify(service.name),
        telefono: service.phone,
        whatsapp: service.whatsapp,
        descripcion: service.description,
        coberturaTexto: service.coverage,
        visible: true,
      });
      const serviceId = Number(createdService.insertId);
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
  const values = serviceValues(input);
  await activeCatalogRecord(getDb(), catModosContacto, contactModeId, "El modo de contacto");
  const result = await getDb().update(datServicios).set({
    modoContactoId: contactModeId,
    nombre: values.name,
    telefono: values.phone,
    whatsapp: values.whatsapp,
    descripcion: values.description,
    coberturaTexto: values.coverage,
    visible: boolean(input.visible, "Visibilidad"),
  }).where(eq(datServicios.id, serviceId));
  if (!result[0].affectedRows) throw new AdminError("service_not_found", "El servicio no existe.", 404);
}

export async function addUnit(serviceIdValue, input) {
  const serviceId = requiredId(serviceIdValue, "Servicio");
  const values = unitValues(input);
  await getDb().transaction(async (tx) => {
    const [service] = await tx.select({ id: datServicios.id }).from(datServicios).where(eq(datServicios.id, serviceId)).limit(1);
    if (!service) throw new AdminError("service_not_found", "El servicio no existe.", 404);
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
