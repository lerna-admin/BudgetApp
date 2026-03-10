import crypto from "node:crypto";

import { query } from "./db";

const ALLOWED_STATUSES = new Set(["active", "paused", "completed", "cancelled"]);

function toIsoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    goalName: row.goal_name,
    targetAmount: Number(row.target_amount || 0),
    currentAmount: Number(row.current_amount || 0),
    monthlyTarget: row.monthly_target === null ? null : Number(row.monthly_target),
    currency: row.currency || "COP",
    targetDate: toIsoDate(row.target_date),
    notes: row.notes || "",
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function normalizeNullableAmount(value, errorCode) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(errorCode);
  }
  return parsed;
}

function normalizeSavingsGoalPayload(data) {
  const goalName = String(data.goalName || "").trim();
  if (!goalName) {
    throw new Error("goal_name_invalid");
  }

  const targetAmount = Number(data.targetAmount);
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    throw new Error("goal_target_amount_invalid");
  }

  const currentAmount = normalizeNullableAmount(data.currentAmount, "goal_current_amount_invalid") ?? 0;
  if (currentAmount > targetAmount) {
    throw new Error("goal_current_exceeds_target");
  }

  const monthlyTarget = normalizeNullableAmount(data.monthlyTarget, "goal_monthly_target_invalid");
  const currency = String(data.currency || "COP").trim() || "COP";

  const status = String(data.status || "active").trim().toLowerCase();
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error("goal_status_invalid");
  }

  return {
    userId: data.userId || null,
    goalName,
    targetAmount,
    currentAmount,
    monthlyTarget,
    currency,
    targetDate: data.targetDate || null,
    notes: String(data.notes || "").slice(0, 600),
    status,
  };
}

export async function listSavingsGoals({ userId = null, includeCompleted = true } = {}) {
  const params = [];
  const clauses = [];
  if (userId) {
    params.push(userId);
    clauses.push(`user_id = $${params.length}`);
  }
  if (!includeCompleted) {
    clauses.push("status NOT IN ('completed', 'cancelled')");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT id, user_id, goal_name, target_amount, current_amount, monthly_target, currency, target_date, notes, status, created_at, updated_at
       FROM savings_goals
       ${where}
       ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}

export async function findSavingsGoal(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `SELECT id, user_id, goal_name, target_amount, current_amount, monthly_target, currency, target_date, notes, status, created_at, updated_at
       FROM savings_goals
      WHERE ${where}
      LIMIT 1`,
    params,
  );
  return mapRow(rows[0]);
}

export async function createSavingsGoal(data) {
  const normalized = normalizeSavingsGoalPayload(data);
  const id = data.id || crypto.randomUUID();

  const { rows } = await query(
    `INSERT INTO savings_goals (
       id, user_id, goal_name, target_amount, current_amount, monthly_target, currency, target_date, notes, status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
     )
     RETURNING id, user_id, goal_name, target_amount, current_amount, monthly_target, currency, target_date, notes, status, created_at, updated_at`,
    [
      id,
      normalized.userId,
      normalized.goalName,
      normalized.targetAmount,
      normalized.currentAmount,
      normalized.monthlyTarget,
      normalized.currency,
      normalized.targetDate,
      normalized.notes,
      normalized.status,
    ],
  );

  return mapRow(rows[0]);
}

export async function updateSavingsGoal(id, patch, { userId = null } = {}) {
  const current = await findSavingsGoal(id, { userId });
  if (!current) {
    return null;
  }

  const normalized = normalizeSavingsGoalPayload({
    ...current,
    ...patch,
  });

  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += ` AND user_id = $${params.length}`;
  }

  params.push(
    normalized.goalName,
    normalized.targetAmount,
    normalized.currentAmount,
    normalized.monthlyTarget,
    normalized.currency,
    normalized.targetDate,
    normalized.notes,
    normalized.status,
  );

  const { rows } = await query(
    `UPDATE savings_goals
        SET goal_name = $${params.length - 7},
            target_amount = $${params.length - 6},
            current_amount = $${params.length - 5},
            monthly_target = $${params.length - 4},
            currency = $${params.length - 3},
            target_date = $${params.length - 2},
            notes = $${params.length - 1},
            status = $${params.length},
            updated_at = NOW()
      WHERE ${where}
      RETURNING id, user_id, goal_name, target_amount, current_amount, monthly_target, currency, target_date, notes, status, created_at, updated_at`,
    params,
  );

  return mapRow(rows[0]);
}

export async function deleteSavingsGoal(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `DELETE FROM savings_goals
      WHERE ${where}
      RETURNING id, user_id, goal_name, target_amount, current_amount, monthly_target, currency, target_date, notes, status, created_at, updated_at`,
    params,
  );

  return mapRow(rows[0]);
}
