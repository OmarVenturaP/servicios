import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Exercise the real handler with storage isolated: these tests never use MySQL or Cloudinary.
const calls = [];
globalThis.__adApiCalls = calls;
const storageModule = `data:text/javascript,${encodeURIComponent(`
  export class AdvertisementError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
  export async function getAdminAds() { globalThis.__adApiCalls.push('snapshot'); return { cities: [], ads: [] }; }
  export async function saveAdvertisement(...args) { globalThis.__adApiCalls.push(args); }
`)}`;
const source = (await readFile(new URL("../src/app/api/admin/publicidad/route.js", import.meta.url), "utf8"))
  .replace('"@/lib/admin-auth"', JSON.stringify(new URL("../src/lib/admin-auth.js", import.meta.url).href))
  .replace('"@/services/advertisements"', JSON.stringify(storageModule));
const { POST } = await import(`data:text/javascript,${encodeURIComponent(source)}`);

test("publicidad administrativa exige autorización antes de leer el cuerpo o consultar almacenamiento", async () => {
  const previous = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "test-ad-key";
  try {
    const response = await POST({ headers: new Headers(), formData() { throw new Error("No debe leerse"); } });
    assert.equal(response.status, 401);
    assert.equal(calls.length, 0);
    const form = new FormData(); form.set("action", "bootstrap");
    const ok = await POST(new Request("https://example.com/api/admin/publicidad", { method: "POST", headers: { "x-admin-key": "test-ad-key" }, body: form }));
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get("cache-control"), "no-store");
    assert.deepEqual(calls, ["snapshot"]);
    const bad = new FormData(); bad.set("action", "delete-everything");
    const invalid = await POST(new Request("https://example.com/api/admin/publicidad", { method: "POST", headers: { "x-admin-key": "test-ad-key" }, body: bad }));
    assert.equal(invalid.status, 400);
    assert.deepEqual(calls, ["snapshot"]);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = previous;
    delete globalThis.__adApiCalls;
  }
});
