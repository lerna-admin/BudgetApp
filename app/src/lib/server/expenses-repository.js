import crypto from "node:crypto";

import { query, withTransaction } from "./db";

const ALLOWED_MOVEMENT_TYPES = new Set(["income", "expense", "saving", "investment", "transfer"]);
const ALLOWED_METHODS = new Set(["cash", "card", "bank_transfer", "debt"]);

const EXPENSE_COLUMNS = `
  id,
  user_id,
  movement_type,
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
  transfer_from,
  transfer_to,
  source_account_id,
  destination_account_id,
  debt_id,
  savings_goal_id,
  destination_note,
  created_at,
  updated_at
`;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id || null,
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
    sourceAccountId: row.source_account_id || "",
    destinationAccountId: row.destination_account_id || "",
    debtId: row.debt_id || "",
    savingsGoalId: row.savings_goal_id || "",
    destinationNote: row.destination_note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeText(value, maxLength = 300) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeNullableId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value).trim() || null;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 50);
}

function normalizeMovementType(value) {
  const normalized = String(value || "expense").trim();
  if (!ALLOWED_MOVEMENT_TYPES.has(normalized)) {
    throw new Error("movement_type_invalid");
  }
  return normalized;
}

function normalizeMethod(value, movementType) {
  if (movementType === "transfer") {
    return "bank_transfer";
  }
  if (movementType === "income") {
    const normalized = String(value || "cash").trim();
    return ALLOWED_METHODS.has(normalized) ? normalized : "cash";
  }
  const normalized = String(value || "cash").trim();
  if (!ALLOWED_METHODS.has(normalized)) {
    throw new Error("movement_method_invalid");
  }
  return normalized;
}

function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("movement_amount_invalid");
  }
  return amount;
}

function normalizeExpensePayload(data, { base = null } = {}) {
  const merged = {
    ...(base || {}),
    ...(data || {}),
  };

  const movementType = normalizeMovementType(merged.movementType);
  const method = normalizeMethod(merged.method, movementType);
  const amount = normalizeAmount(merged.amount);
  const sourceAccountId = normalizeNullableId(merged.sourceAccountId);
  let destinationAccountId = normalizeNullableId(merged.destinationAccountId);
  let debtId = normalizeNullableId(merged.debtId);
  let savingsGoalId = normalizeNullableId(merged.savingsGoalId);

  if (movementType === "transfer") {
    if (!sourceAccountId || !destinationAccountId) {
      throw new Error("transfer_accounts_required");
    }
    if (sourceAccountId === destinationAccountId) {
      throw new Error("transfer_accounts_equal");
    }
  }

  const requiresSourceAccount =
    movementType !== "income" && movementType !== "transfer" && method === "bank_transfer";
  const hasSourceInPayload = Object.prototype.hasOwnProperty.call(data || {}, "sourceAccountId");
  const isLegacyUpdateWithoutSource = Boolean(
    base
      && !base.sourceAccountId
      && base.movementType === movementType
      && base.method === method
      && !hasSourceInPayload,
  );

  if (requiresSourceAccount && !sourceAccountId && !isLegacyUpdateWithoutSource) {
    throw new Error("source_account_required");
  }

  if (movementType !== "income" && movementType !== "transfer") {
    destinationAccountId = null;
  }

  if (movementType !== "expense") {
    debtId = null;
  }

  if (movementType !== "saving" && movementType !== "investment") {
    savingsGoalId = null;
  }

  return {
    movementType,
    date: merged.date,
    detail: normalizeText(merged.detail, 180),
    notes: normalizeText(merged.notes, 300),
    amount,
    category: normalizeText(merged.category, 120),
    subcategory: normalizeText(merged.subcategory, 120),
    edge: normalizeText(merged.edge, 120),
    method,
    bank: normalizeText(merged.bank, 140),
    card: normalizeText(merged.card, 140),
    currency: normalizeText(merged.currency, 12) || "COP",
    tags: normalizeArray(merged.tags),
    attachments: normalizeArray(merged.attachments),
    transferFrom: movementType === "transfer" ? normalizeText(merged.transferFrom, 180) : "",
    transferTo: movementType === "transfer" ? normalizeText(merged.transferTo, 180) : "",
    sourceAccountId,
    destinationAccountId,
    debtId,
    savingsGoalId,
    destinationNote: normalizeText(merged.destinationNote, 220),
  };
}

function movementEffects(movement) {
  const movementType = movement?.movementType;
  const amount = Number(movement?.amount || 0);
  const accountDeltas = [];

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      accountDeltas,
      debtDelta: 0,
      goalDelta: 0,
    };
  }

  if (movementType === "income") {
    if (movement.destinationAccountId) {
      accountDeltas.push({ accountId: movement.destinationAccountId, delta: amount });
    }
  } else if (movementType === "transfer") {
    if (movement.sourceAccountId) {
      accountDeltas.push({ accountId: movement.sourceAccountId, delta: -amount });
    }
    if (movement.destinationAccountId) {
      accountDeltas.push({ accountId: movement.destinationAccountId, delta: amount });
    }
  } else if (movement.sourceAccountId) {
    accountDeltas.push({ accountId: movement.sourceAccountId, delta: -amount });
  }

  const debtDelta = movementType === "expense" && movement.debtId ? -amount : 0;
  const goalDelta =
    (movementType === "saving" || movementType === "investment") && movement.savingsGoalId
      ? amount
      : 0;

  return {
    accountDeltas,
    debtDelta,
    goalDelta,
  };
}

async function adjustAccountBalance(client, { userId, accountId, delta }) {
  if (!accountId || !Number.isFinite(delta) || delta === 0) {
    return;
  }
  const { rows } = await client.query(
    `UPDATE accounts
        SET balance = balance + $3
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [accountId, userId, delta],
  );

  if (!rows[0]) {
    throw new Error("source_account_not_found");
  }
}

async function adjustDebtPrincipal(client, { userId, debtId, delta }) {
  if (!debtId || !Number.isFinite(delta) || delta === 0) {
    return;
  }
  const currentRes = await client.query(
    `SELECT principal, status
       FROM debts
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      FOR UPDATE`,
    [debtId, userId],
  );
  const current = currentRes.rows[0];
  if (!current) {
    throw new Error("movement_debt_not_found");
  }

  const principal = Number(current.principal || 0);
  if (!Number.isFinite(principal)) {
    throw new Error("movement_debt_principal_invalid");
  }

  const nextPrincipal = Math.max(0, principal + delta);
  const currentStatus = String(current.status || "open");
  const nextStatus = nextPrincipal <= 0 ? "closed" : currentStatus === "closed" ? "open" : currentStatus;

  await client.query(
    `UPDATE debts
        SET principal = $3,
            status = $4,
            updated_at = NOW()
      WHERE id = $1 AND user_id = $2`,
    [debtId, userId, nextPrincipal, nextStatus],
  );
}

async function adjustSavingsGoalProgress(client, { userId, savingsGoalId, delta }) {
  if (!savingsGoalId || !Number.isFinite(delta) || delta === 0) {
    return;
  }
  const currentRes = await client.query(
    `SELECT current_amount, target_amount, status
       FROM savings_goals
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      FOR UPDATE`,
    [savingsGoalId, userId],
  );
  const current = currentRes.rows[0];
  if (!current) {
    throw new Error("movement_goal_not_found");
  }

  const currentAmount = Number(current.current_amount || 0);
  const targetAmount = Number(current.target_amount || 0);
  if (!Number.isFinite(currentAmount) || !Number.isFinite(targetAmount)) {
    throw new Error("movement_goal_amount_invalid");
  }

  let nextAmount = Math.max(0, currentAmount + delta);
  if (targetAmount > 0) {
    nextAmount = Math.min(nextAmount, targetAmount);
  }

  let nextStatus = String(current.status || "active");
  if (targetAmount > 0 && nextAmount >= targetAmount) {
    nextStatus = "completed";
  } else if (nextStatus === "completed" && nextAmount < targetAmount) {
    nextStatus = "active";
  }

  await client.query(
    `UPDATE savings_goals
        SET current_amount = $3,
            status = $4,
            updated_at = NOW()
      WHERE id = $1 AND user_id = $2`,
    [savingsGoalId, userId, nextAmount, nextStatus],
  );
}

async function applyExpenseEffects(client, movement, { userId, factor = 1 }) {
  const effectiveUserId = userId || movement?.userId;
  if (!effectiveUserId) {
    throw new Error("movement_user_required");
  }
  const multiplier = Number(factor);
  if (!Number.isFinite(multiplier) || multiplier === 0) {
    return;
  }

  const { accountDeltas, debtDelta, goalDelta } = movementEffects(movement);

  for (const item of accountDeltas) {
    await adjustAccountBalance(client, {
      userId: effectiveUserId,
      accountId: item.accountId,
      delta: item.delta * multiplier,
    });
  }

  if (debtDelta !== 0 && movement?.debtId) {
    await adjustDebtPrincipal(client, {
      userId: effectiveUserId,
      debtId: movement.debtId,
      delta: debtDelta * multiplier,
    });
  }

  if (goalDelta !== 0 && movement?.savingsGoalId) {
    await adjustSavingsGoalProgress(client, {
      userId: effectiveUserId,
      savingsGoalId: movement.savingsGoalId,
      delta: goalDelta * multiplier,
    });
  }
}

async function findExpenseForUpdate(client, id, { userId = null } = {}) {
  const params = [id];
  let where = "id = $1";
  if (userId) {
    params.push(userId);
    where += " AND user_id = $2";
  }

  const { rows } = await client.query(
    `SELECT ${EXPENSE_COLUMNS}
       FROM expenses
      WHERE ${where}
      LIMIT 1
      FOR UPDATE`,
    params,
  );
  return mapRow(rows[0]);
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
    `SELECT ${EXPENSE_COLUMNS}
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
    `SELECT ${EXPENSE_COLUMNS}
       FROM expenses
      WHERE ${where}
      LIMIT 1`,
    params,
  );
  return mapRow(rows[0]);
}

export async function createExpense(data) {
  const normalized = normalizeExpensePayload(data);
  const id = data.id || crypto.randomUUID();

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO expenses (
         id, user_id, movement_type, date, detail, notes, amount,
         category, subcategory, edge, method, bank, card, currency,
         tags, attachments, transfer_from, transfer_to,
         source_account_id, destination_account_id, debt_id, savings_goal_id, destination_note
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12, $13, $14,
         $15, $16, $17, $18, $19, $20, $21, $22, $23
       )
       RETURNING ${EXPENSE_COLUMNS}`,
      [
        id,
        data.userId || null,
        normalized.movementType,
        normalized.date,
        normalized.detail,
        normalized.notes,
        normalized.amount,
        normalized.category,
        normalized.subcategory,
        normalized.edge,
        normalized.method,
        normalized.bank,
        normalized.card,
        normalized.currency,
        normalized.tags,
        normalized.attachments,
        normalized.transferFrom,
        normalized.transferTo,
        normalized.sourceAccountId,
        normalized.destinationAccountId,
        normalized.debtId,
        normalized.savingsGoalId,
        normalized.destinationNote,
      ],
    );

    const movement = mapRow(rows[0]);
    await applyExpenseEffects(client, movement, { userId: data.userId, factor: 1 });
    return movement;
  });
}

export async function updateExpense(id, patch, { userId = null } = {}) {
  return withTransaction(async (client) => {
    const existing = await findExpenseForUpdate(client, id, { userId });
    if (!existing) return null;

    const normalized = normalizeExpensePayload(patch, { base: existing });

    await applyExpenseEffects(client, existing, { userId, factor: -1 });

    const { rows } = await client.query(
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
              source_account_id = $18,
              destination_account_id = $19,
              debt_id = $20,
              savings_goal_id = $21,
              destination_note = $22,
              updated_at = NOW()
        WHERE id = $1
        RETURNING ${EXPENSE_COLUMNS}`,
      [
        id,
        normalized.movementType,
        normalized.date,
        normalized.detail,
        normalized.notes,
        normalized.amount,
        normalized.category,
        normalized.subcategory,
        normalized.edge,
        normalized.method,
        normalized.bank,
        normalized.card,
        normalized.currency,
        normalized.tags,
        normalized.attachments,
        normalized.transferFrom,
        normalized.transferTo,
        normalized.sourceAccountId,
        normalized.destinationAccountId,
        normalized.debtId,
        normalized.savingsGoalId,
        normalized.destinationNote,
      ],
    );

    const updated = mapRow(rows[0]);
    await applyExpenseEffects(client, updated, { userId, factor: 1 });
    return updated;
  });
}

export async function deleteExpense(id, { userId = null } = {}) {
  return withTransaction(async (client) => {
    const params = [id];
    let where = "id = $1";
    if (userId) {
      params.push(userId);
      where += " AND user_id = $2";
    }

    const { rows } = await client.query(
      `DELETE FROM expenses WHERE ${where}
       RETURNING ${EXPENSE_COLUMNS}`,
      params,
    );
    const removed = mapRow(rows[0]);
    if (!removed) {
      return null;
    }

    await applyExpenseEffects(client, removed, { userId, factor: -1 });
    return removed;
  });
}

export async function listTags({ userId = null } = {}) {
  const params = [];
  let where = "WHERE tags IS NOT NULL";
  if (userId) {
    params.push(userId);
    where += ` AND user_id = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT tag
       FROM (
         SELECT DISTINCT TRIM(tag) AS tag, LOWER(TRIM(tag)) AS tag_lower
         FROM (
           SELECT UNNEST(tags) AS tag
           FROM expenses
           ${where}
         ) t
         WHERE TRIM(tag) <> ''
       ) tags
      ORDER BY tag_lower`,
    params,
  );
  return rows.map((r) => r.tag);
}
