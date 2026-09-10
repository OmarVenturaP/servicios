const INTERNAL_HINT = /(repartidor|proveedor|interno|prueba|test)/i;

function clean(value, max) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

export function normalizeAttribution(input = {}) {
  return {
    origin: clean(input.origin, 255) ?? "directo",
    utmSource: clean(input.utmSource, 120),
    utmMedium: clean(input.utmMedium, 120),
    utmCampaign: clean(input.utmCampaign, 160),
    utmContent: clean(input.utmContent, 160),
  };
}

export function classifyTraffic({ providerSignal = false, attribution = {} } = {}) {
  if (providerSignal || INTERNAL_HINT.test(attribution.utmCampaign ?? "") || INTERNAL_HINT.test(attribution.utmContent ?? "")) return "interno";
  return "publico";
}

export function normalizeResultPosition(value) {
  const position = Number(value);
  return Number.isInteger(position) && position > 0 && position <= 500 ? position : null;
}
