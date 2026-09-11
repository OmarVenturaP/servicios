import test from "node:test";
import assert from "node:assert/strict";
import {
  canPublishEmergencyContact,
  hasVerificationSensitiveChange,
  normalizeEmergencyPhone,
  normalizeExtension,
  normalizeOfficialUrl,
  selectPublishableEmergencyContactsForCity,
} from "../src/domain/emergency-contacts.js";
import { isAdminAuthorized } from "../src/lib/admin-auth.js";

const now = new Date("2026-09-11T18:00:00.000Z");
const city = { id: 1, active: true, country: "México" };
const publishable = { cityId: 1, name: "Institución de prueba", slug: "institucion-prueba", type: "otros", phone: "+529611234567", sourceUrl: "https://example.gob.mx/contacto", verifiedAt: "2026-09-10T12:00:00.000Z", visible: true };

test("valida teléfonos internacionales y solo números cortos autorizados por país", () => {
  assert.equal(normalizeEmergencyPhone("+529611234567", "México"), "+529611234567");
  assert.equal(normalizeEmergencyPhone("078", "México"), "078");
  assert.equal(normalizeEmergencyPhone("088", "México"), "088");
  assert.equal(normalizeEmergencyPhone("089", "México"), "089");
  assert.equal(normalizeEmergencyPhone("911", "México"), "911");
  assert.equal(normalizeEmergencyPhone("089", "Guatemala"), null);
  assert.equal(normalizeEmergencyPhone("911", "Guatemala"), null);
  assert.equal(normalizeEmergencyPhone("9611234567", "México"), null);
  assert.equal(normalizeEmergencyPhone("tel:+529611234567", "México"), null);
});

test("valida extensiones, fuentes HTTP/HTTPS y fechas de publicación", () => {
  assert.equal(normalizeExtension("123"), "123");
  assert.equal(normalizeExtension("12A"), null);
  assert.equal(normalizeOfficialUrl("javascript:alert(1)"), null);
  assert.equal(canPublishEmergencyContact(publishable, city, now), true);
  assert.equal(canPublishEmergencyContact({ ...publishable, sourceUrl: null }, city, now), false);
  assert.equal(canPublishEmergencyContact({ ...publishable, verifiedAt: "2026-09-12T00:00:00.000Z" }, city, now), false);
});

test("una modificación sensible invalida la verificación, pero orden y visibilidad no", () => {
  const base = { cityId: 1, name: "Institución", phone: "+529611234567", extension: null, description: "Alcance confirmado", schedule: "24 horas", sourceUrl: "https://example.gob.mx" };
  assert.equal(hasVerificationSensitiveChange(base, { ...base, phone: "+529619999999" }), true);
  assert.equal(hasVerificationSensitiveChange(base, { ...base, order: 2, visible: true }), false);
});

test("aísla contactos publicables por ciudad y excluye borradores", () => {
  const rows = [publishable, { ...publishable, id: 2, cityId: 2 }, { ...publishable, id: 3, visible: false }];
  assert.deepEqual(selectPublishableEmergencyContactsForCity(rows, city, now), [publishable]);
  assert.deepEqual(selectPublishableEmergencyContactsForCity(rows, { ...city, active: false }, now), []);
});

test("la autorización administrativa acepta solo la clave configurada", () => {
  const previous = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "clave-de-prueba";
  try {
    assert.equal(isAdminAuthorized("clave-de-prueba"), true);
    assert.equal(isAdminAuthorized("incorrecta"), false);
    assert.equal(isAdminAuthorized(""), false);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = previous;
  }
});
