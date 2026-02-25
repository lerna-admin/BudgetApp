const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL not set; skipping migrations.");
  process.exit(0);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

function readMigrations() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  return files.map((file) => ({
    name: file,
    sql: fs.readFileSync(path.join(migrationsDir, file), "utf8"),
  }));
}

async function run() {
  const migrations = readMigrations();
  if (migrations.length === 0) {
    console.info("No migrations to run.");
    await pool.end();
    return;
  }

  console.info(`Running ${migrations.length} migration(s)...`);
  for (const migration of migrations) {
    console.info(`Applying ${migration.name}...`);
    await pool.query(migration.sql);
  }
  await pool.end();
  console.info("Migrations complete.");
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
