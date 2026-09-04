import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "servicios_session_id";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getOrCreateAnonymousSessionId() {
  const cookieStore = await cookies();
  const currentSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (currentSessionId && UUID_PATTERN.test(currentSessionId)) {
    return currentSessionId;
  }

  const sessionId = randomUUID();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return sessionId;
}
