import { normalizeTimeZone, timeToMinutes, validateSchedule } from "./unit-availability.js";

export const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function normalizeScheduleInput(value) {
  if (!Array.isArray(value)) return { valid: false, error: "El horario no es válido." };
  const schedule = value.map((item) => ({
    day: Number(item.day),
    block: Number(item.block),
    start: typeof item.start === "string" ? item.start.slice(0, 5) : "",
    end: typeof item.end === "string" ? item.end.slice(0, 5) : "",
  }));
  if (schedule.some((item) => !Number.isInteger(item.day) || item.day < 1 || item.day > 7 || !Number.isInteger(item.block) || item.block < 1 || item.block > 2)) {
    return { valid: false, error: "El día o bloque del horario no es válido." };
  }
  if (new Set(schedule.map((item) => `${item.day}:${item.block}`)).size !== schedule.length) {
    return { valid: false, error: "No puede repetirse un bloque del mismo día." };
  }
  const validation = validateSchedule(schedule);
  return validation.valid ? { valid: true, schedule } : validation;
}

export function mergeScheduleRanges(schedule) {
  const result = [];
  for (let day = 1; day <= 7; day += 1) {
    const ranges = schedule
      .filter((item) => Number(item.day) === day)
      .map((item) => ({ start: String(item.start).slice(0, 5), end: String(item.end).slice(0, 5) }))
      .filter((item) => timeToMinutes(item.start) !== null && timeToMinutes(item.end) !== null)
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    const merged = [];
    for (const range of ranges) {
      const previous = merged.at(-1);
      if (previous && timeToMinutes(range.start) <= timeToMinutes(previous.end)) {
        if (timeToMinutes(range.end) > timeToMinutes(previous.end)) previous.end = range.end;
      } else {
        merged.push({ ...range });
      }
    }
    merged.forEach((range, index) => result.push({ day, block: index + 1, ...range }));
  }
  return result;
}

export function getZonedWeekday(now = new Date(), timeZone = "America/Mexico_City") {
  return getZonedScheduleParts(now, timeZone).day;
}

function getZonedScheduleParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeTimeZone(timeZone),
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    day: ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 })[values.weekday],
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

export function getTodaySchedule(schedule, timeZone, now = new Date()) {
  if (!schedule?.length) return null;
  const { day, minutes } = getZonedScheduleParts(now, timeZone);
  const blocks = schedule.filter((item) => Number(item.day) === day);
  const open = blocks.some((item) => timeToMinutes(item.start) <= minutes && minutes < timeToMinutes(item.end));
  return { day, closed: blocks.length === 0, open, blocks };
}

export function scheduleLabel(blocks) {
  return blocks.map((block) => `${String(block.start).slice(0, 5)}–${String(block.end).slice(0, 5)}`).join(" · ");
}
