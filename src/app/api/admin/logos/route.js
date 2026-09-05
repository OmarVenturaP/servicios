import { isAdminAuthorized } from "@/lib/admin-auth";
import { AdminError, getAdminSnapshot } from "@/services/admin";
import { deleteServiceLogo, uploadServiceLogo } from "@/services/service-logos";

export const runtime = "nodejs";

function errorResponse(error) {
  if (error instanceof AdminError) {
    return Response.json({ success: false, code: error.code, error: error.message }, { status: error.status });
  }
  console.error("No se pudo completar la operación administrativa del logo");
  return Response.json({ success: false, error: "No se pudo completar la operación del logo." }, { status: 500 });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    if (!isAdminAuthorized(formData.get("accessKey"))) {
      return Response.json({ success: false, error: "Clave de acceso incorrecta." }, { status: 401 });
    }
    await uploadServiceLogo(formData.get("serviceId"), formData.get("logo"));
    return Response.json({ success: true, data: await getAdminSnapshot() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    if (!isAdminAuthorized(body.accessKey)) {
      return Response.json({ success: false, error: "Clave de acceso incorrecta." }, { status: 401 });
    }
    await deleteServiceLogo(body.serviceId);
    return Response.json({ success: true, data: await getAdminSnapshot() });
  } catch (error) {
    return errorResponse(error);
  }
}
