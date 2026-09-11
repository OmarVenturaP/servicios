import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  createEmergencyContact,
  EmergencyContactError,
  getAdminEmergencySnapshot,
  setEmergencyContactVisibility,
  updateEmergencyContact,
  verifyEmergencyContact,
} from "@/services/emergency-contacts";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!isAdminAuthorized(body.accessKey)) return Response.json({ success: false, error: "Clave de acceso incorrecta." }, { status: 401 });

    switch (body.action) {
      case "bootstrap": break;
      case "create": await createEmergencyContact(body.data ?? {}); break;
      case "update": await updateEmergencyContact(body.contactId, body.data ?? {}); break;
      case "verify": await verifyEmergencyContact(body.contactId, body.verifiedAt); break;
      case "visibility": await setEmergencyContactVisibility(body.contactId, body.visible); break;
      default: throw new EmergencyContactError("invalid_action", "La operación solicitada no es válida.");
    }

    return Response.json({ success: true, data: await getAdminEmergencySnapshot() });
  } catch (error) {
    if (error instanceof EmergencyContactError) return Response.json({ success: false, code: error.code, error: error.message }, { status: error.status });
    console.error("No se pudo completar la operación administrativa de Emergencias");
    return Response.json({ success: false, error: "No se pudo completar la operación." }, { status: 500 });
  }
}
