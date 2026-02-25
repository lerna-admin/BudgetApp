const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
let pool;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
}

function hasPool() {
  return Boolean(pool);
}

async function query(text, params = []) {
  if (!pool) {
    return { rows: [] };
  }
  return pool.query(text, params);
}

module.exports = {
  hasPool,
  query,
};
