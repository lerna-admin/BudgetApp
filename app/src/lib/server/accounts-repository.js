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

function normalizeAccountPayload({
  accountName,
  accountType,
  currency,
  balance,
  bankId = null,
  bankName = "",
  accountNumber = "",
} = {}) {
  const normalizedName = String(accountName || "").trim();
  if (!normalizedName) {
    throw new Error("account_name_invalid");
  }

  const normalizedBalance = Number(balance ?? 0);
  if (!Number.isFinite(normalizedBalance)) {
    throw new Error("account_balance_invalid");
  }

  return {
    accountName: normalizedName,
    accountType: String(accountType || "checking").trim() || "checking",
    currency: String(currency || "COP").trim() || "COP",
    balance: normalizedBalance,
    bankId: bankId || null,
    bankName: String(bankName || "").trim(),
    accountNumber: String(accountNumber || "").trim(),
  };
}

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

export async function findAccount(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `SELECT id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number, created_at
       FROM accounts
      WHERE ${where}
      LIMIT 1`,
    params,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createAccount({
  userId = null,
  accountName,
  accountType,
  currency,
  bankId = null,
  balance = 0,
  bankName = "",
  accountNumber = "",
} = {}) {
  const normalized = normalizeAccountPayload({
    accountName,
    accountType,
    currency,
    balance,
    bankId,
    bankName,
    accountNumber,
  });
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO accounts(id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number, created_at`,
    [
      id,
      userId,
      normalized.bankId,
      normalized.accountName,
      normalized.accountType,
      normalized.currency,
      normalized.balance,
      normalized.bankName || null,
      normalized.accountNumber || null,
    ],
  );
  return mapRow(rows[0]);
}

export async function updateAccount(id, patch, { userId = null } = {}) {
  const current = await findAccount(id, { userId });
  if (!current) {
    return null;
  }

  const normalized = normalizeAccountPayload({
    accountName: patch?.accountName ?? current.accountName,
    accountType: patch?.accountType ?? current.accountType,
    currency: patch?.currency ?? current.currency,
    balance: patch?.balance ?? current.balance,
    bankId: patch?.bankId ?? current.bankId,
    bankName: patch?.bankName ?? current.bankName,
    accountNumber: patch?.accountNumber ?? current.accountNumber,
  });

  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  params.push(
    normalized.bankId,
    normalized.accountName,
    normalized.accountType,
    normalized.currency,
    normalized.balance,
    normalized.bankName || null,
    normalized.accountNumber || null,
  );

  const { rows } = await query(
    `UPDATE accounts
        SET bank_id = $${params.length - 6},
            account_name = $${params.length - 5},
            account_type = $${params.length - 4},
            currency = $${params.length - 3},
            balance = $${params.length - 2},
            bank_name = $${params.length - 1},
            account_number = $${params.length}
      WHERE ${where}
      RETURNING id, user_id, bank_id, account_name, account_type, currency, balance, bank_name, account_number, created_at`,
    params,
  );

  return rows[0] ? mapRow(rows[0]) : null;
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
