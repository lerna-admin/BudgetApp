import crypto from "node:crypto";

import { query } from "./db";

const PLAN_KINDS = new Set(["income", "expense", "saving"]);

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

function normalizeText(value, max = 180) {
  return String(value || "").trim().slice(0, max);
}

function normalizeMoney(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Number(parsed.toFixed(2));
}

function normalizeComparable(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function currentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parsePeriod(rawPeriod) {
  const value = String(rawPeriod || "").trim();
  const hit = value.match(/^(\d{4})-(\d{2})$/);
  if (!hit) {
    return null;
  }
  const year = Number(hit[1]);
  const month = Number(hit[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    year,
    month,
  };
}

function resolvePeriod(payload = {}) {
  const direct = parsePeriod(payload.period);
  if (direct) {
    return direct;
  }

  const year = Number(payload.year);
  const month = Number(payload.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    year,
    month,
  };
}

function periodRange(period) {
  const parsed = parsePeriod(period);
  if (!parsed) {
    return null;
  }
  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
  const end = new Date(Date.UTC(parsed.year, parsed.month, 1));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function safeStatus(value) {
  const raw = normalizeText(value, 20).toLowerCase();
  if (raw === "active" || raw === "archived") {
    return raw;
  }
  return "draft";
}

function normalizePlanDetail(detail, prefix, index) {
  const name = normalizeText(detail?.name);
  const edge = normalizeText(detail?.edge);
  const amount = normalizeMoney(detail?.amount, 0);

  if (!name && !edge && amount === 0) {
    return null;
  }

  return {
    id: normalizeText(detail?.id, 80) || `${prefix}-det-${index + 1}`,
    name: name || edge || `Detalle ${index + 1}`,
    edge: edge || "",
    amount,
  };
}

function normalizePlanRow(row, kind, index) {
  const details = Array.isArray(row?.details)
    ? row.details
        .map((item, detailIndex) => normalizePlanDetail(item, `${kind}-${index + 1}`, detailIndex))
        .filter(Boolean)
    : [];

  const rowAmount = details.length > 0
    ? details.reduce((sum, detail) => sum + normalizeMoney(detail.amount, 0), 0)
    : normalizeMoney(row?.amount, 0);

  const name = normalizeText(row?.name);
  const recommendation = normalizeText(row?.recommendation, 240);

  if (!name && rowAmount === 0 && details.length === 0) {
    return null;
  }

  return {
    id: normalizeText(row?.id, 80) || `${kind}-${index + 1}`,
    kind,
    source: "wizard",
    name: name || `Rubro ${index + 1}`,
    amount: rowAmount,
    recommendation,
    expanded: row?.expanded !== false,
    details,
  };
}

function normalizePlanData(planData = {}) {
  const safe = planData && typeof planData === "object" ? planData : {};

  const income = (Array.isArray(safe.income) ? safe.income : [])
    .map((row, index) => normalizePlanRow(row, "income", index))
    .filter(Boolean);

  const expenses = (Array.isArray(safe.expenses) ? safe.expenses : [])
    .map((row, index) => normalizePlanRow(row, "expense", index))
    .filter(Boolean);

  const savings = (Array.isArray(safe.savings) ? safe.savings : [])
    .map((row, index) => normalizePlanRow(row, "saving", index))
    .filter(Boolean);

  return { income, expenses, savings };
}

function categoriesToPlanData(categories = []) {
  const plan = {
    income: [],
    expenses: [],
    savings: [],
  };

  for (const item of Array.isArray(categories) ? categories : []) {
    if (!PLAN_KINDS.has(item?.kind)) {
      continue;
    }

    const details = Array.isArray(item.details)
      ? item.details.map((detail, index) => ({
          id: normalizeText(detail?.id, 80) || `${item.kind}-${item.id || index + 1}-detail-${index + 1}`,
          name: normalizeText(detail?.name) || `Detalle ${index + 1}`,
          edge: normalizeText(detail?.edge),
          amount: String(normalizeMoney(detail?.amount, 0)),
        }))
      : [];

    const mapped = {
      id: normalizeText(item.id, 80) || `${item.kind}-${Math.random()}`,
      name: normalizeText(item.name) || "Sin nombre",
      recommendation: normalizeText(item.recommendation, 240),
      expanded: item.expanded !== false,
      amount: String(normalizeMoney(item.amount, 0)),
      details,
    };

    if (item.kind === "income") {
      plan.income.push(mapped);
    } else if (item.kind === "expense") {
      plan.expenses.push(mapped);
    } else if (item.kind === "saving") {
      plan.savings.push(mapped);
    }
  }

  return plan;
}

function planDataToCategories(planData = {}) {
  const normalized = normalizePlanData(planData);
  return [...normalized.income, ...normalized.expenses, ...normalized.savings];
}

function debtTotals(categories = []) {
  const debtItems = categories.filter((item) => item?.kind === "debt" && item?.status !== "closed");
  const debt = debtItems.reduce((sum, item) => {
    const minimumPayment = normalizeMoney(item.minimumPayment, 0);
    const suggestedMonthlyPayment = normalizeMoney(item.suggestedMonthlyPayment, 0);
    const principal = normalizeMoney(item.principal, 0);
    if (minimumPayment > 0) {
      return sum + minimumPayment;
    }
    if (suggestedMonthlyPayment > 0) {
      return sum + suggestedMonthlyPayment;
    }
    return sum + principal;
  }, 0);

  return {
    debt,
    debtPrincipal: debtItems.reduce((sum, item) => sum + normalizeMoney(item.principal, 0), 0),
    debtCount: debtItems.length,
  };
}

function computePlannedTotals(categories = [], { startBalance = 0, meta = {} } = {}) {
  const income = categories
    .filter((item) => item?.kind === "income")
    .reduce((sum, item) => sum + normalizeMoney(item.amount, 0), 0);

  const expense = categories
    .filter((item) => item?.kind === "expense")
    .reduce((sum, item) => sum + normalizeMoney(item.amount, 0), 0);

  const saving = categories
    .filter((item) => item?.kind === "saving")
    .reduce((sum, item) => sum + normalizeMoney(item.amount, 0), 0);

  const plannedTotal = expense + saving;
  const difference = income - plannedTotal;

  return {
    income,
    expense,
    saving,
    plannedTotal,
    difference,
    startBalance: normalizeMoney(startBalance, 0),
    ...debtTotals(categories),
    meta,
  };
}

function mapBudgetRow(row) {
  if (!row) {
    return null;
  }

  const categories = parseJson(row.categories_json, []);
  const totals = parseJson(row.totals_json, {});
  const meta = totals?.meta && typeof totals.meta === "object" ? totals.meta : {};
  const period = String(row.period || "");
  const parsed = parsePeriod(period);

  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    householdId: row.household_id,
    period,
    year: parsed?.year || null,
    month: parsed?.month || null,
    countryCode: row.country_code || "",
    currency: row.currency || "COP",
    status: row.status || "draft",
    startBalance: normalizeMoney(row.start_balance, 0),
    categories: Array.isArray(categories) ? categories : [],
    totals: totals && typeof totals === "object" ? totals : {},
    meta,
    budgetName: normalizeText(meta.budgetName) || `Presupuesto ${period}`,
    note: normalizeText(meta.note, 600),
    profileId: normalizeText(meta.profileId, 80) || "tilbury",
    profileRows: Array.isArray(meta.profileRows) ? meta.profileRows : [],
    savingsTarget: normalizeMoney(meta.savingsTarget, 0),
    incomeTarget: normalizeMoney(meta.incomeTarget, 0),
    planData: categoriesToPlanData(Array.isArray(categories) ? categories : []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findBudgetRowForPeriod({ userId, period }) {
  const { rows } = await query(
    `SELECT id, owner_type, owner_id, household_id, period, country_code,
            currency, status, start_balance, categories_json, totals_json,
            created_at, updated_at
       FROM budgets
      WHERE owner_type = 'user'
        AND owner_id = $1
        AND period = $2
      ORDER BY CASE
                 WHEN status = 'active' THEN 0
                 WHEN status = 'draft' THEN 1
                 ELSE 2
               END,
               updated_at DESC
      LIMIT 1`,
    [userId, period],
  );
  return rows[0] || null;
}

async function findLatestBudgetRow({ userId }) {
  const { rows } = await query(
    `SELECT id, owner_type, owner_id, household_id, period, country_code,
            currency, status, start_balance, categories_json, totals_json,
            created_at, updated_at
       FROM budgets
      WHERE owner_type = 'user'
        AND owner_id = $1
      ORDER BY period DESC,
               CASE
                 WHEN status = 'active' THEN 0
                 WHEN status = 'draft' THEN 1
                 ELSE 2
               END,
               updated_at DESC
      LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

function movementTypeToKind(movementType) {
  if (movementType === "income") {
    return "income";
  }
  if (movementType === "expense") {
    return "expense";
  }
  if (movementType === "saving" || movementType === "investment") {
    return "saving";
  }
  return null;
}

function buildLineMatchers(categories = []) {
  return categories
    .filter((item) => PLAN_KINDS.has(item?.kind))
    .map((item, index) => {
      const detailList = Array.isArray(item.details) ? item.details : [];
      const keys = new Set();
      const nameKey = normalizeComparable(item.name);
      if (nameKey) {
        keys.add(nameKey);
      }
      for (const detail of detailList) {
        const detailKey = normalizeComparable(detail?.name);
        if (detailKey) {
          keys.add(detailKey);
        }
        const edgeKey = normalizeComparable(detail?.edge);
        if (edgeKey) {
          keys.add(edgeKey);
        }
      }

      return {
        id: normalizeText(item.id, 80) || `line-${index + 1}`,
        kind: item.kind,
        name: normalizeText(item.name) || `Rubro ${index + 1}`,
        recommendation: normalizeText(item.recommendation, 240),
        detailCount: detailList.length,
        planned: normalizeMoney(item.amount, 0),
        actual: 0,
        keys,
        nameKey,
      };
    });
}

function scoreLineMatch(movementKeys, line) {
  if (!movementKeys.length || !line) {
    return 0;
  }

  let score = 0;
  for (const movementKey of movementKeys) {
    if (!movementKey) {
      continue;
    }

    if (line.keys.has(movementKey)) {
      score = Math.max(score, 5);
      continue;
    }

    if (line.nameKey && movementKey === line.nameKey) {
      score = Math.max(score, 4);
      continue;
    }

    if (line.nameKey && (movementKey.includes(line.nameKey) || line.nameKey.includes(movementKey))) {
      score = Math.max(score, 3);
      continue;
    }

    for (const key of line.keys) {
      if (movementKey.includes(key) || key.includes(movementKey)) {
        score = Math.max(score, 2);
      }
    }
  }

  return score;
}

function summarizePerformance(budget, movements = []) {
  const lines = buildLineMatchers(budget.categories);
  const linesByKind = {
    income: lines.filter((line) => line.kind === "income"),
    expense: lines.filter((line) => line.kind === "expense"),
    saving: lines.filter((line) => line.kind === "saving"),
  };

  const actualTotals = {
    income: 0,
    expense: 0,
    saving: 0,
  };

  const unmatched = {
    income: 0,
    expense: 0,
    saving: 0,
  };

  for (const movement of movements) {
    const kind = movementTypeToKind(movement.movementType);
    if (!kind) {
      continue;
    }

    const amount = normalizeMoney(movement.amount, 0);
    actualTotals[kind] += amount;

    const candidates = linesByKind[kind];
    if (!candidates.length) {
      unmatched[kind] += amount;
      continue;
    }

    const movementKeys = [
      normalizeComparable(movement.subcategory),
      normalizeComparable(movement.edge),
      normalizeComparable(movement.detail),
    ].filter(Boolean);

    let best = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = scoreLineMatch(movementKeys, candidate);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (!best || bestScore <= 0) {
      unmatched[kind] += amount;
      continue;
    }

    best.actual += amount;
  }

  const categories = lines.map((line) => {
    const difference = line.planned - line.actual;
    const progress = line.planned > 0
      ? Math.min(100, Math.round((line.actual / line.planned) * 100))
      : 0;

    return {
      id: line.id,
      kind: line.kind,
      name: line.name,
      recommendation: line.recommendation,
      detailCount: line.detailCount,
      planned: line.planned,
      actual: normalizeMoney(line.actual, 0),
      difference: normalizeMoney(difference, 0),
      progress,
    };
  });

  for (const kind of ["income", "expense", "saving"]) {
    if (unmatched[kind] > 0) {
      categories.push({
        id: `unmatched-${kind}`,
        kind,
        name: "Sin asignar",
        recommendation: "Movimientos sin coincidencia directa con rubros del presupuesto.",
        detailCount: 0,
        planned: 0,
        actual: normalizeMoney(unmatched[kind], 0),
        difference: normalizeMoney(-unmatched[kind], 0),
        progress: 100,
      });
    }
  }

  const plannedIncome = normalizeMoney(budget.totals?.income, 0);
  const plannedExpense = normalizeMoney(budget.totals?.expense, 0);
  const plannedSaving = normalizeMoney(budget.totals?.saving, 0);

  const plannedOutflow = plannedExpense + plannedSaving;
  const actualOutflow = actualTotals.expense + actualTotals.saving;

  return {
    period: budget.period,
    status: budget.status,
    planned: {
      income: plannedIncome,
      expense: plannedExpense,
      saving: plannedSaving,
      outflow: normalizeMoney(plannedOutflow, 0),
      difference: normalizeMoney(plannedIncome - plannedOutflow, 0),
    },
    actual: {
      income: normalizeMoney(actualTotals.income, 0),
      expense: normalizeMoney(actualTotals.expense, 0),
      saving: normalizeMoney(actualTotals.saving, 0),
      outflow: normalizeMoney(actualOutflow, 0),
      difference: normalizeMoney(actualTotals.income - actualOutflow, 0),
    },
    variance: {
      income: normalizeMoney(actualTotals.income - plannedIncome, 0),
      expense: normalizeMoney(actualTotals.expense - plannedExpense, 0),
      saving: normalizeMoney(actualTotals.saving - plannedSaving, 0),
      outflow: normalizeMoney(actualOutflow - plannedOutflow, 0),
    },
    categories,
    unmatched,
    movementCount: movements.length,
  };
}

async function listPeriodMovements({ userId, period }) {
  const range = periodRange(period);
  if (!range) {
    return [];
  }

  const { rows } = await query(
    `SELECT movement_type, detail, subcategory, edge, amount, currency, date
       FROM expenses
      WHERE user_id = $1
        AND date >= $2
        AND date < $3
      ORDER BY date DESC, created_at DESC`,
    [userId, range.start, range.end],
  );

  return rows.map((row) => ({
    movementType: row.movement_type,
    detail: row.detail || "",
    subcategory: row.subcategory || "",
    edge: row.edge || "",
    amount: normalizeMoney(row.amount, 0),
    currency: row.currency || "COP",
    date: row.date,
  }));
}

export async function upsertUserBudget({ userId, payload = {}, status = "draft" }) {
  if (!userId) {
    throw new Error("unauthorized");
  }

  const resolved = resolvePeriod(payload);
  if (!resolved) {
    throw new Error("period_required");
  }

  const requestedStatus = safeStatus(status);
  const currency = normalizeText(payload.currency, 12) || "COP";
  const startBalance = normalizeMoney(payload.startBalance, 0);
  const profileRows = Array.isArray(payload.profileRows) ? payload.profileRows : [];

  const planCategories = planDataToCategories(payload.planData || {});
  const existingRow = await findBudgetRowForPeriod({ userId, period: resolved.period });
  const budgetStatus = existingRow?.status === "active" && requestedStatus === "draft"
    ? "active"
    : requestedStatus;

  const parsedExistingCategories = parseJson(existingRow?.categories_json, []);
  const existingCategories = Array.isArray(parsedExistingCategories) ? parsedExistingCategories : [];

  const preservedCategories = existingCategories.filter((item) => item?.kind === "debt");
  const categories = [...planCategories, ...preservedCategories];

  const meta = {
    budgetName: normalizeText(payload.budgetName || payload.name, 140) || `Presupuesto ${resolved.period}`,
    note: normalizeText(payload.note, 600),
    profileId: normalizeText(payload.profileId, 80) || "tilbury",
    profileRows,
    savingsTarget: normalizeMoney(payload.savingsTarget, 0),
    incomeTarget: normalizeMoney(payload.incomeTarget, 0),
    period: resolved.period,
    year: resolved.year,
    month: resolved.month,
    updatedFrom: "wizard",
    updatedAt: new Date().toISOString(),
  };

  const totals = computePlannedTotals(categories, {
    startBalance,
    meta,
  });

  let budgetRow;

  if (existingRow?.id) {
    const { rows } = await query(
      `UPDATE budgets
          SET currency = $2,
              status = $3,
              start_balance = $4,
              categories_json = $5::jsonb,
              totals_json = $6::jsonb,
              updated_at = NOW()
        WHERE id = $1
        RETURNING id, owner_type, owner_id, household_id, period, country_code,
                  currency, status, start_balance, categories_json, totals_json,
                  created_at, updated_at`,
      [
        existingRow.id,
        currency,
        budgetStatus,
        startBalance,
        JSON.stringify(categories),
        JSON.stringify(totals),
      ],
    );
    budgetRow = rows[0];
  } else {
    const id = crypto.randomUUID();
    const { rows } = await query(
      `INSERT INTO budgets (
         id, owner_type, owner_id, household_id, period, country_code,
         currency, status, start_balance, categories_json, totals_json
       ) VALUES (
         $1, 'user', $2, NULL, $3, NULL,
         $4, $5, $6, $7::jsonb, $8::jsonb
       )
       RETURNING id, owner_type, owner_id, household_id, period, country_code,
                 currency, status, start_balance, categories_json, totals_json,
                 created_at, updated_at`,
      [
        id,
        userId,
        resolved.period,
        currency,
        budgetStatus,
        startBalance,
        JSON.stringify(categories),
        JSON.stringify(totals),
      ],
    );
    budgetRow = rows[0];
  }

  return mapBudgetRow(budgetRow);
}

export async function getBudgetPerformanceForPeriod({ userId, period }) {
  if (!userId || !period) {
    return null;
  }

  const row = await findBudgetRowForPeriod({ userId, period });
  if (!row) {
    return null;
  }

  const budget = mapBudgetRow(row);
  const movements = await listPeriodMovements({ userId, period: budget.period });
  const overview = summarizePerformance(budget, movements);

  return {
    budget,
    overview,
    categories: overview.categories,
  };
}

export async function getCurrentBudgetPerformance({ userId }) {
  if (!userId) {
    return null;
  }

  const nowPeriod = currentPeriod();
  const current = await findBudgetRowForPeriod({ userId, period: nowPeriod });
  const chosen = current || (await findLatestBudgetRow({ userId }));

  if (!chosen) {
    return null;
  }

  const budget = mapBudgetRow(chosen);
  const movements = await listPeriodMovements({ userId, period: budget.period });
  const overview = summarizePerformance(budget, movements);

  return {
    budget,
    overview,
    categories: overview.categories,
  };
}
