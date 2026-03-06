import crypto from "node:crypto";

import { query } from "./db";

const ALLOWED_FREQUENCIES = new Set(["weekly", "biweekly", "monthly", "yearly"]);

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    billName: row.bill_name,
    category: row.category || "general",
    amount: Number(row.amount || 0),
    currency: row.currency || "COP",
    frequency: row.frequency || "monthly",
    dueDay: row.due_day === null ? null : Number(row.due_day),
    notes: row.notes || "",
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function normalizeDueDay(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
    throw new Error("due_day_invalid");
  }
  return parsed;
}

function normalizeRecurringBillPayload(data) {
  const billName = String(data.billName || "").trim();
  if (!billName) {
    throw new Error("bill_name_invalid");
  }

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("bill_amount_invalid");
  }

  const frequency = String(data.frequency || "monthly").trim().toLowerCase();
  if (!ALLOWED_FREQUENCIES.has(frequency)) {
    throw new Error("bill_frequency_invalid");
  }

  const category = String(data.category || "general").trim() || "general";
  const currency = String(data.currency || "COP").trim() || "COP";

  return {
    userId: data.userId || null,
    billName,
    category,
    amount,
    currency,
    frequency,
    dueDay: normalizeDueDay(data.dueDay),
    notes: String(data.notes || "").slice(0, 600),
    isActive: data.isActive === undefined ? true : Boolean(data.isActive),
  };
}

export async function listRecurringBills({ userId = null, includeInactive = true } = {}) {
  const params = [];
  const clauses = [];
  if (userId) {
    params.push(userId);
    clauses.push(`user_id = $${params.length}`);
  }
  if (!includeInactive) {
    clauses.push("is_active = true");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT id, user_id, bill_name, category, amount, currency, frequency, due_day, notes, is_active, created_at, updated_at
       FROM recurring_bills
       ${where}
       ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}

export async function findRecurringBill(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `SELECT id, user_id, bill_name, category, amount, currency, frequency, due_day, notes, is_active, created_at, updated_at
       FROM recurring_bills
      WHERE ${where}
      LIMIT 1`,
    params,
  );
  return mapRow(rows[0]);
}

export async function createRecurringBill(data) {
  const normalized = normalizeRecurringBillPayload(data);
  const id = data.id || crypto.randomUUID();

  const { rows } = await query(
    `INSERT INTO recurring_bills (
       id, user_id, bill_name, category, amount, currency, frequency, due_day, notes, is_active
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
     )
     RETURNING id, user_id, bill_name, category, amount, currency, frequency, due_day, notes, is_active, created_at, updated_at`,
    [
      id,
      normalized.userId,
      normalized.billName,
      normalized.category,
      normalized.amount,
      normalized.currency,
      normalized.frequency,
      normalized.dueDay,
      normalized.notes,
      normalized.isActive,
    ],
  );

  return mapRow(rows[0]);
}

export async function updateRecurringBill(id, patch, { userId = null } = {}) {
  const current = await findRecurringBill(id, { userId });
  if (!current) {
    return null;
  }

  const normalized = normalizeRecurringBillPayload({
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
    normalized.billName,
    normalized.category,
    normalized.amount,
    normalized.currency,
    normalized.frequency,
    normalized.dueDay,
    normalized.notes,
    normalized.isActive,
  );

  const { rows } = await query(
    `UPDATE recurring_bills
        SET bill_name = $${params.length - 7},
            category = $${params.length - 6},
            amount = $${params.length - 5},
            currency = $${params.length - 4},
            frequency = $${params.length - 3},
            due_day = $${params.length - 2},
            notes = $${params.length - 1},
            is_active = $${params.length},
            updated_at = NOW()
      WHERE ${where}
      RETURNING id, user_id, bill_name, category, amount, currency, frequency, due_day, notes, is_active, created_at, updated_at`,
    params,
  );

  return mapRow(rows[0]);
}

export async function deleteRecurringBill(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `DELETE FROM recurring_bills
      WHERE ${where}
      RETURNING id, user_id, bill_name, category, amount, currency, frequency, due_day, notes, is_active, created_at, updated_at`,
    params,
  );

  return mapRow(rows[0]);
}
