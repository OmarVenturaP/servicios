import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  addUnit,
  AdminError,
  createProvider,
  getAdminSnapshot,
  rotateUnitAccess,
  updateAdminUnit,
  updateAdminUnitStatus,
  updateService,
} from "@/services/admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!isAdminAuthorized(body.accessKey)) {
      return Response.json({ success: false, error: "Clave de acceso incorrecta." }, { status: 401 });
    }

    let selectedServiceId = null;
    let access = null;
    switch (body.action) {
      case "bootstrap":
        break;
      case "create_provider":
        selectedServiceId = await createProvider(body.data ?? {});
        break;
      case "update_service":
        await updateService(body.serviceId, body.data ?? {});
        selectedServiceId = Number(body.serviceId);
        break;
      case "add_unit":
        await addUnit(body.serviceId, body.data ?? {});
        selectedServiceId = Number(body.serviceId);
        break;
      case "update_unit":
        await updateAdminUnit(body.serviceId, body.unitId, body.data ?? {});
        selectedServiceId = Number(body.serviceId);
        break;
      case "update_unit_status":
        await updateAdminUnitStatus(body.serviceId, body.unitId, body.statusAction);
        selectedServiceId = Number(body.serviceId);
        break;
      case "rotate_access":
        access = await rotateUnitAccess(body.serviceId, body.unitId, request.url);
        selectedServiceId = Number(body.serviceId);
        break;
      default:
        throw new AdminError("invalid_action", "La operación solicitada no es válida.");
    }

    return Response.json({ success: true, data: await getAdminSnapshot(), selectedServiceId, access });
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ success: false, code: error.code, error: error.message }, { status: error.status });
    }
    console.error("No se pudo completar la operación administrativa");
    return Response.json({ success: false, error: "No se pudo completar la operación." }, { status: 500 });
  }
}
