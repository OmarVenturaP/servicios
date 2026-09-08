import test from "node:test";
import assert from "node:assert/strict";
import { getEffectiveAvailability, getNextAvailability, validateSchedule } from "../src/domain/unit-availability.js";

const mondaySchedule = [{ day: 1, block: 1, start: "08:00", end: "14:00" }];
const base = { active: true, availabilityMode: "programado", schedule: mondaySchedule, timeZone: "America/Mexico_City", state: "no_disponible" };

test("una unidad existente sin modo conserva el comportamiento manual", () => {
  const result = getEffectiveAvailability({ active: true, state: "disponible", stateUntil: "2026-09-07T16:00:00.000Z" }, new Date("2026-09-07T15:00:00.000Z"));
  assert.equal(result.state, "disponible");
});

test("el horario usa límites [inicio, fin)", () => {
  assert.equal(getEffectiveAvailability(base, new Date("2026-09-07T13:59:00.000Z")).state, "fuera_horario");
  assert.equal(getEffectiveAvailability(base, new Date("2026-09-07T14:00:00.000Z")).state, "disponible");
  assert.equal(getEffectiveAvailability(base, new Date("2026-09-07T19:59:00.000Z")).state, "disponible");
  assert.equal(getEffectiveAvailability(base, new Date("2026-09-07T20:00:00.000Z")).state, "fuera_horario");
});

test("admite dos bloques y días cerrados", () => {
  const unit = { ...base, schedule: [...mondaySchedule, { day: 1, block: 2, start: "16:00", end: "21:00" }] };
  assert.equal(getEffectiveAvailability(unit, new Date("2026-09-07T23:00:00.000Z")).state, "disponible");
  assert.equal(getEffectiveAvailability(unit, new Date("2026-09-08T15:00:00.000Z")).state, "fuera_horario");
});

test("las excepciones activas prevalecen y las vencidas se ignoran", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  assert.equal(getEffectiveAvailability({ ...base, overrideState: "no_disponible", overrideUntil: "2026-09-07T16:00:00.000Z" }, now).state, "no_disponible");
  assert.equal(getEffectiveAvailability({ ...base, overrideState: "disponible", overrideUntil: "2026-09-07T14:00:00.000Z" }, now).state, "disponible");
});

test("valida cruces, solapamientos y horas incompletas", () => {
  assert.equal(validateSchedule([{ day: 1, block: 1, start: "18:00", end: "02:00" }]).valid, false);
  assert.equal(validateSchedule([{ day: 1, block: 1, start: "08:00", end: "14:00" }, { day: 1, block: 2, start: "13:00", end: "16:00" }]).valid, false);
  assert.equal(validateSchedule([{ day: 1, block: 1, start: "", end: "14:00" }]).valid, false);
});

test("calcula la siguiente disponibilidad respetando el cambio de día", () => {
  const result = getNextAvailability(base, new Date("2026-09-06T13:00:00.000Z"));
  assert.equal(result.type, "next");
  assert.equal(result.at, "2026-09-07T14:00:00.000Z");
});
