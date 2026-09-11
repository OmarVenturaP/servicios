import { and, asc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { catCiudades, datContactosEmergencia } from "@/db/schema";
import {
  canPublishEmergencyContact,
  EMERGENCY_CONTACT_TYPES,
  hasVerificationSensitiveChange,
  isValidVerificationDate,
  normalizeEmergencyPhone,
  normalizeExtension,
  normalizeOfficialUrl,
  selectPublishableEmergencyContactsForCity,
} from "@/domain/emergency-contacts";

export class EmergencyContactError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "EmergencyContactError";
    this.code = code;
    this.status = status;
  }
}

function requiredId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new EmergencyContactError("invalid_id", `${label} inválido.`);
  return id;
}

function requiredText(value, label, max) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized || normalized.length > max) throw new EmergencyContactError("invalid_field", `${label} no es válido.`);
  return normalized;
}

function optionalText(value, label, max) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length > max) throw new EmergencyContactError("invalid_field", `${label} no es válido.`);
  return normalized || null;
}

function slugify(value) {
  const slug = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160).replace(/-$/g, "");
  if (!slug) throw new EmergencyContactError("invalid_slug", "El nombre no permite generar un slug válido.");
  return slug;
}

async function activeCity(db, cityId) {
  const [city] = await db.select({ id: catCiudades.id, name: catCiudades.nombre, slug: catCiudades.slug, state: catCiudades.estado, country: catCiudades.pais, active: catCiudades.activo }).from(catCiudades).where(and(eq(catCiudades.id, cityId), eq(catCiudades.activo, true))).limit(1);
  if (!city) throw new EmergencyContactError("invalid_city", "La ciudad no existe o está inactiva.", 404);
  return city;
}

function valuesFromInput(input, city, { requireSource = false } = {}) {
  const name = requiredText(input.name, "Institución", 160);
  const type = requiredText(input.type, "Tipo", 40);
  if (!EMERGENCY_CONTACT_TYPES.includes(type)) throw new EmergencyContactError("invalid_type", "El tipo de contacto no es válido.");
  const phone = normalizeEmergencyPhone(input.phone, city.country);
  if (!phone) throw new EmergencyContactError("invalid_phone", "Usa un número internacional con + y 10 a 15 dígitos, o un número corto autorizado.");
  const extension = normalizeExtension(input.extension);
  if (input.extension?.trim() && !extension) throw new EmergencyContactError("invalid_extension", "La extensión debe contener únicamente dígitos.");
  const sourceUrl = normalizeOfficialUrl(input.sourceUrl);
  if ((requireSource || input.sourceUrl?.trim()) && !sourceUrl) throw new EmergencyContactError("invalid_source", "La fuente debe ser una URL oficial HTTP o HTTPS válida.");
  const order = Number(input.order ?? 0);
  if (!Number.isInteger(order) || order < 0) throw new EmergencyContactError("invalid_order", "El orden debe ser un entero igual o mayor que cero.");
  return {
    cityId: city.id,
    name,
    slug: slugify(name),
    type,
    phone,
    extension,
    description: optionalText(input.description, "Descripción de emergencia", 4000),
    schedule: optionalText(input.schedule, "Horario", 255),
    sourceUrl,
    order,
  };
}

function duplicate(error) {
  return error?.code === "ER_DUP_ENTRY" || error?.cause?.code === "ER_DUP_ENTRY";
}

function publicShape(row, cityId = null) {
  return { id: row.id, cityId, name: row.name, slug: row.slug, type: row.type, phone: row.phone, extension: row.extension, description: row.description, schedule: row.schedule, sourceUrl: row.sourceUrl, verifiedAt: row.verifiedAt ? new Date(row.verifiedAt).toISOString() : null, visible: true };
}

export const getPublicEmergencyContactsByCity = cache(async function getPublicEmergencyContactsByCity(citySlug) {
  const db = getDb();
  const [city] = await db.select({ id: catCiudades.id, name: catCiudades.nombre, slug: catCiudades.slug, state: catCiudades.estado, country: catCiudades.pais, active: catCiudades.activo }).from(catCiudades).where(and(eq(catCiudades.slug, citySlug), eq(catCiudades.activo, true))).limit(1);
  if (!city) return null;

  const rows = await db.select({ id: datContactosEmergencia.id, name: datContactosEmergencia.nombre, slug: datContactosEmergencia.slug, type: datContactosEmergencia.tipo, phone: datContactosEmergencia.telefono, extension: datContactosEmergencia.extension, description: datContactosEmergencia.descripcionEmergencia, schedule: datContactosEmergencia.horarioTexto, sourceUrl: datContactosEmergencia.fuenteUrl, verifiedAt: datContactosEmergencia.verificadoAt }).from(datContactosEmergencia).where(and(eq(datContactosEmergencia.ciudadId, city.id), eq(datContactosEmergencia.visible, true), isNotNull(datContactosEmergencia.fuenteUrl), isNotNull(datContactosEmergencia.verificadoAt), lte(datContactosEmergencia.verificadoAt, sql`now()`))).orderBy(sql`case when ${datContactosEmergencia.tipo} = 'general' then 0 else 1 end`, asc(datContactosEmergencia.orden), asc(datContactosEmergencia.nombre), asc(datContactosEmergencia.id));

  const shapedRows = rows.map((row) => publicShape(row, city.id));
  return { city, contacts: selectPublishableEmergencyContactsForCity(shapedRows, city) };
});

export async function getAdminEmergencySnapshot() {
  const db = getDb();
  const [cities, contacts] = await Promise.all([
    db.select({ id: catCiudades.id, name: catCiudades.nombre, slug: catCiudades.slug, state: catCiudades.estado, country: catCiudades.pais, timeZone: catCiudades.zonaHoraria, active: catCiudades.activo }).from(catCiudades).where(eq(catCiudades.activo, true)).orderBy(asc(catCiudades.nombre)),
    db.select({ id: datContactosEmergencia.id, cityId: datContactosEmergencia.ciudadId, name: datContactosEmergencia.nombre, slug: datContactosEmergencia.slug, type: datContactosEmergencia.tipo, phone: datContactosEmergencia.telefono, extension: datContactosEmergencia.extension, description: datContactosEmergencia.descripcionEmergencia, schedule: datContactosEmergencia.horarioTexto, sourceUrl: datContactosEmergencia.fuenteUrl, verifiedAt: datContactosEmergencia.verificadoAt, visible: datContactosEmergencia.visible, order: datContactosEmergencia.orden }).from(datContactosEmergencia).orderBy(asc(datContactosEmergencia.ciudadId), asc(datContactosEmergencia.orden), asc(datContactosEmergencia.nombre)),
  ]);
  return { cities, contacts: contacts.map((row) => ({ ...row, visible: Boolean(row.visible), verifiedAt: row.verifiedAt ? new Date(row.verifiedAt).toISOString() : null })) };
}

export async function createEmergencyContact(input) {
  const db = getDb();
  const city = await activeCity(db, requiredId(input.cityId, "Ciudad"));
  const values = valuesFromInput(input, city);
  try {
    await db.insert(datContactosEmergencia).values({ ciudadId: values.cityId, nombre: values.name, slug: values.slug, tipo: values.type, telefono: values.phone, extension: values.extension, descripcionEmergencia: values.description, horarioTexto: values.schedule, fuenteUrl: values.sourceUrl, visible: false, orden: values.order });
  } catch (error) {
    if (duplicate(error)) throw new EmergencyContactError("slug_conflict", "Ya existe un contacto con ese nombre en la ciudad.", 409);
    throw error;
  }
}

async function existingContact(db, id) {
  const [contact] = await db.select({ id: datContactosEmergencia.id, cityId: datContactosEmergencia.ciudadId, name: datContactosEmergencia.nombre, slug: datContactosEmergencia.slug, type: datContactosEmergencia.tipo, phone: datContactosEmergencia.telefono, extension: datContactosEmergencia.extension, description: datContactosEmergencia.descripcionEmergencia, schedule: datContactosEmergencia.horarioTexto, sourceUrl: datContactosEmergencia.fuenteUrl, verifiedAt: datContactosEmergencia.verificadoAt, visible: datContactosEmergencia.visible }).from(datContactosEmergencia).where(eq(datContactosEmergencia.id, id)).limit(1);
  if (!contact) throw new EmergencyContactError("not_found", "El contacto no existe.", 404);
  return contact;
}

export async function updateEmergencyContact(idValue, input) {
  const id = requiredId(idValue, "Contacto");
  const db = getDb();
  const previous = await existingContact(db, id);
  const city = await activeCity(db, requiredId(input.cityId, "Ciudad"));
  const values = valuesFromInput(input, city);
  const invalidates = hasVerificationSensitiveChange(previous, values);
  try {
    await db.update(datContactosEmergencia).set({ ciudadId: values.cityId, nombre: values.name, slug: values.slug, tipo: values.type, telefono: values.phone, extension: values.extension, descripcionEmergencia: values.description, horarioTexto: values.schedule, fuenteUrl: values.sourceUrl, orden: values.order, ...(invalidates ? { verificadoAt: null, visible: false } : {}) }).where(eq(datContactosEmergencia.id, id));
  } catch (error) {
    if (duplicate(error)) throw new EmergencyContactError("slug_conflict", "Ya existe un contacto con ese nombre en la ciudad.", 409);
    throw error;
  }
}

export async function verifyEmergencyContact(idValue, verifiedAtValue) {
  const id = requiredId(idValue, "Contacto");
  if (!isValidVerificationDate(verifiedAtValue)) throw new EmergencyContactError("invalid_verification", "La fecha de verificación no es válida ni puede estar en el futuro.");
  const db = getDb();
  const contact = await existingContact(db, id);
  const city = await activeCity(db, contact.cityId);
  if (!normalizeEmergencyPhone(contact.phone, city.country) || !normalizeOfficialUrl(contact.sourceUrl)) throw new EmergencyContactError("not_verifiable", "Agrega un teléfono válido y una fuente oficial antes de verificar.");
  await db.update(datContactosEmergencia).set({ verificadoAt: new Date(verifiedAtValue), visible: false }).where(eq(datContactosEmergencia.id, id));
}

export async function setEmergencyContactVisibility(idValue, visible) {
  const id = requiredId(idValue, "Contacto");
  if (typeof visible !== "boolean") throw new EmergencyContactError("invalid_visibility", "La visibilidad no es válida.");
  const db = getDb();
  const contact = await existingContact(db, id);
  if (visible) {
    const city = await activeCity(db, contact.cityId);
    if (!canPublishEmergencyContact(contact, city)) throw new EmergencyContactError("not_publishable", "El contacto requiere teléfono, fuente oficial y verificación vigente antes de publicarse.", 409);
  }
  await db.update(datContactosEmergencia).set({ visible }).where(eq(datContactosEmergencia.id, id));
}
