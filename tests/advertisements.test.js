import test from "node:test";
import assert from "node:assert/strict";
import { cityDate, safeAdUrl, selectPublicAds, validAdImage, validateAd } from "../src/domain/advertisements.js";

const input = { cityId: 1, title: "Anuncio", destinationUrl: "https://example.com/promo", active: false, order: 0 };

test("publicidad acepta HTTPS y WhatsApp internacional y rechaza destinos inseguros", () => {
  assert.equal(validateAd(input).value.active, false);
  assert.ok(safeAdUrl("https://wa.me/529661234567?text=Hola"));
  for (const url of ["javascript:alert(1)", "data:text/html,test", "http://example.com", "https://user:pass@example.com", "//example.com", "https://wa.me/+529661234567", "https://wa.me/abc"]) assert.equal(safeAdUrl(url), null);
  assert.equal(safeAdUrl("https://example.com/banner.png", true), null);
});

test("publicidad valida fechas reales, orden, ciudad y estado", () => {
  for (const change of [{ cityId: 0 }, { cityId: 1.2 }, { title: " " }, { order: -1 }, { order: 0.5 }, { active: "true" }, { startDate: "2026-02-30" }, { startDate: "2026-10-08", endDate: "2026-10-07" }]) assert.ok(validateAd({ ...input, ...change }).error);
  assert.ok(validateAd({ ...input, startDate: "2028-02-29", endDate: "2028-02-29" }).value);
});

test("publicidad aísla ciudades, vigencia inclusiva y activos; orden determinista sin datos internos", () => {
  const base = { cityId: 1, active: true, title: "Ejemplo", imageUrl: "https://res.cloudinary.com/demo/image/upload/banner.jpg", destinationUrl: "https://example.com", order: 2 };
  const rows = [
    { ...base, id: 2, startDate: "2026-10-07", endDate: "2026-10-07" },
    { ...base, id: 1 }, { ...base, id: 3, order: 0 },
    { ...base, id: 4, cityId: 2 }, { ...base, id: 5, active: false },
    { ...base, id: 6, startDate: "2026-10-08" }, { ...base, id: 7, endDate: "2026-10-06" },
    { ...base, id: 8, destinationUrl: "javascript:alert(1)" },
  ];
  const ads = selectPublicAds(rows, 1, "2026-10-07");
  assert.deepEqual(ads.map((ad) => ad.id), [3, 1, 2]);
  assert.equal("cityId" in ads[0], false);
  assert.equal(selectPublicAds(rows, 3, "2026-10-07").length, 0);
});

test("vigencia publicitaria usa el día de la ciudad al cambiar de fecha UTC", () => {
  assert.equal(cityDate("America/Mexico_City", new Date("2026-10-08T01:00:00Z")), "2026-10-07");
});

test("carga de publicidad rechaza contenidos falsos y formatos no admitidos", () => {
  assert.equal(validAdImage(Buffer.from("not an image"), "image/jpeg"), false);
  assert.equal(validAdImage(Buffer.from([255, 216, 255]), "image/jpeg"), true);
  assert.equal(validAdImage(Buffer.from("GIF89a"), "image/gif"), false);
});
