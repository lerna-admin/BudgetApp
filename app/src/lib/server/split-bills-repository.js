import crypto from "node:crypto";

import { query } from "./db";

const mapRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  currency: row.currency,
  payerType: row.payer_type,
  payerFriendId: row.payer_friend_id,
  participantFriendIds: row.participant_friend_ids || [],
  items: row.items_json || [],
  settlements: row.settlements_json || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listSplitBills({ userId }) {
  if (!userId) return [];
  const { rows } = await query(
    `SELECT id, user_id, title, currency, payer_type, payer_friend_id,
            participant_friend_ids, items_json, settlements_json, created_at, updated_at
       FROM split_bills
      WHERE user_id = $1
      ORDER BY updated_at DESC`,
    [userId],
  );
  return rows.map(mapRow);
}

export async function getSplitBill(id, { userId }) {
  if (!id || !userId) return null;
  const { rows } = await query(
    `SELECT id, user_id, title, currency, payer_type, payer_friend_id,
            participant_friend_ids, items_json, settlements_json, created_at, updated_at
       FROM split_bills
      WHERE id = $1 AND user_id = $2
      LIMIT 1`,
    [id, userId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function splitBillTitleExists({ userId, title, excludeId = null }) {
  if (!userId || !title) return false;
  if (excludeId) {
    const { rows } = await query(
      `SELECT 1
         FROM split_bills
        WHERE user_id = $1 AND LOWER(title) = LOWER($2) AND id <> $3
        LIMIT 1`,
      [userId, title, excludeId],
    );
    return rows.length > 0;
  }
  const { rows } = await query(
    `SELECT 1
       FROM split_bills
      WHERE user_id = $1 AND LOWER(title) = LOWER($2)
      LIMIT 1`,
    [userId, title],
  );
  return rows.length > 0;
}

export async function createSplitBill({
  userId,
  title,
  currency,
  payerType = "user",
  payerFriendId = null,
  participantFriendIds = [],
  items = [],
  settlements = [],
}) {
  const itemsJson = JSON.stringify(Array.isArray(items) ? items : []);
  const settlementsJson = JSON.stringify(Array.isArray(settlements) ? settlements : []);
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO split_bills(
        id, user_id, title, currency, payer_type, payer_friend_id,
        participant_friend_ids, items_json, settlements_json, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, user_id, title, currency, payer_type, payer_friend_id,
                participant_friend_ids, items_json, settlements_json, created_at, updated_at`,
    [id, userId, title, currency, payerType, payerFriendId, participantFriendIds, itemsJson, settlementsJson],
  );
  return mapRow(rows[0]);
}

export async function updateSplitBill(
  id,
  {
    userId,
    title,
    currency,
    payerType = "user",
    payerFriendId = null,
    participantFriendIds = [],
    items = [],
    settlements = [],
  },
) {
  const itemsJson = JSON.stringify(Array.isArray(items) ? items : []);
  const settlementsJson = JSON.stringify(Array.isArray(settlements) ? settlements : []);
  const { rows } = await query(
    `UPDATE split_bills
        SET title = $1,
            currency = $2,
            payer_type = $3,
            payer_friend_id = $4,
            participant_friend_ids = $5,
            items_json = $6,
            settlements_json = $7,
            updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING id, user_id, title, currency, payer_type, payer_friend_id,
                participant_friend_ids, items_json, settlements_json, created_at, updated_at`,
    [title, currency, payerType, payerFriendId, participantFriendIds, itemsJson, settlementsJson, id, userId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteSplitBill(id, { userId }) {
  if (!id || !userId) return false;
  const result = await query(
    `DELETE FROM split_bills
      WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rowCount > 0;
}
