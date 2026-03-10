import crypto from "node:crypto";

import { query } from "./db";

export const DEFAULT_DEBT_INTEREST_EA = 23;
const DEFAULT_DEBT_PAYOFF_MONTHS = 36;

const DEBT_SELECT = `
SELECT d.id,
       d.user_id,
       d.bank_id,
       d.card_id,
       d.account_id,
       d.debt_name,
       d.debt_type,
       d.principal,
       d.interest_rate,
       d.interest_rate_ea,
       d.minimum_payment,
       d.currency,
       d.status,
       d.due_date,
       d.notes,
       d.created_at,
       d.updated_at,
       a.account_name,
       a.account_number,
       c.card_name,
       c.last4
  FROM debts d
  LEFT JOIN accounts a ON a.id = d.account_id
  LEFT JOIN cards c ON c.id = d.card_id
`;

function toIsoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }
  return value;
}

function parseCategories(value) {
  const parsed = parseJson(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

function parseTotals(value) {
  const parsed = parseJson(value, {});
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return {};
  }
  return parsed;
}

function toMonthlyRate(interestRateEa) {
  const ea = Number(interestRateEa || 0);
  if (!Number.isFinite(ea) || ea < 0) return null;
  if (ea === 0) return 0;
  return Math.pow(1 + ea / 100, 1 / 12) - 1;
}

function estimateSuggestedMonthlyPayment({ principal, interestRateEa, months = DEFAULT_DEBT_PAYOFF_MONTHS }) {
  const p = Number(principal || 0);
  const n = Number(months || 0);
  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(n) || n <= 0) {
    return 0;
  }

  const monthlyRate = toMonthlyRate(interestRateEa);
  if (monthlyRate === null) return 0;
  if (monthlyRate === 0) return Number((p / n).toFixed(2));

  const denominator = 1 - Math.pow(1 + monthlyRate, -n);
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Number(((p * monthlyRate) / denominator).toFixed(2));
}

function mapRow(row) {
  if (!row) return null;
  const interestRateEa = Number(row.interest_rate_ea ?? row.interest_rate ?? DEFAULT_DEBT_INTEREST_EA);
  const principal = Number(row.principal || 0);
  const minimumPayment = row.minimum_payment === null ? null : Number(row.minimum_payment);
  const suggestedMonthlyPayment = estimateSuggestedMonthlyPayment({ principal, interestRateEa });
  return {
    id: row.id,
    userId: row.user_id,
    bankId: row.bank_id,
    cardId: row.card_id,
    accountId: row.account_id,
    debtName: row.debt_name || row.debt_type || "Deuda",
    debtType: row.debt_type || "other",
    principal,
    interestRateEa,
    minimumPayment,
    suggestedMonthlyPayment,
    isDefaultInterestEa: interestRateEa === DEFAULT_DEBT_INTEREST_EA,
    currency: row.currency || "COP",
    status: row.status || "open",
    dueDate: toIsoDate(row.due_date),
    notes: row.notes || "",
    accountName: row.account_name || "",
    accountNumber: row.account_number || "",
    cardName: row.card_name || "",
    cardLast4: row.last4 || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function debtBudgetEntry(debt) {
  const suggestedMonthlyPayment = estimateSuggestedMonthlyPayment({
    principal: Number(debt.principal || 0),
    interestRateEa: Number(debt.interestRateEa || DEFAULT_DEBT_INTEREST_EA),
  });
  return {
    kind: "debt",
    debtId: debt.id,
    name: debt.debtName,
    debtType: debt.debtType,
    principal: Number(debt.principal || 0),
    minimumPayment: debt.minimumPayment === null ? null : Number(debt.minimumPayment || 0),
    suggestedMonthlyPayment,
    interestRateEa: Number(debt.interestRateEa || DEFAULT_DEBT_INTEREST_EA),
    currency: debt.currency || "COP",
    dueDate: debt.dueDate || null,
    status: debt.status || "open",
    linkedAccountId: debt.accountId || null,
    linkedCardId: debt.cardId || null,
    updatedAt: new Date().toISOString(),
  };
}

function withDebtTotals(categories, currentTotals) {
  const debtItems = categories.filter((item) => item?.kind === "debt" && item?.status !== "closed");
  const debt = debtItems.reduce((sum, item) => {
    const minimumPayment = Number(item.minimumPayment || 0);
    const suggestedMonthlyPayment = Number(item.suggestedMonthlyPayment || 0);
    const principal = Number(item.principal || 0);
    return sum + (minimumPayment > 0 ? minimumPayment : suggestedMonthlyPayment > 0 ? suggestedMonthlyPayment : principal);
  }, 0);
  const debtPrincipal = debtItems.reduce((sum, item) => sum + Number(item.principal || 0), 0);

  return {
    ...currentTotals,
    debt,
    debtPrincipal,
    debtCount: debtItems.length,
  };
}

async function ensureCurrentBudget({ userId, currency = "COP" } = {}) {
  if (!userId) {
    return null;
  }
  const period = currentPeriod();
  const { rows } = await query(
    `SELECT id, currency, categories_json, totals_json
       FROM budgets
      WHERE owner_type = 'user'
        AND owner_id = $1
        AND period = $2
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId, period],
  );

  if (rows[0]) {
    return rows[0];
  }

  const id = crypto.randomUUID();
  const categories = [];
  const totals = { income: 0, expense: 0, saving: 0, debt: 0, debtPrincipal: 0, debtCount: 0 };
  const inserted = await query(
    `INSERT INTO budgets (
       id, owner_type, owner_id, household_id, period, country_code,
       currency, status, start_balance, categories_json, totals_json
     ) VALUES (
       $1, 'user', $2, NULL, $3, NULL,
       $4, 'draft', 0, $5::jsonb, $6::jsonb
     )
     RETURNING id, currency, categories_json, totals_json`,
    [id, userId, period, currency || "COP", JSON.stringify(categories), JSON.stringify(totals)],
  );

  return inserted.rows[0];
}

async function upsertBudgetDebtTransaction(budgetId, debt) {
  const suggestedMonthlyPayment = estimateSuggestedMonthlyPayment({
    principal: Number(debt.principal || 0),
    interestRateEa: Number(debt.interestRateEa || DEFAULT_DEBT_INTEREST_EA),
  });
  const amount = Number(debt.minimumPayment || 0) > 0
    ? Number(debt.minimumPayment)
    : suggestedMonthlyPayment > 0
      ? suggestedMonthlyPayment
      : Number(debt.principal || 0);
  const notes = `Registro de deuda: ${debt.debtName}`;
  const tags = {
    debtId: debt.id,
    debtType: debt.debtType,
    interestRateEa: Number(debt.interestRateEa || DEFAULT_DEBT_INTEREST_EA),
    principal: Number(debt.principal || 0),
    minimumPayment: debt.minimumPayment === null ? null : Number(debt.minimumPayment || 0),
    suggestedMonthlyPayment,
  };

  const existing = await query(
    `SELECT id
       FROM transactions
      WHERE budget_id = $1
        AND source = 'debt_registry'
        AND COALESCE(tags_json->>'debtId', '') = $2
      LIMIT 1`,
    [budgetId, debt.id],
  );

  if (existing.rows[0]) {
    await query(
      `UPDATE transactions
          SET account_id = $2,
              date = NOW(),
              amount = $3,
              currency = $4,
              category_id = 'debt',
              method = 'debt',
              status = 'posted',
              notes = $5,
              tags_json = $6::jsonb
        WHERE id = $1`,
      [
        existing.rows[0].id,
        debt.accountId || null,
        amount,
        debt.currency || "COP",
        notes,
        JSON.stringify(tags),
      ],
    );
    return;
  }

  await query(
    `INSERT INTO transactions (
       id, budget_id, account_id, country_code, date, amount, currency,
       category_id, method, status, source, notes, tags_json
     ) VALUES (
       $1, $2, $3, NULL, NOW(), $4, $5,
       'debt', 'debt', 'posted', 'debt_registry', $6, $7::jsonb
     )`,
    [
      crypto.randomUUID(),
      budgetId,
      debt.accountId || null,
      amount,
      debt.currency || "COP",
      notes,
      JSON.stringify(tags),
    ],
  );
}

async function syncDebtIntoBudget(debt) {
  const budget = await ensureCurrentBudget({
    userId: debt?.userId,
    currency: debt?.currency || "COP",
  });
  if (!budget) {
    return;
  }
  const categories = parseCategories(budget.categories_json);
  const totals = parseTotals(budget.totals_json);

  const nextCategories = categories.filter(
    (item) => !(item?.kind === "debt" && item?.debtId === debt.id),
  );
  nextCategories.push(debtBudgetEntry(debt));

  const nextTotals = withDebtTotals(nextCategories, totals);

  await query(
    `UPDATE budgets
        SET currency = $2,
            categories_json = $3::jsonb,
            totals_json = $4::jsonb,
            updated_at = NOW()
      WHERE id = $1`,
    [budget.id, debt.currency || budget.currency || "COP", JSON.stringify(nextCategories), JSON.stringify(nextTotals)],
  );

  await upsertBudgetDebtTransaction(budget.id, debt);
}

async function removeDebtFromBudgets(debtId, { userId = null } = {}) {
  await query(
    `DELETE FROM transactions
      WHERE source = 'debt_registry'
        AND COALESCE(tags_json->>'debtId', '') = $1`,
    [debtId],
  );

  const params = [];
  let where = "WHERE owner_type = 'user'";
  if (userId) {
    params.push(userId);
    where += ` AND owner_id = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT id, categories_json, totals_json
       FROM budgets
       ${where}
      ORDER BY created_at DESC`,
    params,
  );

  for (const budget of rows) {
    const categories = parseCategories(budget.categories_json);
    const nextCategories = categories.filter(
      (item) => !(item?.kind === "debt" && item?.debtId === debtId),
    );

    if (nextCategories.length === categories.length) {
      continue;
    }

    const nextTotals = withDebtTotals(nextCategories, parseTotals(budget.totals_json));
    await query(
      `UPDATE budgets
          SET categories_json = $2::jsonb,
              totals_json = $3::jsonb,
              updated_at = NOW()
        WHERE id = $1`,
      [budget.id, JSON.stringify(nextCategories), JSON.stringify(nextTotals)],
    );
  }
}

export async function listDebts({ userId = null } = {}) {
  const params = [];
  let where = "";
  if (userId) {
    params.push(userId);
    where = "WHERE d.user_id = $1";
  }

  const { rows } = await query(
    `${DEBT_SELECT}
      ${where}
      ORDER BY d.created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}

export async function findDebt(id, { userId = null } = {}) {
  const params = [id];
  let where = "WHERE d.id = $1";
  if (userId) {
    params.push(userId);
    where += " AND d.user_id = $2";
  }

  const { rows } = await query(
    `${DEBT_SELECT}
      ${where}
      LIMIT 1`,
    params,
  );
  return mapRow(rows[0]);
}

function normalizeMinimumPayment(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("minimum_payment_invalid");
  }
  return parsed;
}

function normalizeInterestRateEa(value) {
  if (value === null || value === undefined || value === "") {
    return DEFAULT_DEBT_INTEREST_EA;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("interest_rate_invalid");
  }
  return parsed;
}

function normalizeDebtPayload(data) {
  const principal = Number(data.principal);
  const interestRateEa = normalizeInterestRateEa(data.interestRateEa);
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error("principal_invalid");
  }

  const debtType = String(data.debtType || "other").trim() || "other";
  const debtName = String(data.debtName || debtType || "Deuda").trim() || "Deuda";
  const minimumPayment = normalizeMinimumPayment(data.minimumPayment);

  return {
    userId: data.userId || null,
    bankId: data.bankId || null,
    cardId: data.cardId || null,
    accountId: data.accountId || null,
    debtName,
    debtType,
    principal,
    interestRateEa,
    minimumPayment,
    currency: String(data.currency || "COP").trim() || "COP",
    status: String(data.status || "open").trim() || "open",
    dueDate: data.dueDate || null,
    notes: String(data.notes || "").slice(0, 600),
  };
}

export async function createDebt(data) {
  const normalized = normalizeDebtPayload(data);
  const id = data.id || crypto.randomUUID();

  await query(
    `INSERT INTO debts (
       id, user_id, bank_id, card_id, account_id,
       debt_name, debt_type, principal, interest_rate, interest_rate_ea,
       minimum_payment, currency, status, due_date, notes
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15
     )`,
    [
      id,
      normalized.userId,
      normalized.bankId,
      normalized.cardId,
      normalized.accountId,
      normalized.debtName,
      normalized.debtType,
      normalized.principal,
      normalized.interestRateEa,
      normalized.interestRateEa,
      normalized.minimumPayment,
      normalized.currency,
      normalized.status,
      normalized.dueDate,
      normalized.notes,
    ],
  );

  const created = await findDebt(id, { userId: normalized.userId });
  await syncDebtIntoBudget(created);
  return created;
}

export async function updateDebt(id, patch, { userId = null } = {}) {
  const current = await findDebt(id, { userId });
  if (!current) {
    return null;
  }

  const normalized = normalizeDebtPayload({
    ...current,
    ...patch,
    minimumPayment: patch.minimumPayment === undefined ? current.minimumPayment : patch.minimumPayment,
  });

  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += ` AND user_id = $${params.length}`;
  }

  params.push(
    normalized.bankId,
    normalized.cardId,
    normalized.accountId,
    normalized.debtName,
    normalized.debtType,
    normalized.principal,
    normalized.interestRateEa,
    normalized.interestRateEa,
    normalized.minimumPayment,
    normalized.currency,
    normalized.status,
    normalized.dueDate,
    normalized.notes,
  );

  const { rows } = await query(
    `UPDATE debts
        SET bank_id = $${params.length - 12},
            card_id = $${params.length - 11},
            account_id = $${params.length - 10},
            debt_name = $${params.length - 9},
            debt_type = $${params.length - 8},
            principal = $${params.length - 7},
            interest_rate = $${params.length - 6},
            interest_rate_ea = $${params.length - 5},
            minimum_payment = $${params.length - 4},
            currency = $${params.length - 3},
            status = $${params.length - 2},
            due_date = $${params.length - 1},
            notes = $${params.length},
            updated_at = NOW()
      WHERE ${where}
      RETURNING id`,
    params,
  );

  if (!rows[0]) {
    return null;
  }

  const updated = await findDebt(id, { userId });
  await syncDebtIntoBudget(updated);
  return updated;
}

export async function deleteDebt(id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await query(
    `DELETE FROM debts
      WHERE ${where}
      RETURNING id`,
    params,
  );

  if (!rows[0]) {
    return null;
  }

  await removeDebtFromBudgets(id, { userId });
  return { id: rows[0].id };
}
