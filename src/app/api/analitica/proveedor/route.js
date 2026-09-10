import { PROVIDER_SIGNAL_COOKIE, providerSignalCookieOptions } from "@/lib/analytics-server";
import { resolveUnitPanel } from "@/services/units";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const unit = await resolveUnitPanel(body.token);
    if (!unit) return Response.json({ success: false }, { status: 404 });
    const response = NextResponse.json({ success: true });
    response.cookies.set(PROVIDER_SIGNAL_COOKIE, "1", providerSignalCookieOptions());
    return response;
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }
}
import { NextResponse } from "next/server";
