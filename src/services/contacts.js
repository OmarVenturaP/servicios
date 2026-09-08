import { and, asc, count, eq, max } from "drizzle-orm";
import { getDb } from "@/db";
import { effectiveAvailableCondition, getTimeZoneOffsetMinutes } from "@/db/availability";
import {
  catCiudades,
  catEstadosUnidad,
  catModosContacto,
  datServicios,
  datUnidades,
  logContactos,
} from "@/db/schema";

const CHANNELS = new Set(["whatsapp", "llamada"]);

export class ContactError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "ContactError";
    this.code = code;
    this.status = status;
  }
}

function normalizedPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return price.toFixed(2);
}

function normalizedPhone(value) {
  const phone = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return /^\d{10,15}$/.test(phone) ? phone : null;
}

function contactUrl({ channel, cityName, phone, priceShown }) {
  if (channel === "llamada") {
    return `tel:${phone}`;
  }

  const message = [
    `Hola, te encontré en Servicios ${cityName}.`,
    "",
    `Vi que tu servicio tiene un precio desde $${Number(priceShown).toLocaleString("es-MX", { maximumFractionDigits: 2 })}.`,
    "",
    "¿Tienes disponibilidad para realizar un mandado?",
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function registerContact({
  citySlug,
  serviceSlug,
  channel,
  priceShown,
  sessionId,
}) {
  if (!CHANNELS.has(channel)) {
    throw new ContactError("invalid_channel", "Canal de contacto inválido");
  }

  const clientPrice = normalizedPrice(priceShown);

  if (clientPrice === null) {
    throw new ContactError("invalid_price", "Precio mostrado inválido");
  }

  return getDb().transaction(async (tx) => {
    const [service] = await tx
      .select({
        id: datServicios.id,
        cityId: catCiudades.id,
        cityName: catCiudades.nombre,
        contactMode: catModosContacto.clave,
        phone: datServicios.telefono,
        whatsapp: datServicios.whatsapp,
        timeZone: catCiudades.zonaHoraria,
      })
      .from(datServicios)
      .innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId))
      .innerJoin(catModosContacto, eq(catModosContacto.id, datServicios.modoContactoId))
      .where(
        and(
          eq(catCiudades.slug, citySlug),
          eq(catCiudades.activo, true),
          eq(datServicios.slug, serviceSlug),
          eq(datServicios.visible, true),
          eq(catModosContacto.activo, true),
        ),
      )
      .limit(1);

    if (!service) {
      throw new ContactError("service_not_found", "Servicio o ciudad no encontrados", 404);
    }

    const effectiveAvailability = effectiveAvailableCondition({ timeZoneOffsetMinutes: getTimeZoneOffsetMinutes(service.timeZone) });

    const contactCount = count(logContactos.id);
    const lastContactAt = max(logContactos.createdAt);
    const availableUnits = await tx
      .select({
        id: datUnidades.id,
        phone: datUnidades.telefono,
        whatsapp: datUnidades.whatsapp,
        price: datUnidades.precioBase,
        contactCount,
        lastContactAt,
      })
      .from(datUnidades)
      .innerJoin(catEstadosUnidad, eq(catEstadosUnidad.id, datUnidades.estadoId))
      .leftJoin(logContactos, eq(logContactos.unidadId, datUnidades.id))
      .where(and(eq(datUnidades.servicioId, service.id), effectiveAvailability))
      .groupBy(
        datUnidades.id,
        datUnidades.telefono,
        datUnidades.whatsapp,
        datUnidades.precioBase,
      )
      .orderBy(asc(contactCount), asc(lastContactAt), asc(datUnidades.id));

    if (availableUnits.length === 0) {
      throw new ContactError(
        "service_unavailable",
        "El servicio ya no tiene unidades disponibles",
        409,
      );
    }

    const serverPrice = availableUnits.reduce((minimum, unit) => {
      const price = normalizedPrice(unit.price);
      return minimum === null || Number(price) < Number(minimum) ? price : minimum;
    }, null);

    if (serverPrice !== clientPrice) {
      throw new ContactError(
        "price_changed",
        "El precio disponible cambió. Actualiza la página para continuar.",
        409,
      );
    }

    let unitId = null;
    let phone;

    if (service.contactMode === "central") {
      phone = normalizedPhone(channel === "whatsapp" ? service.whatsapp : service.phone);
    } else if (service.contactMode === "unidad") {
      const selectedUnit = availableUnits.find((unit) =>
        normalizedPhone(channel === "whatsapp" ? unit.whatsapp : unit.phone),
      );

      if (!selectedUnit) {
        throw new ContactError(
          "contact_unavailable",
          "No hay una unidad disponible con este medio de contacto",
          409,
        );
      }

      unitId = selectedUnit.id;
      phone = normalizedPhone(channel === "whatsapp" ? selectedUnit.whatsapp : selectedUnit.phone);
    } else {
      throw new ContactError("invalid_contact_mode", "Modo de contacto inválido", 409);
    }

    if (!phone) {
      throw new ContactError("invalid_phone", "El servicio no tiene un número válido", 409);
    }

    await tx.insert(logContactos).values({
      servicioId: service.id,
      unidadId: unitId,
      ciudadId: service.cityId,
      sessionId,
      canal: channel,
      precioMostrado: serverPrice,
    });

    return {
      url: contactUrl({
        channel,
        cityName: service.cityName,
        phone,
        priceShown: serverPrice,
      }),
    };
  });
}
