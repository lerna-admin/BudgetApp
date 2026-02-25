const db = require("../db/pool");
const { v4: uuidv4 } = require("uuid");

const SAMPLE_ACHIEVEMENTS = [
  {
    id: "achieve-tilbury",
    slug: "tilbury-streak",
    title: "Tilbury streak",
    description: "Cierra 3 presupuestos consecutivos en draft",
    category: "progreso",
  },
];

const SAMPLE_LOGS = [
  {
    id: "log-tilbury-1",
    type: "budget_closed",
    details_json: { period: "2025-12", status: "draft" },
  },
];

async function listAchievements(userId) {
  if (!db.hasPool()) {
    return SAMPLE_ACHIEVEMENTS;
  }
  const { rows } = await db.query(
    `SELECT a.id, a.slug, a.title, a.description, a.category, pa.awarded_at
     FROM achievements a
     LEFT JOIN profile_achievements pa ON pa.achievement_id = a.id AND pa.user_id = $1`,
    [userId],
  );
  return rows;
}

async function listLogs(userId) {
  if (!db.hasPool()) {
    return SAMPLE_LOGS;
  }
  const { rows } = await db.query(
    `SELECT id, type, details_json, created_at FROM gamification_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId],
  );
  return rows;
}

module.exports = {
  listAchievements,
  listLogs,
};
