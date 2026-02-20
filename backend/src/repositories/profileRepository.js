const db = require("../db/pool");

const SAMPLE_PROFILES = [
  {
    id: "tilbury-1",
    name: "Mark Tilbury Inspired",
    objective: "Automatizar ahorros e inversiones según el método 25/15/50/10",
    tags: ["inversión", "ahorro", "mentalidad 1%"],
  },
  {
    id: "growth-journey",
    name: "Crecimiento de patrimonio",
    objective: "Incrementar el valor neto mensual con acciones e ingresos multiples",
    tags: ["invierte", "multiples ingresos"],
  },
];

async function findAllProfiles() {
  if (!db.hasPool()) {
    return SAMPLE_PROFILES;
  }

  const { rows } = await db.query(
    "SELECT id, name, objective, tags FROM profiles ORDER BY updated_at DESC",
  );

  if (!rows.length) {
    return SAMPLE_PROFILES;
  }

  return rows;
}

module.exports = {
  findAllProfiles,
};
