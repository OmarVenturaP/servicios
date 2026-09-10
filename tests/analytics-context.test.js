import test from "node:test";
import assert from "node:assert/strict";
import { classifyTraffic, normalizeAttribution, normalizeResultPosition } from "../src/lib/analytics-context.js";

test("normaliza atribución sin guardar valores ilimitados", () => {
  const context = normalizeAttribution({ origin: "  https://example.com  ", utmSource: "whatsapp", utmCampaign: "x".repeat(200) });
  assert.equal(context.origin, "https://example.com");
  assert.equal(context.utmSource, "whatsapp");
  assert.equal(context.utmCampaign.length, 160);
  assert.equal(context.utmMedium, null);
});

test("clasifica la señal legítima de proveedor como tráfico interno probable", () => {
  assert.equal(classifyTraffic({ providerSignal: true }), "interno");
  assert.equal(classifyTraffic({ attribution: { utmCampaign: "piloto_repartidores" } }), "interno");
  assert.equal(classifyTraffic({ attribution: { utmCampaign: "piloto_clientes" } }), "publico");
});

test("acepta únicamente posiciones enteras razonables", () => {
  assert.equal(normalizeResultPosition(3), 3);
  assert.equal(normalizeResultPosition("2"), 2);
  assert.equal(normalizeResultPosition(0), null);
  assert.equal(normalizeResultPosition("texto"), null);
});
