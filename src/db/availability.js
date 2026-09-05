import { and, eq, sql } from "drizzle-orm";
import { catEstadosUnidad, datUnidades } from "@/db/schema";

export function effectiveAvailableCondition() {
  return and(
    eq(datUnidades.activo, true),
    eq(catEstadosUnidad.activo, true),
    eq(catEstadosUnidad.clave, "disponible"),
    sql`${datUnidades.estadoHasta} > now()`,
  );
}

export function getEffectiveUnitStatus({ active, state, stateUntil }) {
  if (!active) {
    return "no_disponible";
  }

  const hasCurrentExpiration = stateUntil && new Date(stateUntil).getTime() > Date.now();

  if (state === "disponible" && hasCurrentExpiration) {
    return "disponible";
  }

  if (state === "ocupado" && hasCurrentExpiration) {
    return "ocupado";
  }

  if ((state === "disponible" || state === "ocupado") && stateUntil) {
    return "vencido";
  }

  return "no_disponible";
}
