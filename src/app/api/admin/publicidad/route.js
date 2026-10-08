import { isAdminAuthorized } from "@/lib/admin-auth";
import { AdvertisementError, getAdminAds, saveAdvertisement } from "@/services/advertisements";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function POST(request) {
  // Authorization precedes multipart parsing and all storage operations.
  if (!isAdminAuthorized(request.headers.get("x-admin-key"))) {
    return Response.json({ success: false, error: "Clave de acceso incorrecta." }, { status: 401, headers });
  }
  try {
    if (Number(request.headers.get("content-length")) > 4 * 1024 * 1024) throw new AdvertisementError("La imagen es demasiado grande.", 413);
    const form = await request.formData();
    const action = form.get("action");
    if (action === "save") {
      await saveAdvertisement(form.get("id"), {
        cityId: form.get("cityId"), title: form.get("title"), destinationUrl: form.get("destinationUrl"),
        order: form.get("order"), active: form.get("active") === "on", startDate: form.get("startDate"), endDate: form.get("endDate"),
      }, form.get("image"));
    } else if (action !== "bootstrap") throw new AdvertisementError("La operación no es válida.");
    return Response.json({ success: true, data: await getAdminAds() }, { headers });
  } catch (error) {
    if (error instanceof AdvertisementError) return Response.json({ success: false, error: error.message }, { status: error.status, headers });
    console.error("No se pudo completar la operación de publicidad.");
    return Response.json({ success: false, error: "No se pudo completar la operación. Comprueba que la tabla de anuncios esté creada e intenta nuevamente." }, { status: 500, headers });
  }
}
