import { createHash } from "node:crypto";

export function hashUnitToken(token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 512) {
    return null;
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}
