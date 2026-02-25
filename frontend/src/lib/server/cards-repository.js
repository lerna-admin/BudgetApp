import crypto from "node:crypto";
import { query } from "./db";

const mapRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  bankId: row.bank_id,
  cardName: row.card_name,
  cardType: row.card_type,
  creditLimit: row.credit_limit ? Number(row.credit_limit) : null,
  availableCredit: row.available_credit ? Number(row.available_credit) : null,
  currency: row.currency,
  expiration: row.expiration,
  createdAt: row.created_at,
});

export async function listCards({ userId = null } = {}) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE user_id = $1";
  }
  const { rows } = await query(
    `SELECT id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, created_at
       FROM cards
       ${where}
       ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}

export async function createCard({ userId = null, bankId = null, cardName, cardType, creditLimit = null, availableCredit = null, currency = "COP", expiration = null }) {
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO cards(id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, created_at`,
    [id, userId, bankId, cardName, cardType, creditLimit, availableCredit, currency, expiration],
  );
  return mapRow(rows[0]);
}

export async function deleteCard(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }
  const { rows } = await query(
    `DELETE FROM cards WHERE ${where}
     RETURNING id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, created_at`,
    params,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}
