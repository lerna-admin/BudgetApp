import crypto from "node:crypto";
import { query } from "./db";

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    movementType: row.movement_type,
    date: row.date?.toISOString().slice(0, 10),
    detail: row.detail,
    notes: row.notes || "",
    amount: Number(row.amount),
    category: row.category || "",
    subcategory: row.subcategory || "",
    edge: row.edge || "",
    method: row.method,
    bank: row.bank || "",
    card: row.card || "",
    currency: row.currency,
    tags: row.tags || [],
    attachments: row.attachments || [],
    transferFrom: row.transfer_from || "",
    transferTo: row.transfer_to || "",
    destinationAccountId: row.destination_account_id || "",
    destinationNote: row.destination_note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listExpenses({ userId = null, limit = 500, offset = 0 } = {}) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE user_id = $1";
  }
  params.push(limit);
  params.push(offset);

  const { rows } = await query(
    `SELECT id, movement_type, date, detail, notes, amount, category, subcategory, edge,
            method, bank, card, currency, tags, attachments, transfer_from, transfer_to,
            destination_account_id, destination_note,
            created_at, updated_at
       FROM expenses
       ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT $${where ? 2 : 1}
       OFFSET $${where ? 3 : 2}`,
    params,
  );

  return rows.map(mapRow);
}

export async function findExpense(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }
  const { rows } = await query(
    `SELECT id, movement_type, date, detail, notes, amount, category, subcategory, edge,
            method, bank, card, currency, tags, attachments, transfer_from, transfer_to,
            destination_account_id, destination_note,
            created_at, updated_at
       FROM expenses
       WHERE ${where}
       LIMIT 1`,
    params,
  );
  return mapRow(rows[0]);
}

export async function createExpense(data) {
  const id = data.id || crypto.randomUUID();
  const {
    userId = null,
    movementType,
    date,
    detail,
    notes = "",
    amount,
    category = "",
    subcategory = "",
    edge = "",
    method,
    bank = "",
    card = "",
    currency = "COP",
    tags = [],
    attachments = [],
    transferFrom = "",
    transferTo = "",
    destinationAccountId = null,
    destinationNote = "",
  } = data;

  const { rows } = await query(
    `INSERT INTO expenses (
        id, user_id, movement_type, date, detail, notes, amount,
        category, subcategory, edge, method, bank, card, currency,
        tags, attachments, transfer_from, transfer_to, destination_account_id, destination_note
     ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20
     )
     RETURNING id, movement_type, date, detail, notes, amount, category, subcategory, edge,
               method, bank, card, currency, tags, attachments, transfer_from, transfer_to,
               destination_account_id, destination_note,
               created_at, updated_at`,
    [
      id,
      userId,
      movementType,
      date,
      detail,
      notes,
      amount,
      category,
      subcategory,
      edge,
      method,
      bank,
      card,
      currency,
      tags,
      attachments,
      transferFrom,
      transferTo,
      destinationAccountId || null,
      destinationNote,
    ],
  );

  return mapRow(rows[0]);
}

export async function updateExpense(id, patch, { userId = null } = {}) {
  const existing = await findExpense(id, { userId });
  if (!existing) return null;

  const merged = {
    ...existing,
    ...patch,
  };

  const { rows } = await query(
    `UPDATE expenses
        SET movement_type = $2,
            date = $3,
            detail = $4,
            notes = $5,
            amount = $6,
            category = $7,
            subcategory = $8,
            edge = $9,
            method = $10,
            bank = $11,
            card = $12,
            currency = $13,
            tags = $14,
            attachments = $15,
            transfer_from = $16,
            transfer_to = $17,
            destination_account_id = $18,
            destination_note = $19,
            updated_at = NOW()
      WHERE id = $1
      RETURNING id, movement_type, date, detail, notes, amount, category, subcategory, edge,
                method, bank, card, currency, tags, attachments, transfer_from, transfer_to,
                destination_account_id, destination_note,
                created_at, updated_at`,
    [
      id,
      merged.movementType,
      merged.date,
      merged.detail,
      merged.notes,
      merged.amount,
      merged.category,
      merged.subcategory,
      merged.edge,
      merged.method,
      merged.bank,
      merged.card,
      merged.currency,
      merged.tags,
      merged.attachments,
      merged.transferFrom,
      merged.transferTo,
      merged.destinationAccountId || null,
      merged.destinationNote,
    ],
  );

  return mapRow(rows[0]);
}

export async function deleteExpense(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `DELETE FROM expenses WHERE ${where}
     RETURNING id, movement_type, date, detail, notes, amount, category, subcategory, edge,
               method, bank, card, currency, tags, attachments, transfer_from, transfer_to,
               created_at, updated_at`,
    params,
  );

  return mapRow(rows[0]);
}

export async function listTags() {
  const { rows } = await query(
    `SELECT tag
       FROM (
         SELECT DISTINCT TRIM(tag) AS tag, LOWER(TRIM(tag)) AS tag_lower
         FROM (
           SELECT UNNEST(tags) AS tag
           FROM expenses
           WHERE tags IS NOT NULL
         ) t
         WHERE TRIM(tag) <> ''
       ) tags
      ORDER BY tag_lower`,
  );
  return rows.map((r) => r.tag);
}
