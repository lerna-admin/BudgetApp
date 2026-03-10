import { createAccount, listAccounts, updateAccount } from "./accounts-repository";
import { createDebt, listDebts, updateDebt } from "./debts-repository";
import {
  createRecurringBill,
  listRecurringBills,
  updateRecurringBill,
} from "./recurring-bills-repository";
import {
  createSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
} from "./savings-goals-repository";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return String(value || "").trim();
}

function asNumber(value, fallback = NaN) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asComparable(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function fixedAmount(value, fallback = 0) {
  const parsed = asNumber(value, fallback);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : fallback;
}

function accountKey(item) {
  return [
    asComparable(item?.accountName),
    asComparable(item?.currency || "COP"),
    fixedAmount(item?.balance, 0),
  ].join("|");
}

function debtKey(item) {
  return [
    asComparable(item?.debtName),
    asComparable(item?.debtType || "other"),
    asComparable(item?.currency || "COP"),
    fixedAmount(item?.principal, 0),
    fixedAmount(item?.interestRateEa ?? 23, 23),
    fixedAmount(item?.minimumPayment ?? 0, 0),
  ].join("|");
}

function recurringBillKey(item) {
  return [
    asComparable(item?.billName),
    asComparable(item?.currency || "COP"),
    asComparable(item?.frequency || "monthly"),
    String(item?.dueDay ?? ""),
    fixedAmount(item?.amount, 0),
  ].join("|");
}

function savingsGoalKey(item) {
  return [
    asComparable(item?.goalName),
    asComparable(item?.currency || "COP"),
    fixedAmount(item?.targetAmount, 0),
    fixedAmount(item?.monthlyTarget ?? 0, 0),
    String(item?.targetDate || ""),
  ].join("|");
}

export async function getFinancialRealitySnapshot({ userId }) {
  const [accounts, debts, recurringBills, savingsGoals] = await Promise.all([
    listAccounts({ userId }),
    listDebts({ userId }),
    listRecurringBills({ userId, includeInactive: false }),
    listSavingsGoals({ userId, includeCompleted: false }),
  ]);

  const totals = {
    accountBalance: accounts.reduce((sum, item) => sum + Number(item.balance || 0), 0),
    debtPrincipal: debts
      .filter((item) => item.status !== "closed")
      .reduce((sum, item) => sum + Number(item.principal || 0), 0),
    debtMonthly: debts
      .filter((item) => item.status !== "closed")
      .reduce((sum, item) => {
        const minimumPayment = Number(item.minimumPayment || 0);
        const suggested = Number(item.suggestedMonthlyPayment || 0);
        return sum + (minimumPayment > 0 ? minimumPayment : suggested);
      }, 0),
    recurringBillsMonthly: recurringBills.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    savingsMonthlyTarget: savingsGoals.reduce((sum, item) => sum + Number(item.monthlyTarget || 0), 0),
  };

  const missing = {
    accounts: accounts.length === 0,
    debts: debts.filter((item) => item.status !== "closed").length === 0,
    recurringBills: recurringBills.length === 0,
    savingsGoals: savingsGoals.length === 0,
  };

  return {
    counts: {
      accounts: accounts.length,
      debts: debts.length,
      recurringBills: recurringBills.length,
      savingsGoals: savingsGoals.length,
    },
    totals,
    missing,
    needsRealitySetup: Object.values(missing).some(Boolean),
    accounts,
    debts,
    recurringBills,
    savingsGoals,
  };
}

function normalizeAccountInput(item) {
  const accountName = asString(item.accountName || item.name);
  const balance = asNumber(item.balance ?? item.amount, NaN);
  if (!accountName || !Number.isFinite(balance)) {
    return null;
  }
  return {
    accountName,
    balance,
    currency: asString(item.currency || "COP") || "COP",
    accountType: asString(item.accountType || "checking") || "checking",
  };
}

function normalizeDebtInput(item) {
  const debtName = asString(item.debtName || item.name);
  const principal = asNumber(item.principal ?? item.balance ?? item.amount, NaN);
  if (!debtName || !Number.isFinite(principal) || principal <= 0) {
    return null;
  }
  return {
    debtName,
    debtType: asString(item.debtType || "other") || "other",
    principal,
    interestRateEa: item.interestRateEa ?? item.rateEa ?? null,
    minimumPayment: item.minimumPayment ?? null,
    currency: asString(item.currency || "COP") || "COP",
    status: asString(item.status || "open") || "open",
    dueDate: item.dueDate || null,
    notes: asString(item.notes),
  };
}

function normalizeRecurringBillInput(item) {
  const billName = asString(item.billName || item.name);
  const amount = asNumber(item.amount, NaN);
  if (!billName || !Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return {
    billName,
    amount,
    category: asString(item.category || "general") || "general",
    currency: asString(item.currency || "COP") || "COP",
    frequency: asString(item.frequency || "monthly") || "monthly",
    dueDay: item.dueDay ?? null,
    notes: asString(item.notes),
    isActive: item.isActive === undefined ? true : Boolean(item.isActive),
  };
}

function normalizeSavingsGoalInput(item) {
  const goalName = asString(item.goalName || item.name);
  const targetAmount = asNumber(item.targetAmount ?? item.goalAmount ?? item.amount, NaN);
  if (!goalName || !Number.isFinite(targetAmount) || targetAmount <= 0) {
    return null;
  }
  return {
    goalName,
    targetAmount,
    currentAmount: item.currentAmount ?? 0,
    monthlyTarget: item.monthlyTarget ?? null,
    currency: asString(item.currency || "COP") || "COP",
    targetDate: item.targetDate || null,
    notes: asString(item.notes),
    status: asString(item.status || "active") || "active",
  };
}

export async function bootstrapFinancialReality({ userId, payload }) {
  if (!userId) {
    throw new Error("unauthorized");
  }

  const currentSnapshot = await getFinancialRealitySnapshot({ userId });
  const knownKeys = {
    accounts: new Set((currentSnapshot.accounts || []).map(accountKey)),
    debts: new Set((currentSnapshot.debts || []).map(debtKey)),
    recurringBills: new Set((currentSnapshot.recurringBills || []).map(recurringBillKey)),
    savingsGoals: new Set((currentSnapshot.savingsGoals || []).map(savingsGoalKey)),
  };
  const existingById = {
    accounts: new Map((currentSnapshot.accounts || []).map((item) => [item.id, item])),
    debts: new Map((currentSnapshot.debts || []).map((item) => [item.id, item])),
    recurringBills: new Map((currentSnapshot.recurringBills || []).map((item) => [item.id, item])),
    savingsGoals: new Map((currentSnapshot.savingsGoals || []).map((item) => [item.id, item])),
  };

  const created = {
    accounts: [],
    debts: [],
    recurringBills: [],
    savingsGoals: [],
  };
  const updated = {
    accounts: [],
    debts: [],
    recurringBills: [],
    savingsGoals: [],
  };
  const skipped = [];

  for (const raw of asArray(payload?.accounts)) {
    const normalized = normalizeAccountInput(raw);
    if (!normalized) {
      skipped.push({ type: "account", reason: "invalid_payload" });
      continue;
    }
    const key = accountKey(normalized);
    if (raw?.persistedId) {
      const current = existingById.accounts.get(raw.persistedId);
      if (!current) {
        skipped.push({ type: "account", reason: "not_found", id: raw.persistedId });
        continue;
      }
      const currentKey = accountKey(current);
      knownKeys.accounts.delete(currentKey);
      if (knownKeys.accounts.has(key)) {
        knownKeys.accounts.add(currentKey);
        skipped.push({ type: "account", reason: "duplicate" });
        continue;
      }
      const account = await updateAccount(raw.persistedId, normalized, { userId });
      if (!account) {
        knownKeys.accounts.add(currentKey);
        skipped.push({ type: "account", reason: "not_found", id: raw.persistedId });
        continue;
      }
      updated.accounts.push(account);
      existingById.accounts.set(account.id, account);
      knownKeys.accounts.add(key);
      continue;
    }
    if (knownKeys.accounts.has(key)) {
      skipped.push({ type: "account", reason: "duplicate" });
      continue;
    }
    const account = await createAccount({ userId, ...normalized });
    created.accounts.push(account);
    knownKeys.accounts.add(key);
  }

  for (const raw of asArray(payload?.debts)) {
    const normalized = normalizeDebtInput(raw);
    if (!normalized) {
      skipped.push({ type: "debt", reason: "invalid_payload" });
      continue;
    }
    const key = debtKey(normalized);
    if (raw?.persistedId) {
      const current = existingById.debts.get(raw.persistedId);
      if (!current) {
        skipped.push({ type: "debt", reason: "not_found", id: raw.persistedId });
        continue;
      }
      const currentKey = debtKey(current);
      knownKeys.debts.delete(currentKey);
      if (knownKeys.debts.has(key)) {
        knownKeys.debts.add(currentKey);
        skipped.push({ type: "debt", reason: "duplicate" });
        continue;
      }
      const debt = await updateDebt(raw.persistedId, normalized, { userId });
      if (!debt) {
        knownKeys.debts.add(currentKey);
        skipped.push({ type: "debt", reason: "not_found", id: raw.persistedId });
        continue;
      }
      updated.debts.push(debt);
      existingById.debts.set(debt.id, debt);
      knownKeys.debts.add(key);
      continue;
    }
    if (knownKeys.debts.has(key)) {
      skipped.push({ type: "debt", reason: "duplicate" });
      continue;
    }
    const debt = await createDebt({ userId, ...normalized });
    created.debts.push(debt);
    knownKeys.debts.add(key);
  }

  for (const raw of asArray(payload?.recurringBills)) {
    const normalized = normalizeRecurringBillInput(raw);
    if (!normalized) {
      skipped.push({ type: "recurringBill", reason: "invalid_payload" });
      continue;
    }
    const key = recurringBillKey(normalized);
    if (raw?.persistedId) {
      const current = existingById.recurringBills.get(raw.persistedId);
      if (!current) {
        skipped.push({ type: "recurringBill", reason: "not_found", id: raw.persistedId });
        continue;
      }
      const currentKey = recurringBillKey(current);
      knownKeys.recurringBills.delete(currentKey);
      if (knownKeys.recurringBills.has(key)) {
        knownKeys.recurringBills.add(currentKey);
        skipped.push({ type: "recurringBill", reason: "duplicate" });
        continue;
      }
      const bill = await updateRecurringBill(raw.persistedId, normalized, { userId });
      if (!bill) {
        knownKeys.recurringBills.add(currentKey);
        skipped.push({ type: "recurringBill", reason: "not_found", id: raw.persistedId });
        continue;
      }
      updated.recurringBills.push(bill);
      existingById.recurringBills.set(bill.id, bill);
      knownKeys.recurringBills.add(key);
      continue;
    }
    if (knownKeys.recurringBills.has(key)) {
      skipped.push({ type: "recurringBill", reason: "duplicate" });
      continue;
    }
    const bill = await createRecurringBill({ userId, ...normalized });
    created.recurringBills.push(bill);
    knownKeys.recurringBills.add(key);
  }

  for (const raw of asArray(payload?.savingsGoals)) {
    const normalized = normalizeSavingsGoalInput(raw);
    if (!normalized) {
      skipped.push({ type: "savingsGoal", reason: "invalid_payload" });
      continue;
    }
    const key = savingsGoalKey(normalized);
    if (raw?.persistedId) {
      const current = existingById.savingsGoals.get(raw.persistedId);
      if (!current) {
        skipped.push({ type: "savingsGoal", reason: "not_found", id: raw.persistedId });
        continue;
      }
      const currentKey = savingsGoalKey(current);
      knownKeys.savingsGoals.delete(currentKey);
      if (knownKeys.savingsGoals.has(key)) {
        knownKeys.savingsGoals.add(currentKey);
        skipped.push({ type: "savingsGoal", reason: "duplicate" });
        continue;
      }
      const goal = await updateSavingsGoal(raw.persistedId, normalized, { userId });
      if (!goal) {
        knownKeys.savingsGoals.add(currentKey);
        skipped.push({ type: "savingsGoal", reason: "not_found", id: raw.persistedId });
        continue;
      }
      updated.savingsGoals.push(goal);
      existingById.savingsGoals.set(goal.id, goal);
      knownKeys.savingsGoals.add(key);
      continue;
    }
    if (knownKeys.savingsGoals.has(key)) {
      skipped.push({ type: "savingsGoal", reason: "duplicate" });
      continue;
    }
    const goal = await createSavingsGoal({ userId, ...normalized });
    created.savingsGoals.push(goal);
    knownKeys.savingsGoals.add(key);
  }

  const snapshot = await getFinancialRealitySnapshot({ userId });

  return {
    created,
    updated,
    skipped,
    snapshot,
  };
}
