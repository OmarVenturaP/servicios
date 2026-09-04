import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getMySqlConnectionOptions } from "./connection";
import * as schema from "./schema";

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...getMySqlConnectionOptions(),
      connectionLimit: 5,
      enableKeepAlive: true,
    });
  }

  return pool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: "default" });
}
