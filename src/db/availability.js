import { and, eq, or, sql } from "drizzle-orm";
import { catEstadosUnidad, datHorariosUnidad, datUnidades } from "@/db/schema";
import { getEffectiveAvailability } from "@/domain/unit-availability";

export function getTimeZoneOffsetMinutes(timeZone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return Math.round((Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - date.getTime()) / 60_000);
}

function activeOverride() {
  return and(sql`${datUnidades.excepcionEstado} is not null`, or(sql`${datUnidades.excepcionHasta} is null`, sql`${datUnidades.excepcionHasta} > utc_timestamp()`));
}

function scheduledAvailableCondition(offsetMinutes) {
  const localNow = sql`date_add(utc_timestamp(), interval ${offsetMinutes} minute)`;
  return and(eq(datUnidades.modoDisponibilidad, "programado"), sql`exists (select 1 from ${datHorariosUnidad} h where h.unidad_id = ${datUnidades.id} and h.dia_semana = weekday(${localNow}) + 1 and time(${localNow}) >= h.hora_inicio and time(${localNow}) < h.hora_fin)`);
}

export function effectiveAvailableCondition({ timeZoneOffsetMinutes = -360 } = {}) {
  return and(
    eq(datUnidades.activo, true),
    eq(catEstadosUnidad.activo, true),
    or(
      and(activeOverride(), eq(datUnidades.excepcionEstado, "disponible")),
      and(sql`not (${activeOverride()})`, or(and(eq(datUnidades.modoDisponibilidad, "manual"), eq(catEstadosUnidad.clave, "disponible"), sql`${datUnidades.estadoHasta} > now()`), scheduledAvailableCondition(timeZoneOffsetMinutes))),
    ),
  );
}

export function effectiveOccupiedCondition() {
  return and(
    eq(datUnidades.activo, true),
    eq(catEstadosUnidad.activo, true),
    or(
      and(activeOverride(), eq(datUnidades.excepcionEstado, "ocupado")),
      and(sql`not (${activeOverride()})`, eq(datUnidades.modoDisponibilidad, "manual"), eq(catEstadosUnidad.clave, "ocupado"), sql`${datUnidades.estadoHasta} > now()`),
    ),
  );
}

export function getEffectiveUnitStatus(input) {
  return getEffectiveAvailability({ active: input.active, state: input.state, stateUntil: input.stateUntil, availabilityMode: input.availabilityMode, overrideState: input.overrideState, overrideUntil: input.overrideUntil, schedule: input.schedule, timeZone: input.timeZone }).state;
}
