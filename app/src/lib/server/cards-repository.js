import crypto from "node:crypto";
import { query } from "./db";

const mapRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  bankId: row.bank_id,
  cardName: row.card_name,
  cardType: row.card_type,
  creditLimit: row.credit_limit === null || row.credit_limit === undefined ? null : Number(row.credit_limit),
  availableCredit: row.available_credit === null || row.available_credit === undefined ? null : Number(row.available_credit),
  currency: row.currency,
  expiration: row.expiration,
  bankName: row.bank_name || "",
  last4: row.last4 || "",
  createdAt: row.created_at,
});

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

function normalizeCardPayload({
  cardName,
  cardType,
  creditLimit,
  availableCredit,
  currency,
  expiration,
  bankId = null,
  bankName = "",
  last4 = "",
} = {}) {
  const normalizedName = String(cardName || "").trim();
  if (!normalizedName) {
    throw new Error("card_name_invalid");
  }

  const normalizedCreditLimit = normalizeNullableAmount(creditLimit, "card_credit_limit_invalid");
  const normalizedAvailableCredit = normalizeNullableAmount(availableCredit, "card_available_credit_invalid");
  if (
    normalizedCreditLimit !== null &&
    normalizedAvailableCredit !== null &&
    normalizedAvailableCredit > normalizedCreditLimit
  ) {
    throw new Error("card_available_credit_invalid");
  }

  const normalizedLast4 = String(last4 || "").trim();
  if (normalizedLast4 && !/^\d{4}$/.test(normalizedLast4)) {
    throw new Error("card_last4_invalid");
  }

  return {
    cardName: normalizedName,
    cardType: String(cardType || "debit").trim() || "debit",
    creditLimit: normalizedCreditLimit,
    availableCredit: normalizedAvailableCredit,
    currency: String(currency || "COP").trim() || "COP",
    expiration: expiration || null,
    bankId: bankId || null,
    bankName: String(bankName || "").trim(),
    last4: normalizedLast4,
  };
}

export async function listCards({ userId = null } = {}) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE user_id = $1";
  }
  const { rows } = await query(
    `SELECT id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, bank_name, last4, created_at
       FROM cards
       ${where}
       ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}

export async function findCard(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `SELECT id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, bank_name, last4, created_at
       FROM cards
      WHERE ${where}
      LIMIT 1`,
    params,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createCard({
  userId = null,
  bankId = null,
  cardName,
  cardType,
  creditLimit = null,
  availableCredit = null,
  currency = "COP",
  expiration = null,
  bankName = "",
  last4 = "",
} = {}) {
  const normalized = normalizeCardPayload({
    cardName,
    cardType,
    creditLimit,
    availableCredit,
    currency,
    expiration,
    bankId,
    bankName,
    last4,
  });
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO cards(id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, bank_name, last4)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, bank_name, last4, created_at`,
    [
      id,
      userId,
      normalized.bankId,
      normalized.cardName,
      normalized.cardType,
      normalized.creditLimit,
      normalized.availableCredit,
      normalized.currency,
      normalized.expiration,
      normalized.bankName || null,
      normalized.last4 || null,
    ],
  );
  return mapRow(rows[0]);
}

export async function updateCard(id, patch, { userId = null } = {}) {
  const current = await findCard(id, { userId });
  if (!current) {
    return null;
  }

  const normalized = normalizeCardPayload({
    cardName: patch?.cardName ?? current.cardName,
    cardType: patch?.cardType ?? current.cardType,
    creditLimit: patch?.creditLimit ?? current.creditLimit,
    availableCredit: patch?.availableCredit ?? current.availableCredit,
    currency: patch?.currency ?? current.currency,
    expiration: patch?.expiration ?? current.expiration,
    bankId: patch?.bankId ?? current.bankId,
    bankName: patch?.bankName ?? current.bankName,
    last4: patch?.last4 ?? current.last4,
  });

  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  params.push(
    normalized.bankId,
    normalized.cardName,
    normalized.cardType,
    normalized.creditLimit,
    normalized.availableCredit,
    normalized.currency,
    normalized.expiration,
    normalized.bankName || null,
    normalized.last4 || null,
  );

  const { rows } = await query(
    `UPDATE cards
        SET bank_id = $${params.length - 8},
            card_name = $${params.length - 7},
            card_type = $${params.length - 6},
            credit_limit = $${params.length - 5},
            available_credit = $${params.length - 4},
            currency = $${params.length - 3},
            expiration = $${params.length - 2},
            bank_name = $${params.length - 1},
            last4 = $${params.length}
      WHERE ${where}
      RETURNING id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, bank_name, last4, created_at`,
    params,
  );

  return rows[0] ? mapRow(rows[0]) : null;
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
     RETURNING id, user_id, bank_id, card_name, card_type, credit_limit, available_credit, currency, expiration, bank_name, last4, created_at`,
    params,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}
