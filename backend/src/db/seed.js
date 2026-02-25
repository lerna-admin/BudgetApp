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

  const profiles = [
    {
      slug: "mark-tilbury",
      name: "Mark Tilbury Inspired",
      description: "Curaduria de ahorro e inversion 25/15/50/10",
      objective: "Automatizar flujos de ahorro e inversion",
      primaryGoal: "Incrementar la reserva e inversiones mensuales",
      tags: ["ahorro", "inversion", "mentalidad"],
      objectives: [
        { metric: "savings_percent", targetValue: 25, frequency: "monthly" },
        { metric: "investment_percent", targetValue: 15, frequency: "monthly" },
      ],
    },
    {
      slug: "growth-journey",
      name: "Crecimiento de Patrimonio",
      description: "Perfil para construir habitos de crecimiento patrimonial",
      objective: "Aumentar valor neto con disciplina mensual",
      primaryGoal: "Ahorro constante y recorte de gastos variables",
      tags: ["crecimiento", "disciplina", "patrimonio"],
      objectives: [
        { metric: "networth_growth", targetValue: 5, frequency: "monthly" },
        { metric: "expense_reduction", targetValue: 10, frequency: "monthly" },
      ],
    },
    {
      slug: "cashflow-starter",
      name: "Control de Flujo Inicial",
      description: "Perfil para usuarios que inician control financiero",
      objective: "Evitar sobregiros y construir base de ahorro",
      primaryGoal: "Cerrar cada mes con saldo positivo",
      tags: ["flujo", "control", "starter"],
      objectives: [
        { metric: "positive_balance_months", targetValue: 1, frequency: "monthly" },
        { metric: "emergency_fund_contribution", targetValue: 200000, frequency: "monthly" },
      ],
    },
  ];

  for (const profile of profiles) {
    await client.query(
      `INSERT INTO profiles(id,slug,name,description,objective,primary_goal,tags)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(slug) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           objective = EXCLUDED.objective,
           primary_goal = EXCLUDED.primary_goal,
           tags = EXCLUDED.tags`,
      [
        uuidv4(),
        profile.slug,
        profile.name,
        profile.description,
        profile.objective,
        profile.primaryGoal,
        profile.tags,
      ],
    );

    const profileQuery = await client.query(
      `SELECT id FROM profiles WHERE slug = $1 LIMIT 1`,
      [profile.slug],
    );
    const profileId = profileQuery.rows[0]?.id;
    if (!profileId) {
      continue;
    }

    for (const objective of profile.objectives) {
      await client.query(
        `INSERT INTO profile_objectives(id, profile_id, metric, target_value, frequency)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT(id) DO NOTHING`,
        [uuidv4(), profileId, objective.metric, objective.targetValue, objective.frequency],
      );
    }
  }

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
