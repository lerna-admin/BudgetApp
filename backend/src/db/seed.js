const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("DATABASE_URL not set; skipping seeds.");
  process.exit(0);
}

const client = new Client({
  connectionString,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function seed() {
  await client.connect();

  const colombiaId = "CO";
  await client.query(
    `INSERT INTO countries(code,name,currency,timezone,default_language,banking_provider)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(code) DO NOTHING`,
    [colombiaId, "Colombia", "COP", "America/Bogota", "es-CO", "Belvo"]
  );

  const bankId = uuidv4();
  await client.query(
    `INSERT INTO banks(id,name,institution_code,country_code,provider)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(id) DO NOTHING`,
    [bankId, "Bancolombia", "bancolombia", colombiaId, "Belvo"]
  );

  const profileId = uuidv4();
  await client.query(
    `INSERT INTO profiles(id,slug,name,description,objective,primary_goal,tags)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT(slug) DO NOTHING`,
    [profileId, "mark-tilbury", "Mark Tilbury Inspired", "Curaduría de ahorro e inversión 25/15/50/10", "Automatizar flujos de ahorro e inversión", "Incrementar la reserva e inversiones mensuales", ["ahorro", "inversión", "mentalidad"]]
  );

  const achId = uuidv4();
  await client.query(
    `INSERT INTO achievements(id,slug,title,description,category)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(slug) DO NOTHING`,
    [achId, "tilbury-streak", "Tilbury streak", "Mantén 3 presupuestos cerrados en draft", "progreso"]
  );

  await client.end();
  console.info("Seed data inserted.");
}

seed().catch((error) => {
  console.error("Seeding failed", error);
  process.exit(1);
});
