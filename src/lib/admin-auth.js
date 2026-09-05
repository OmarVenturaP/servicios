import { createHash, timingSafeEqual } from "node:crypto";

function digest(value) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isAdminAuthorized(accessKey) {
  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  if (!configuredKey || typeof accessKey !== "string" || !accessKey) return false;
  return timingSafeEqual(digest(accessKey), digest(configuredKey));
}
