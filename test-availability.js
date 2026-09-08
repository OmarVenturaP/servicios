import { getDb } from "./src/db/index.js";
import { sql } from "drizzle-orm";
import { getEffectiveUnitStatus } from "./src/db/availability.js";

async function run() {
  const db = getDb();
  const [dbNowResult] = await db.execute(sql`SELECT now() as n`);
  console.log("DB NOW():", dbNowResult[0].n);
  console.log("JS NOW():", new Date());
  
  // check getEffectiveUnitStatus
  const future = new Date(Date.now() + 1000 * 60 * 60); // +1 hour
  const past = new Date(Date.now() - 1000 * 60 * 60); // -1 hour
  
  console.log("Status available future:", getEffectiveUnitStatus({ active: true, state: "disponible", stateUntil: future }));
  console.log("Status available past:", getEffectiveUnitStatus({ active: true, state: "disponible", stateUntil: past }));
  process.exit(0);
}
run().catch(console.error);
