import { cookies } from "next/headers";
import { classifyTraffic } from "@/lib/analytics-context";

export const PROVIDER_SIGNAL_COOKIE = "servicios_provider_signal";

export async function currentTrafficType(attribution) {
  const cookieStore = await cookies();
  return classifyTraffic({ providerSignal: cookieStore.get(PROVIDER_SIGNAL_COOKIE)?.value === "1", attribution });
}

export function providerSignalCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}
