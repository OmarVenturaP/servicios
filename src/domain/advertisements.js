export class AdvertisementError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export const AD_INTERVAL_MS = 6000;
export const MAX_AD_BYTES = 3 * 1024 * 1024;
export const AD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function safeAdUrl(value, image = false) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (image && url.hostname !== "res.cloudinary.com") return null;
    if (!image && url.hostname === "wa.me" && !/^\/[1-9]\d{7,14}$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

function validDate(value) {
  if (!value) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= "1000-01-01";
}

export function validateAd(data) {
  const cityId = Number(data.cityId);
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const order = Number(data.order ?? 0);
  const destinationUrl = safeAdUrl(data.destinationUrl);
  const startDate = data.startDate || null;
  const endDate = data.endDate || null;
  if (!Number.isInteger(cityId) || cityId < 1) return { error: "Selecciona una ciudad válida." };
  if (!title || title.length > 160) return { error: "El título debe tener entre 1 y 160 caracteres." };
  if (!destinationUrl) return { error: "Utiliza un enlace HTTPS válido. WhatsApp: https://wa.me/ seguido del teléfono internacional, sin signos ni espacios." };
  if (!Number.isInteger(order) || order < 0 || order > 2147483647) return { error: "El orden debe ser un entero entre 0 y 2147483647." };
  if (!validDate(startDate) || !validDate(endDate) || (startDate && endDate && startDate > endDate)) return { error: "Revisa la vigencia: fechas válidas y fin igual o posterior al inicio." };
  if (typeof data.active !== "boolean") return { error: "El estado del anuncio no es válido." };
  return { value: { cityId, title, destinationUrl, order, active: data.active, startDate, endDate } };
}

export function cityDate(timeZone, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function selectPublicAds(ads, cityId, today) {
  return ads.filter((ad) => ad.cityId === cityId && ad.active && safeAdUrl(ad.imageUrl, true) && safeAdUrl(ad.destinationUrl)
    && (!ad.startDate || (validDate(ad.startDate) && ad.startDate <= today))
    && (!ad.endDate || (validDate(ad.endDate) && ad.endDate >= today)))
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .map(({ id, title, imageUrl, destinationUrl }) => ({ id, title, imageUrl, destinationUrl }));
}

export function validAdImage(buffer, type) {
  if (!buffer.length || buffer.length > MAX_AD_BYTES) return false;
  if (type === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  return false;
}
