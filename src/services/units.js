import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getEffectiveAvailability, getNextAvailability, validateSchedule } from "@/domain/unit-availability";
import {
  catCiudades,
  catEstadosUnidad,
  datServicios,
  datHorariosUnidad,
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

  const availabilityInput = {
    active: unit.active,
    state: unit.state,
    stateUntil: unit.stateUntil,
    availabilityMode: unit.availabilityMode,
    overrideState: unit.overrideState,
    overrideUntil: unit.overrideUntil,
    schedule: unit.schedule,
    timeZone: unit.timeZone,
  };
  const effectiveAvailability = getEffectiveAvailability(availabilityInput);
  return {
    serviceName: unit.serviceName,
    cityName: unit.cityName,
    unitName: unit.unitName,
    priceBase: Number(unit.priceBase),
    storedState: unit.state,
    effectiveState: effectiveAvailability.state,
    availabilityReason: effectiveAvailability.reason,
    stateUntil: unit.stateUntil ? new Date(unit.stateUntil).toISOString() : null,
    availabilityMode: unit.availabilityMode ?? "manual",
    overrideState: unit.overrideState,
    overrideUntil: unit.overrideUntil ? new Date(unit.overrideUntil).toISOString() : null,
    timeZone: unit.timeZone,
    schedule: unit.schedule ?? [],
    nextAvailability: getNextAvailability(availabilityInput),
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
      availabilityMode: datUnidades.modoDisponibilidad,
      overrideState: datUnidades.excepcionEstado,
      overrideUntil: datUnidades.excepcionHasta,
      timeZone: catCiudades.zonaHoraria,
    })
    .from(datUnidades)
    .innerJoin(datServicios, eq(datServicios.id, datUnidades.servicioId))
    .innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId))
    .innerJoin(catEstadosUnidad, eq(catEstadosUnidad.id, datUnidades.estadoId))
    .where(and(eq(datUnidades.tokenHash, tokenHash), eq(datUnidades.activo, true)))
    .limit(1);

  if (!unit) return null;
  unit.schedule = await executor.select({ day: datHorariosUnidad.diaSemana, block: datHorariosUnidad.bloque, start: datHorariosUnidad.horaInicio, end: datHorariosUnidad.horaFin }).from(datHorariosUnidad).where(eq(datHorariosUnidad.unidadId, unit.id)).orderBy(datHorariosUnidad.diaSemana, datHorariosUnidad.bloque);
  return unit;
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

  return getDb().transaction(async (tx) => {
    const unit = await findActiveUnit(tx, tokenHash);
    if (!unit) {
      throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);
    }

    await updateUnitStatusRecord(tx, { unitId: unit.id, action });

    const updatedUnit = await findActiveUnit(tx, tokenHash);
    if (!updatedUnit) {
      throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);
    }

    return safeUnit(updatedUnit);
  });
}

async function updateUnitStatusRecord(tx, { unitId, action }) {
  const actionConfig = STATUS_ACTIONS[action];
  if (!actionConfig) {
    throw new UnitPanelError("invalid_action", "La acción solicitada no es válida.");
  }

  const [state] = await tx
      .select({ id: catEstadosUnidad.id })
      .from(catEstadosUnidad)
      .where(and(eq(catEstadosUnidad.clave, actionConfig.state), eq(catEstadosUnidad.activo, true)))
      .limit(1);

  if (!state) {
    throw new UnitPanelError("state_unavailable", "No fue posible actualizar el estado.", 409);
  }

  const [currentUnit] = await tx.select({ mode: datUnidades.modoDisponibilidad }).from(datUnidades).where(eq(datUnidades.id, unitId)).limit(1);
  if (!currentUnit) throw new UnitPanelError("unit_not_found", "La unidad no existe.", 404);

  const stateUntil = actionConfig.hours === null
    ? null
    : sql`date_add(now(), interval ${actionConfig.hours} hour)`;

  await tx
    .update(datUnidades)
    .set({
      estadoId: state.id,
      estadoActualizadoAt: sql`now()`,
      estadoHasta: stateUntil,
      excepcionEstado: currentUnit.mode === "programado" ? actionConfig.state : null,
      excepcionHasta: currentUnit.mode === "programado" ? stateUntil : null,
    })
    .where(eq(datUnidades.id, unitId));

  const [updatedUnit] = await tx
    .select({ stateUntil: datUnidades.estadoHasta })
    .from(datUnidades)
    .where(eq(datUnidades.id, unitId))
    .limit(1);

  if (!updatedUnit) {
    throw new UnitPanelError("unit_not_found", "La unidad no existe.", 404);
  }

  await tx.insert(logEstadosUnidad).values({
    unidadId: unitId,
    estadoId: state.id,
    estadoHasta: updatedUnit.stateUntil,
  });
}

export async function updateUnitStatusById({ serviceId, unitId, action }) {
  return getDb().transaction(async (tx) => {
    const [unit] = await tx
      .select({ id: datUnidades.id })
      .from(datUnidades)
      .where(and(eq(datUnidades.id, unitId), eq(datUnidades.servicioId, serviceId)))
      .limit(1);

    if (!unit) {
      throw new UnitPanelError("unit_not_found", "La unidad no pertenece al servicio.", 404);
    }

    await updateUnitStatusRecord(tx, { unitId: unit.id, action });
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

const OVERRIDE_DURATIONS = new Set(["30m", "1h", "2h", "indefinido"]);

function overrideUntil(duration) {
  if (!OVERRIDE_DURATIONS.has(duration)) throw new UnitPanelError("invalid_duration", "Selecciona una duración válida.");
  if (duration === "indefinido") return null;
  const minutes = duration === "30m" ? 30 : duration === "1h" ? 60 : 120;
  return sql`date_add(utc_timestamp(), interval ${minutes} minute)`;
}

export async function updateUnitAvailability({ token, action, mode, schedule, state, duration }) {
  const tokenHash = requireTokenHash(token);
  return getDb().transaction(async (tx) => {
    const unit = await findActiveUnit(tx, tokenHash);
    if (!unit) throw new UnitPanelError("invalid_link", "El enlace no es válido o ya no está activo.", 404);

    if (action === "mode") {
      if (!["manual", "programado"].includes(mode)) throw new UnitPanelError("invalid_mode", "El modo de disponibilidad no es válido.");
      await tx.update(datUnidades).set({ modoDisponibilidad: mode, excepcionEstado: null, excepcionHasta: null }).where(eq(datUnidades.id, unit.id));
    } else if (action === "schedule") {
      const validation = validateSchedule(schedule);
      if (!validation.valid) throw new UnitPanelError("invalid_schedule", validation.error);
      const normalized = schedule.map((item) => ({ day: Number(item.day), block: Number(item.block), start: item.start, end: item.end }));
      if (normalized.some((item) => !Number.isInteger(item.block) || item.block < 1 || item.block > 2)) throw new UnitPanelError("invalid_schedule", "El bloque de horario no es válido.");
      await tx.delete(datHorariosUnidad).where(eq(datHorariosUnidad.unidadId, unit.id));
      if (normalized.length) await tx.insert(datHorariosUnidad).values(normalized.map((item) => ({ unidadId: unit.id, diaSemana: item.day, bloque: item.block, horaInicio: item.start, horaFin: item.end })));
    } else if (action === "override") {
      if (!["disponible", "no_disponible"].includes(state)) throw new UnitPanelError("invalid_override", "La excepción solicitada no es válida.");
      await tx.update(datUnidades).set({ excepcionEstado: state, excepcionHasta: overrideUntil(duration) }).where(eq(datUnidades.id, unit.id));
    } else if (action === "clear_override") {
      await tx.update(datUnidades).set({ excepcionEstado: null, excepcionHasta: null }).where(eq(datUnidades.id, unit.id));
    } else {
      throw new UnitPanelError("invalid_action", "La acción solicitada no es válida.");
    }

    return safeUnit(await findActiveUnit(tx, tokenHash));
  });
}
