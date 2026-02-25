import crypto from "node:crypto";
import { query } from "./db";

const mapRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  bankId: row.bank_id,
  accountName: row.account_name,
  accountType: row.account_type,
  currency: row.currency,
  balance: Number(row.balance || 0),
  bankName: row.bank_name || "",
  accountNumber: row.account_number || "",
  createdAt: row.created_at,
});

export async function listAccounts({ userId = null } = {}) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE user_id = $1";
  }
  const { rows } = await query(
    `SELECT id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number, created_at
       FROM accounts
       ${where}
       ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}

export async function createAccount({ userId = null, accountName, accountType, currency, bankId = null, balance = 0 }) {
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO accounts(id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number, created_at`,
    [id, userId, bankId, accountName, accountType || "checking", currency || "COP", balance, null, null],
  );
  return mapRow(rows[0]);
}

export async function deleteAccount(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }
  const { rows } = await query(
    `DELETE FROM accounts WHERE ${where}
     RETURNING id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number, created_at`,
    params,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}
