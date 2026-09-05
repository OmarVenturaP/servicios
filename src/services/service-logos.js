import { v2 as cloudinary } from "cloudinary";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { datServicios } from "@/db/schema";
import { AdminError } from "@/services/admin";

export const MAX_LOGO_BYTES = 3 * 1024 * 1024;
export const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function serviceIdFrom(value) {
  const serviceId = Number(value);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    throw new AdminError("invalid_id", "Servicio inválido.");
  }
  return serviceId;
}

function cloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new AdminError("cloudinary_not_configured", "Cloudinary no está configurado en el servidor.", 503);
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

function safeCloudinaryError(error) {
  const source = error?.error ?? error;
  const rawMessage = typeof source?.message === "string" ? source.message : "Error desconocido de Cloudinary";
  const secrets = [
    process.env.CLOUDINARY_API_SECRET,
    process.env.CLOUDINARY_API_KEY,
  ].filter(Boolean);
  const message = secrets.reduce((safe, secret) => safe.replaceAll(secret, "[oculto]"), rawMessage).slice(0, 240);
  return {
    message,
    httpCode: Number(source?.http_code ?? source?.httpCode) || null,
  };
}

function cloudinaryError(error, operation) {
  if (error instanceof AdminError) return error;
  const details = safeCloudinaryError(error);
  console.error(`Cloudinary ${operation} falló: ${JSON.stringify(details)}`);

  if (/cloud_name mismatch/i.test(details.message)) {
    return new AdminError("cloudinary_cloud_mismatch", "El Cloud Name no corresponde a las credenciales API configuradas.", 502);
  }
  if (details.httpCode === 401 || /invalid signature|unknown api key/i.test(details.message)) {
    return new AdminError("cloudinary_invalid_credentials", "Cloudinary rechazó las credenciales. Revisa Cloud Name, API Key y API Secret.", 502);
  }
  if (details.httpCode === 429) {
    return new AdminError("cloudinary_limit_reached", "Cloudinary alcanzó temporalmente un límite de uso. Intenta más tarde.", 503);
  }
  return new AdminError(
    `cloudinary_${operation}_failed`,
    operation === "upload"
      ? "Cloudinary rechazó la subida del logo. Revisa la configuración e intenta nuevamente."
      : "Cloudinary no pudo eliminar el logo. Intenta nuevamente.",
    502,
  );
}

function isExpectedImage(buffer, type) {
  if (type === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  return false;
}

async function requireService(serviceId) {
  const [service] = await getDb().select({ id: datServicios.id }).from(datServicios).where(eq(datServicios.id, serviceId)).limit(1);
  if (!service) throw new AdminError("service_not_found", "El servicio no existe.", 404);
}

function publicIdFor(serviceId) {
  return `servicios/${serviceId}/logo`;
}

function uploadBuffer(buffer, serviceId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryClient().uploader.upload_stream({
      public_id: publicIdFor(serviceId),
      resource_type: "image",
      overwrite: true,
      invalidate: true,
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

export async function uploadServiceLogo(serviceIdValue, file) {
  const serviceId = serviceIdFrom(serviceIdValue);
  if (!(file instanceof File) || !file.size) {
    throw new AdminError("invalid_logo", "Selecciona un archivo de imagen válido.");
  }
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new AdminError("invalid_logo_type", "El logo debe ser JPG, PNG o WEBP.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new AdminError("logo_too_large", "El logo no puede superar 3 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isExpectedImage(buffer, file.type)) {
    throw new AdminError("invalid_logo_content", "El archivo no contiene una imagen válida del formato indicado.");
  }
  await requireService(serviceId);

  let result;
  try {
    result = await uploadBuffer(buffer, serviceId);
  } catch (error) {
    throw cloudinaryError(error, "upload");
  }
  if (!result?.secure_url || !result.secure_url.startsWith("https://res.cloudinary.com/")) {
    throw new AdminError("invalid_cloudinary_response", "Cloudinary no devolvió una URL segura válida.", 502);
  }

  const update = await getDb().update(datServicios).set({ logoUrl: result.secure_url }).where(eq(datServicios.id, serviceId));
  if (!update[0].affectedRows) throw new AdminError("service_not_found", "El servicio no existe.", 404);
  return result.secure_url;
}

export async function deleteServiceLogo(serviceIdValue) {
  const serviceId = serviceIdFrom(serviceIdValue);
  await requireService(serviceId);

  let result;
  try {
    result = await cloudinaryClient().uploader.destroy(publicIdFor(serviceId), { resource_type: "image", invalidate: true });
  } catch (error) {
    throw cloudinaryError(error, "delete");
  }
  if (!result || !["ok", "not found"].includes(result.result)) {
    throw new AdminError("cloudinary_delete_failed", "Cloudinary no confirmó la eliminación del logo.", 502);
  }

  await getDb().update(datServicios).set({ logoUrl: null }).where(eq(datServicios.id, serviceId));
}
