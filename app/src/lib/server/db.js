import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool;
if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
}

export function hasPool() {
  return Boolean(pool);
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error("DATABASE_URL no configurada en app/.env");
  }

  return pool.query(text, params);
}
