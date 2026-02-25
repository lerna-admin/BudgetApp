const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const sqlPath = path.join(__dirname, "..", "..", "migrations", "001_schema.sql");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL not set; skipping migrations.");
  process.exit(0);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function run() {
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.info("Running migrations...");
  await pool.query(sql);
  await pool.end();
  console.info("Migrations complete.");
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
