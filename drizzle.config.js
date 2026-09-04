import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getMySqlConnectionOptions } from "./src/db/connection.js";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: getMySqlConnectionOptions(),
});
