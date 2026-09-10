import { getOrCreateAnonymousSessionId } from "@/lib/session";
import { registerCityVisit } from "@/services/visits";
import { normalizeAttribution } from "@/lib/analytics-context";
import { currentTrafficType } from "@/lib/analytics-server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const citySlug = typeof body.citySlug === "string" ? body.citySlug.trim() : "";

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)) {
      return Response.json({ error: "Ciudad inválida" }, { status: 400 });
    }

    const sessionId = await getOrCreateAnonymousSessionId();
    const attribution = normalizeAttribution(body.attribution);
    const result = await registerCityVisit({
      citySlug,
      sessionId,
      attribution,
      trafficType: await currentTrafficType(attribution),
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
