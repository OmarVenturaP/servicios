export const EMERGENCY_CONTACT_TYPES = Object.freeze([
  "general",
  "turismo",
  "anonimo",
  "guardia",
  "otros",
]);

export const EMERGENCY_TYPE_LABELS = Object.freeze({
  general: "Emergencias generales",
  turismo: "Auxilio Vial",
  anonimo: "Denuncia",
  guardia: "Auxilio y denuncia",
  otros: "Otra institución",
});

// Fuentes oficiales del Gobierno de México:
// 911, 089 y 088: https://www.gob.mx/sspc/es/articulos/sabes-cual-es-la-diferencia-entre-los-numeros-088-089-y-911
// 078: https://www.gob.mx/sectur/angelesverdes/es/articulos/078-el-numero-gratuito-que-te-acompana-auxilia-y-orienta
const AUTHORIZED_SHORT_NUMBERS = Object.freeze({
  mexico: new Set(["078", "088", "089", "911"]),
});

export function normalizeCountry(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizeEmergencyPhone(value, country) {
  const phone = typeof value === "string" ? value.trim() : "";
  if (!phone || !/^\+?\d+$/.test(phone)) return null;

  if (!phone.startsWith("+")) {
    return AUTHORIZED_SHORT_NUMBERS[normalizeCountry(country)]?.has(phone) ? phone : null;
  }

  const digits = phone.slice(1);
  return /^\d{10,15}$/.test(digits) ? `+${digits}` : null;
}

export function normalizeExtension(value) {
  const extension = typeof value === "string" ? value.trim() : "";
  if (!extension) return null;
  return /^\d{1,10}$/.test(extension) ? extension : null;
}

export function normalizeOfficialUrl(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source || source.length > 500) return null;
  try {
    const url = new URL(source);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isValidVerificationDate(value, now = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= now.getTime();
}

export function canPublishEmergencyContact(contact, city, now = new Date()) {
  return Boolean(
    city?.active
    && contact?.name
    && contact?.slug
    && EMERGENCY_CONTACT_TYPES.includes(contact.type)
    && normalizeEmergencyPhone(contact.phone, city.country)
    && normalizeOfficialUrl(contact.sourceUrl)
    && isValidVerificationDate(contact.verifiedAt, now),
  );
}

export function selectPublishableEmergencyContactsForCity(contacts, city, now = new Date()) {
  if (!city?.active) return [];
  return contacts.filter((contact) => (
    contact.cityId === city.id
    && contact.visible === true
    && canPublishEmergencyContact(contact, city, now)
  ));
}

export function verificationSensitiveValues(contact) {
  return [
    contact.cityId,
    contact.name,
    contact.phone,
    contact.extension ?? null,
    contact.description ?? null,
    contact.schedule ?? null,
    contact.sourceUrl ?? null,
  ];
}

export function hasVerificationSensitiveChange(previous, next) {
  const before = verificationSensitiveValues(previous);
  const after = verificationSensitiveValues(next);
  return before.some((value, index) => value !== after[index]);
}
