import { UnitPanelError, updateUnitAvailability } from "@/services/units";

export const runtime = "nodejs";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const unit = await updateUnitAvailability(body);
    return Response.json({ success: true, unit });
  } catch (error) {
    if (error instanceof UnitPanelError) return Response.json({ success: false, code: error.code, error: error.message }, { status: error.status });
    console.error("No se pudo actualizar la disponibilidad programada");
    return Response.json({ success: false, error: "No se pudo actualizar la disponibilidad." }, { status: 500 });
  }
}
