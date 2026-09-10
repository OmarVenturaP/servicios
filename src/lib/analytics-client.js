export function browserAttribution() {
  const params = new URLSearchParams(window.location.search);
  let origin = "directo";
  if (document.referrer) {
    try { origin = new URL(document.referrer).origin; } catch { origin = "referencia_desconocida"; }
  }
  return {
    origin,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
  };
}

export function sendAnalyticsEvent(payload) {
  fetch("/api/analitica/eventos", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, attribution: browserAttribution() }),
    keepalive: true,
  }).catch(() => {});
}
