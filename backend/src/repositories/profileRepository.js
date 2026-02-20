const db = require("../db/pool");
const { v4: uuidv4 } = require("uuid");

const SAMPLE_PROFILES = [
  {
    id: "tilbury-1",
    slug: "mark-tilbury",
    name: "Mark Tilbury Inspired",
    objective: "Automatizar ahorros e inversiones según el método 25/15/50/10",
    tags: ["inversión", "ahorro", "mentalidad 1%"],
    primary_goal: "Incrementar la reserva de ahorro mensual",
  },
  {
    id: "growth-journey",
    slug: "growth-journey",
    name: "Crecimiento de patrimonio",
    objective: "Incrementar el valor neto mensual con acciones e ingresos múltiples",
    tags: ["invierte", "multiples ingresos"],
    primary_goal: "Crear tracción en inversiones pequeñas",
  },
];

const SAMPLE_OBJECTIVES = [
  {
    id: "obj-1",
    profile_id: "tilbury-1",
    metric: "savings_percent",
    target_value: 25,
    frequency: "monthly",
  },
  {
    id: "obj-2",
    profile_id: "tilbury-1",
    metric: "investment_contribution",
    target_value: 15,
    frequency: "monthly",
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

async function findObjectivesByProfile(profileId) {
  if (!db.hasPool()) {
    return SAMPLE_OBJECTIVES.filter((objective) => objective.profile_id === profileId);
  }
  const { rows } = await db.query(
    "SELECT id, profile_id, metric, target_value, frequency FROM profile_objectives WHERE profile_id = $1",
    [profileId],
  );
  return rows;
}

async function createProfileSelection({ userId, profileId, notes }) {
  if (!db.hasPool()) {
    return { id: uuidv4(), user_id: userId, profile_id: profileId, selected_at: new Date().toISOString(), active: true, notes };
  }

  await db.query("UPDATE profile_selections SET active = false WHERE user_id = $1", [userId]);
  const id = uuidv4();
  await db.query(
    "INSERT INTO profile_selections(id, user_id, profile_id, active, notes) VALUES($1,$2,$3,$4,$5)",
    [id, userId, profileId, true, notes ?? null],
  );
  return { id, user_id: userId, profile_id: profileId, active: true, notes };
}

async function findActiveSelection(userId) {
  if (!db.hasPool()) {
    return null;
  }
  const { rows } = await db.query(
    "SELECT id, user_id, profile_id, selected_at, active, notes FROM profile_selections WHERE user_id = $1 AND active = true ORDER BY selected_at DESC LIMIT 1",
    [userId],
  );
  return rows[0] ?? null;
}

module.exports = {
  findAllProfiles,
  findObjectivesByProfile,
  createProfileSelection,
  findActiveSelection,
};
