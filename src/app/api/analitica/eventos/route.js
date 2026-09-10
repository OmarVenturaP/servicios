import { getOrCreateAnonymousSessionId } from "@/lib/session";
import { normalizeAttribution } from "@/lib/analytics-context";
import { currentTrafficType } from "@/lib/analytics-server";
import { AnalyticsEventError, registerAnalyticsEvent } from "@/services/analytics-events";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const attribution = normalizeAttribution(body.attribution);
    const result = await registerAnalyticsEvent({
      citySlug: typeof body.citySlug === "string" ? body.citySlug.trim() : "",
      serviceSlug: typeof body.serviceSlug === "string" ? body.serviceSlug.trim() : "",
      event: body.event,
      resultPosition: body.resultPosition,
      value: body.value,
      sessionId: await getOrCreateAnonymousSessionId(),
      trafficType: await currentTrafficType(attribution),
      attribution,
    });
    return Response.json({ success: true, status: result.status });
  } catch (error) {
    if (error instanceof AnalyticsEventError) return Response.json({ success: false, error: error.message }, { status: error.status });
    console.error("No se pudo registrar un evento de analítica", error?.cause?.code ?? error?.code ?? "unknown");
    return Response.json({ success: false }, { status: 202 });
  }
}
