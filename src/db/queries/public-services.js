import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  catCiudades,
  catEstadosUnidad,
  datServicios,
  datUnidades,
} from "@/db/schema";

const effectiveAvailability = sql`${datUnidades.activo} = true
  and ${catEstadosUnidad.activo} = true
  and ${catEstadosUnidad.clave} = 'disponible'
  and ${datUnidades.estadoHasta} > now()`;

const availableUnits = sql`sum(case when ${effectiveAvailability} then 1 else 0 end)`;
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
    isAvailable: Number(row.availableUnits) > 0,
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
