import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { catCiudades, datAnuncios } from "@/db/schema";
import { AdvertisementError, cityDate, safeAdUrl, selectPublicAds, validateAd } from "@/domain/advertisements";

export { AdvertisementError } from "@/domain/advertisements";
import { uploadAdImage, removeNewAdImage } from "./advertisement-images";

const fields = {
  id: datAnuncios.id, cityId: datAnuncios.ciudadId, title: datAnuncios.titulo,
  imageUrl: datAnuncios.imagenUrl, destinationUrl: datAnuncios.destinoUrl,
  order: datAnuncios.orden, active: datAnuncios.activo,
  startDate: datAnuncios.fechaInicio, endDate: datAnuncios.fechaFin,
};

export async function getAdminAds() {
  const db = getDb();
  const [cities, ads] = await Promise.all([
    db.select({ id: catCiudades.id, name: catCiudades.nombre, state: catCiudades.estado, timeZone: catCiudades.zonaHoraria }).from(catCiudades).where(eq(catCiudades.activo, true)).orderBy(asc(catCiudades.nombre)),
    db.select(fields).from(datAnuncios).orderBy(asc(datAnuncios.orden), asc(datAnuncios.id)),
  ]);
  return { cities, ads };
}

export async function getPublicAds(cityId) {
  try {
    const db = getDb();
    const [city] = await db.select({ id: catCiudades.id, timeZone: catCiudades.zonaHoraria }).from(catCiudades).where(and(eq(catCiudades.id, cityId), eq(catCiudades.activo, true))).limit(1);
    if (!city) return [];
    const ads = await db.select(fields).from(datAnuncios).where(and(eq(datAnuncios.ciudadId, cityId), eq(datAnuncios.activo, true))).orderBy(asc(datAnuncios.orden), asc(datAnuncios.id));
    return selectPublicAds(ads, city.id, cityDate(city.timeZone));
  } catch {
    console.error("Publicidad no disponible; se continúa mostrando el directorio.");
    return [];
  }
}

export async function saveAdvertisement(idValue, data, file) {
  const validation = validateAd(data);
  if (validation.error) throw new AdvertisementError(validation.error);
  const ad = validation.value;
  const db = getDb();
  const id = idValue ? Number(idValue) : null;
  if (idValue && (!Number.isInteger(id) || id < 1)) throw new AdvertisementError("Anuncio inválido.");
  let existing;
  if (id) {
    [existing] = await db.select(fields).from(datAnuncios).where(eq(datAnuncios.id, id)).limit(1);
    if (!existing) throw new AdvertisementError("El anuncio no existe.", 404);
  }
  const [city] = await db.select({ id: catCiudades.id }).from(catCiudades).where(and(eq(catCiudades.id, ad.cityId), eq(catCiudades.activo, true))).limit(1);
  if (!city) throw new AdvertisementError("La ciudad no existe o está inactiva.");
  let uploaded;
  if (file instanceof File && file.size) uploaded = await uploadAdImage(file);
  const imageUrl = uploaded?.imageUrl ?? existing?.imageUrl;
  if (!safeAdUrl(imageUrl, true)) throw new AdvertisementError("Carga la imagen del anuncio antes de guardarlo.");
  const values = { ciudadId: ad.cityId, titulo: ad.title, imagenUrl: imageUrl, destinoUrl: ad.destinationUrl, orden: ad.order, activo: ad.active, fechaInicio: ad.startDate, fechaFin: ad.endDate };
  try {
    if (id) await db.update(datAnuncios).set(values).where(eq(datAnuncios.id, id));
    else await db.insert(datAnuncios).values(values);
  } catch (error) {
    if (uploaded) await removeNewAdImage(uploaded.publicId);
    throw error;
  }
}
