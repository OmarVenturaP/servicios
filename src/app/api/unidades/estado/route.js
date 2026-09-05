import { UnitPanelError, updateUnitStatus } from "@/services/units";

export const runtime = "nodejs";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const unit = await updateUnitStatus({ token: body.token, action: body.action });
    return Response.json({ success: true, unit });
  } catch (error) {
    if (error instanceof UnitPanelError) {
      return Response.json(
        { success: false, code: error.code, error: error.message },
        { status: error.status },
      );
    }

    console.error("No se pudo actualizar el estado de la unidad");
    return Response.json({ success: false, error: "No se pudo actualizar el estado." }, { status: 500 });
  }
}
