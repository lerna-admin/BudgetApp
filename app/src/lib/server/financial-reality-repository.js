import { createAccount, listAccounts } from "./accounts-repository";
import { createDebt, listDebts } from "./debts-repository";
import { createRecurringBill, listRecurringBills } from "./recurring-bills-repository";
import { createSavingsGoal, listSavingsGoals } from "./savings-goals-repository";

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

  const created = {
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
    const account = await createAccount({ userId, ...normalized });
    created.accounts.push(account);
  }

  for (const raw of asArray(payload?.debts)) {
    const normalized = normalizeDebtInput(raw);
    if (!normalized) {
      skipped.push({ type: "debt", reason: "invalid_payload" });
      continue;
    }
    const debt = await createDebt({ userId, ...normalized });
    created.debts.push(debt);
  }

  for (const raw of asArray(payload?.recurringBills)) {
    const normalized = normalizeRecurringBillInput(raw);
    if (!normalized) {
      skipped.push({ type: "recurringBill", reason: "invalid_payload" });
      continue;
    }
    const bill = await createRecurringBill({ userId, ...normalized });
    created.recurringBills.push(bill);
  }

  for (const raw of asArray(payload?.savingsGoals)) {
    const normalized = normalizeSavingsGoalInput(raw);
    if (!normalized) {
      skipped.push({ type: "savingsGoal", reason: "invalid_payload" });
      continue;
    }
    const goal = await createSavingsGoal({ userId, ...normalized });
    created.savingsGoals.push(goal);
  }

  const snapshot = await getFinancialRealitySnapshot({ userId });

  return {
    created,
    skipped,
    snapshot,
  };
}
