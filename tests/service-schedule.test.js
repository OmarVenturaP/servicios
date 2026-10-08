import test from "node:test";
import assert from "node:assert/strict";
import { getTodaySchedule, mergeScheduleRanges, normalizeScheduleInput, scheduleLabel } from "../src/domain/service-schedule.js";

test("valida hasta dos bloques sin cruces ni duplicados", () => {
  assert.equal(normalizeScheduleInput([{ day: 1, block: 1, start: "08:00", end: "14:00" }, { day: 1, block: 2, start: "16:00", end: "20:00" }]).valid, true);
  assert.equal(normalizeScheduleInput([{ day: 1, block: 1, start: "08:00", end: "14:00" }, { day: 1, block: 1, start: "16:00", end: "20:00" }]).valid, false);
  assert.equal(normalizeScheduleInput([{ day: 1, block: 1, start: "18:00", end: "02:00" }]).valid, false);
});

test("consolida horarios de unidades sin ocultar descansos", () => {
  const merged = mergeScheduleRanges([
    { day: 1, start: "08:00", end: "14:00" },
    { day: 1, start: "10:00", end: "16:00" },
    { day: 1, start: "18:00", end: "20:00" },
  ]);
  assert.deepEqual(merged, [
    { day: 1, block: 1, start: "08:00", end: "16:00" },
    { day: 1, block: 2, start: "18:00", end: "20:00" },
  ]);
  assert.equal(scheduleLabel(merged), "08:00–16:00 · 18:00–20:00");
});

test("distingue un día cerrado de la ausencia completa de horario", () => {
  const schedule = [{ day: 2, block: 1, start: "08:00", end: "18:00" }];
  const monday = new Date("2026-09-28T16:00:00.000Z");
  assert.deepEqual(getTodaySchedule(schedule, "America/Mexico_City", monday), { day: 1, closed: true, open: false, blocks: [] });
  assert.equal(getTodaySchedule([], "America/Mexico_City", monday), null);
});

test("calcula abierto o cerrado usando la zona horaria de la ciudad", () => {
  const schedule = [{ day: 1, block: 1, start: "08:00", end: "14:00" }];
  assert.equal(getTodaySchedule(schedule, "America/Mexico_City", new Date("2026-09-28T14:00:00.000Z")).open, true);
  assert.equal(getTodaySchedule(schedule, "America/Mexico_City", new Date("2026-09-28T20:00:00.000Z")).open, false);
});
