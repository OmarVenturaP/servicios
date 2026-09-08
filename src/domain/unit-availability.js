const VALID_TIME_ZONE = "America/Mexico_City";

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const weekdays = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { weekday: weekdays[values.weekday], minutes: Number(values.hour) * 60 + Number(values.minute) };
}

export function normalizeTimeZone(value) {
  try {
    new Intl.DateTimeFormat("es-MX", { timeZone: value }).format();
    return value;
  } catch {
    return VALID_TIME_ZONE;
  }
}

export function timeToMinutes(value) {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value ?? "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export function validateSchedule(schedule) {
  if (!Array.isArray(schedule)) return { valid: false, error: "El horario no es válido." };
  for (let day = 1; day <= 7; day += 1) {
    const blocks = schedule.filter((block) => Number(block.day) === day);
    if (blocks.length > 2) return { valid: false, error: "Solo se permiten dos horarios por día." };
    const ranges = blocks.map((block) => ({ start: timeToMinutes(block.start), end: timeToMinutes(block.end) }));
    if (ranges.some(({ start, end }) => start === null || end === null || start >= end)) {
      return { valid: false, error: "Cada horario debe iniciar antes de terminar. No se admiten cruces de medianoche." };
    }
    ranges.sort((a, b) => a.start - b.start);
    if (ranges[1] && ranges[1].start < ranges[0].end) return { valid: false, error: "Los horarios de un mismo día no pueden cruzarse." };
  }
  return { valid: true };
}

function activeOverride(unit, now) {
  if (!unit.overrideState) return null;
  if (unit.overrideUntil && new Date(unit.overrideUntil).getTime() <= now.getTime()) return null;
  return unit.overrideState;
}

export function getEffectiveAvailability(unit, now = new Date()) {
  if (!unit?.active) return { state: "no_disponible", reason: "deshabilitada" };
  const override = activeOverride(unit, now);
  if (override) return { state: override, reason: "excepcion" };

  if ((unit.availabilityMode ?? "manual") === "manual") {
    const current = unit.stateUntil && new Date(unit.stateUntil).getTime() > now.getTime();
    if (current && ["disponible", "ocupado"].includes(unit.state)) return { state: unit.state, reason: "manual", until: unit.stateUntil };
    if (unit.stateUntil && ["disponible", "ocupado"].includes(unit.state)) return { state: "vencido", reason: "manual" };
    return { state: "no_disponible", reason: "manual" };
  }

  const parts = zonedParts(now, normalizeTimeZone(unit.timeZone));
  const block = (unit.schedule ?? []).find((item) => Number(item.day) === parts.weekday && timeToMinutes(item.start) <= parts.minutes && parts.minutes < timeToMinutes(item.end));
  return block ? { state: "disponible", reason: "horario", end: block.end } : { state: "fuera_horario", reason: "horario" };
}

export function getNextAvailability(unit, now = new Date()) {
  const effective = getEffectiveAvailability(unit, now);
  if (effective.state === "disponible") return { type: "available_now", until: effective.until ?? effective.end ?? null };
  if ((unit.availabilityMode ?? "manual") !== "programado") return null;
  for (let step = 0; step < 8 * 24 * 60; step += 1) {
    const candidate = new Date(now.getTime() + step * 60_000);
    const result = getEffectiveAvailability({ ...unit, overrideState: null, overrideUntil: null }, candidate);
    if (result.state === "disponible") return { type: "next", at: candidate.toISOString() };
  }
  return null;
}
