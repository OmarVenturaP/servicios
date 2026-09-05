import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getEffectiveUnitStatus } from "@/db/availability";
import {
  catCiudades,
  catEstadosUnidad,
  datServicios,
  datUnidades,
  logEstadosUnidad,
} from "@/db/schema";
import { hashUnitToken } from "@/lib/unit-token";

const STATUS_ACTIONS = {
  disponible: { state: "disponible", hours: 3 },
  renovar: { state: "disponible", hours: 3 },
  ocupado: { state: "ocupado", hours: 1 },
  terminar: { state: "no_disponible", hours: null },
};

export class UnitPanelError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "UnitPanelError";
    this.code = code;
    this.status = status;
  }
}

function safeUnit(unit) {
  if (!unit) return null;

  return {
    serviceName: unit.serviceName,
    cityName: unit.cityName,
    unitName: unit.unitName,
    priceBase: Number(unit.priceBase),
    storedState: unit.state,
    effectiveState: getEffectiveUnitStatus({
      active: unit.active,
      state: unit.state,
      stateUntil: unit.stateUntil,
    }),
    stateUntil: unit.stateUntil ? new Date(unit.stateUntil).toISOString() : null,
  };
}

async function findActiveUnit(executor, tokenHash) {
  if (!tokenHash) return null;

  const [unit] = await executor
    .select({
      id: datUnidades.id,
      serviceName: datServicios.nombre,
      cityName: catCiudades.nombre,
      unitName: datUnidades.nombre,
      priceBase: datUnidades.precioBase,
      state: catEstadosUnidad.clave,
      stateUntil: datUnidades.estadoHasta,
      active: datUnidades.activo,
    })
    .from(datUnidades)
    .innerJoin(datServicios, eq(datServicios.id, datUnidades.servicioId))
    .innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId))
    .innerJoin(catEstadosUnidad, eq(catEstadosUnidad.id, datUnidades.estadoId))
    .where(and(eq(datUnidades.tokenHash, tokenHash), eq(datUnidades.activo, true)))
    .limit(1);

  return unit ?? null;
}

function requireTokenHash(token) {
  const tokenHash = hashUnitToken(token);

  if (!tokenHash) {
    throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);
  }

  return tokenHash;
}

function parsePrice(value) {
  const text = typeof value === "number" ? String(value) : value?.trim();

  if (typeof text !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(text)) {
    throw new UnitPanelError("invalid_price", "Ingresa un precio válido con hasta dos decimales.");
  }

  const price = Number(text);
  if (!Number.isFinite(price) || price <= 0) {
    throw new UnitPanelError("invalid_price", "El precio debe ser mayor que cero.");
  }

  return price.toFixed(2);
}

export async function resolveUnitPanel(token) {
  const tokenHash = hashUnitToken(token);
  if (!tokenHash) return null;
  return safeUnit(await findActiveUnit(getDb(), tokenHash));
}

export async function updateUnitStatus({ token, action }) {
  const tokenHash = requireTokenHash(token);
  const actionConfig = STATUS_ACTIONS[action];

  if (!actionConfig) {
    throw new UnitPanelError("invalid_action", "La acción solicitada no es válida.");
  }

  return getDb().transaction(async (tx) => {
    const unit = await findActiveUnit(tx, tokenHash);
    if (!unit) {
      throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);
    }

    const [state] = await tx
      .select({ id: catEstadosUnidad.id })
      .from(catEstadosUnidad)
      .where(and(eq(catEstadosUnidad.clave, actionConfig.state), eq(catEstadosUnidad.activo, true)))
      .limit(1);

    if (!state) {
      throw new UnitPanelError("state_unavailable", "No fue posible actualizar el estado.", 409);
    }

    const stateUntil = actionConfig.hours === null
      ? null
      : sql`date_add(now(), interval ${actionConfig.hours} hour)`;

    await tx
      .update(datUnidades)
      .set({ estadoId: state.id, estadoActualizadoAt: sql`now()`, estadoHasta: stateUntil })
      .where(and(eq(datUnidades.id, unit.id), eq(datUnidades.activo, true)));

    const updatedUnit = await findActiveUnit(tx, tokenHash);
    if (!updatedUnit) {
      throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);
    }

    await tx.insert(logEstadosUnidad).values({
      unidadId: unit.id,
      estadoId: state.id,
      estadoHasta: updatedUnit.stateUntil,
    });

    return safeUnit(updatedUnit);
  });
}

export async function updateUnitPrice({ token, price }) {
  const tokenHash = requireTokenHash(token);
  const normalizedPrice = parsePrice(price);

  return getDb().transaction(async (tx) => {
    const unit = await findActiveUnit(tx, tokenHash);
    if (!unit) {
      throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);
    }

    await tx
      .update(datUnidades)
      .set({ precioBase: normalizedPrice })
      .where(and(eq(datUnidades.id, unit.id), eq(datUnidades.activo, true)));

    return safeUnit({ ...unit, priceBase: normalizedPrice });
  });
}
