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

export async function withTransaction(handler) {
  if (!pool) {
    throw new Error("DATABASE_URL no configurada en app/.env");
  }
  if (typeof handler !== "function") {
    throw new Error("transaction_handler_invalid");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_rollbackError) {
      // Ignore rollback errors and rethrow the original one.
    }
    throw error;
  } finally {
    client.release();
  }
}
