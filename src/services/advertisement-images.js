import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { AdvertisementError, MAX_AD_BYTES, safeAdUrl, validAdImage } from "../domain/advertisements.js";

function cloudClient() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new AdvertisementError("Cloudinary no está configurado en el servidor.", 503);
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}

export async function removeNewAdImage(publicId) {
  try { await cloudClient().uploader.destroy(publicId, { resource_type: "image" }); }
  catch { console.error("No se pudo limpiar una imagen nueva de publicidad; revisar Cloudinary."); }
}

export async function uploadAdImage(file) {
  if (!(file instanceof File) || !file.size || file.size > MAX_AD_BYTES) throw new AdvertisementError("Selecciona una imagen JPG, PNG o WebP de hasta 3 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validAdImage(buffer, file.type)) throw new AdvertisementError("El archivo no contiene una imagen JPG, PNG o WebP válida.");
  const publicId = `servicios/publicidad/${randomUUID()}`;
  const client = cloudClient();
  let result;
  try {
    result = await new Promise((resolve, reject) => {
      const stream = client.uploader.upload_stream({ public_id: publicId, resource_type: "image", overwrite: false, allowed_formats: ["jpg", "png", "webp"], pages: true }, (error, value) => error ? reject(error) : resolve(value));
      stream.end(buffer);
    });
  } catch { throw new AdvertisementError("No se pudo subir la imagen a Cloudinary. Revisa la configuración e intenta de nuevo.", 502); }
  if (!result?.width || !result?.height || Math.abs(result.width / result.height - 5) > 0.03 || (result.pages ?? 1) > 1 || !safeAdUrl(result?.secure_url, true)) {
    await removeNewAdImage(publicId);
    throw new AdvertisementError("La imagen debe ser estática y tener proporción 5:1 (por ejemplo, 1200 × 240 px).");
  }
  return { imageUrl: result.secure_url, publicId };
}

