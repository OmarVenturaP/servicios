import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { effectiveAvailableCondition, effectiveOccupiedCondition } from "@/db/availability";
import {
  catCiudades,
  catEstadosUnidad,
  datServicios,
  datUnidades,
} from "@/db/schema";

const effectiveAvailability = effectiveAvailableCondition();
const effectiveOccupation = effectiveOccupiedCondition();

const availableUnits = sql`sum(case when ${effectiveAvailability} then 1 else 0 end)`;
const occupiedUnits = sql`sum(case when ${effectiveOccupation} then 1 else 0 end)`;
const minimumAvailablePrice = sql`min(case when ${effectiveAvailability} then ${datUnidades.precioBase} else null end)`;
const latestAvailabilityUpdate = sql`max(case when ${effectiveAvailability} then ${datUnidades.estadoActualizadoAt} else null end)`;

export async function getPublicServicesByCity(citySlug) {
  const db = getDb();

  const [city] = await db
    .select({
      id: catCiudades.id,
      name: catCiudades.nombre,
      slug: catCiudades.slug,
      state: catCiudades.estado,
      country: catCiudades.pais,
    })
    .from(catCiudades)
    .where(and(eq(catCiudades.slug, citySlug), eq(catCiudades.activo, true)))
    .limit(1);

  if (!city) {
    return null;
  }

  const rows = await db
    .select({
      id: datServicios.id,
      slug: datServicios.slug,
      name: datServicios.nombre,
      description: datServicios.descripcion,
      coverage: datServicios.coberturaTexto,
      logoUrl: datServicios.logoUrl,
      availableUnits,
      occupiedUnits,
      priceFrom: minimumAvailablePrice,
      availabilityUpdatedAt: latestAvailabilityUpdate,
    })
    .from(datServicios)
    .leftJoin(datUnidades, eq(datUnidades.servicioId, datServicios.id))
    .leftJoin(catEstadosUnidad, eq(catEstadosUnidad.id, datUnidades.estadoId))
    .where(and(eq(datServicios.ciudadId, city.id), eq(datServicios.visible, true)))
    .groupBy(
      datServicios.id,
      datServicios.slug,
      datServicios.nombre,
      datServicios.descripcion,
      datServicios.coberturaTexto,
      datServicios.logoUrl,
    )
    .orderBy(
      desc(sql`(${availableUnits}) > 0`),
      desc(availableUnits),
      desc(latestAvailabilityUpdate),
      asc(sql`rand()`),
    );

  const services = rows.map((row) => ({
    ...row,
    availableUnits: Number(row.availableUnits),
    occupiedUnits: Number(row.occupiedUnits),
    isAvailable: Number(row.availableUnits) > 0,
    publicState: Number(row.availableUnits) > 0
      ? "disponible"
      : Number(row.occupiedUnits) > 0
        ? "ocupado"
        : "no_disponible",
    priceFrom: row.priceFrom === null ? null : Number(row.priceFrom),
  }));

  return {
    city,
    services,
    totals: {
      services: services.length,
      availableUnits: services.reduce(
        (total, service) => total + service.availableUnits,
        0,
      ),
    },
  };
}
