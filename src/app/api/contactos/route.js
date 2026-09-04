import { getOrCreateAnonymousSessionId } from "@/lib/session";
import { ContactError, registerContact } from "@/services/contacts";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const sessionId = await getOrCreateAnonymousSessionId();
    const result = await registerContact({
      citySlug: typeof body.citySlug === "string" ? body.citySlug.trim() : "",
      serviceSlug: typeof body.serviceSlug === "string" ? body.serviceSlug.trim() : "",
      channel: body.channel,
      priceShown: body.priceShown,
      sessionId,
    });

    return Response.json({ success: true, url: result.url });
  } catch (error) {
    if (error instanceof ContactError) {
      return Response.json(
        { success: false, code: error.code, error: error.message },
        { status: error.status },
      );
    }

    console.error("No se pudo registrar el contacto", error);
    return Response.json(
      { success: false, error: "No se pudo iniciar el contacto" },
      { status: 500 },
    );
  }
}
