import crypto from "node:crypto";

import { query } from "./db";

function normalizeContact(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

const mapRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  contact: row.contact,
  createdAt: row.created_at,
});

export async function listFriends({ userId }) {
  if (!userId) return [];
  const { rows } = await query(
    `SELECT id, user_id, name, contact, created_at
       FROM friends
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map(mapRow);
}

export async function createFriend({ userId, name, contact }) {
  if (!userId) {
    throw new Error("user_required");
  }
  const normalizedContact = normalizeContact(contact);
  if (!normalizedContact) {
    throw new Error("contact_invalid");
  }
  const { rows: existing } = await query(
    `SELECT id, user_id, name, contact, created_at
       FROM friends
      WHERE user_id = $1 AND contact_normalized = $2
      LIMIT 1`,
    [userId, normalizedContact],
  );
  if (existing[0]) {
    return { friend: mapRow(existing[0]), existed: true };
  }

  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO friends(id, user_id, name, contact, contact_normalized)
     VALUES($1, $2, $3, $4, $5)
     RETURNING id, user_id, name, contact, created_at`,
    [id, userId, name, contact, normalizedContact],
  );
  return { friend: mapRow(rows[0]), existed: false };
}
