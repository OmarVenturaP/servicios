import { isAdminAuthorized } from "@/lib/admin-auth";
import { AdminMetricsError, getAdminMetrics } from "@/services/admin-metrics";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!isAdminAuthorized(body.accessKey)) {
      return Response.json({ success: false, error: "Clave de acceso incorrecta." }, { status: 401 });
    }

    const data = await getAdminMetrics(body.period ?? "7d");
    return Response.json({ success: true, data });
  } catch (error) {
    if (error instanceof AdminMetricsError) {
      return Response.json({ success: false, code: error.code, error: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ success: false, error: "La solicitud no es válida." }, { status: 400 });
    }
    console.error("No se pudieron consultar las métricas administrativas", error?.cause?.code ?? error?.code ?? "unknown");
    return Response.json({ success: false, error: "No se pudieron consultar las métricas." }, { status: 500 });
  }
}
