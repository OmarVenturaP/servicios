import { getOrCreateAnonymousSessionId } from "@/lib/session";
import { registerCityVisit } from "@/services/visits";

export const runtime = "nodejs";

function normalizedOrigin(value) {
  if (typeof value !== "string") {
    return "directo";
  }

  const origin = value.trim();
  return origin ? origin.slice(0, 255) : "directo";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const citySlug = typeof body.citySlug === "string" ? body.citySlug.trim() : "";

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)) {
      return Response.json({ error: "Ciudad inválida" }, { status: 400 });
    }

    const sessionId = await getOrCreateAnonymousSessionId();
    const result = await registerCityVisit({
      citySlug,
      sessionId,
      origin: normalizedOrigin(body.origin),
    });

    if (result.status === "city_not_found") {
      return Response.json({ error: "Ciudad no encontrada" }, { status: 404 });
    }

    return Response.json({ success: true, status: result.status });
  } catch (error) {
    console.error("No se pudo registrar la visita", error);
    return Response.json({ error: "No se pudo registrar la visita" }, { status: 500 });
  }
}
