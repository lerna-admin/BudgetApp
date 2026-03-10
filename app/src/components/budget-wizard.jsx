"use client";

import { useMemo, useState } from "react";
import {
  confirmDestructiveAction,
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../lib/swal";

const steps = [
  {
    id: 1,
    label: "Realidad actual",
    title: "Conoce tu realidad financiera",
    subtitle: "Antes de presupuestar, registra cuentas, deudas, pagos fijos y metas si aun no existen.",
  },
  {
    id: 2,
    label: "Periodo",
    title: "Periodo y nombre",
    subtitle: "Selecciona el mes y el anio del presupuesto.",
  },
  {
    id: 3,
    label: "Perfil financiero",
    title: "Perfil financiero",
    subtitle: "Definimos limites y lineamientos base.",
  },
  {
    id: 4,
    label: "Valores planificados",
    title: "Registra tus ingresos y valores planificados",
    subtitle: "Completa tus valores planificados para este mes.",
  },
  {
    id: 5,
    label: "Revision",
    title: "Revision",
    subtitle: "Confirma el resumen final antes de activar.",
  },
];

const profilePresets = {
  tilbury: {
    label: "Perfil Tilbury (1%)",
    distribution: [
      { label: "Esenciales", percent: "50%", note: "Gastos basicos para vivir." },
      { label: "Crecimiento / Inversion", percent: "25%", note: "Recursos para invertir." },
      { label: "Ahorro / Estabilidad", percent: "15%", note: "Reserva para emergencias." },
      { label: "Recompensas", percent: "10%", note: "Gastos no esenciales." },
    ],
  },
  ahorro: {
    label: "Perfil Ahorro Acelerado",
    distribution: [
      { label: "Esenciales", percent: "55%", note: "Gastos basicos para vivir." },
      { label: "Ahorro / Estabilidad", percent: "30%", note: "Reserva para emergencias." },
      { label: "Deuda", percent: "10%", note: "Pagos de obligaciones." },
      { label: "Recompensas", percent: "5%", note: "Gastos no esenciales." },
    ],
  },
  inversion: {
    label: "Perfil Inversion Prioritaria",
    distribution: [
      { label: "Esenciales", percent: "50%", note: "Gastos basicos para vivir." },
      { label: "Crecimiento / Inversion", percent: "30%", note: "Recursos para invertir." },
      { label: "Deuda", percent: "10%", note: "Pagos de obligaciones." },
      { label: "Recompensas", percent: "10%", note: "Gastos no esenciales." },
    ],
  },
  deuda: {
    label: "Perfil Pago de Deudas",
    distribution: [
      { label: "Esenciales", percent: "55%", note: "Gastos basicos para vivir." },
      { label: "Deuda", percent: "25%", note: "Pagos de obligaciones." },
      { label: "Ahorro / Estabilidad", percent: "15%", note: "Reserva para emergencias." },
      { label: "Recompensas", percent: "5%", note: "Gastos no esenciales." },
    ],
  },
};

const monthOptions = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const initialPlanData = {
  income: [
    { id: "income-1", name: "Salario", amount: "0" },
    { id: "income-2", name: "Saldo mes anterior", amount: "0" },
  ],
  expenses: [
    {
      id: "exp-1",
      name: "Necesidades basicas",
      amount: "0",
      recommendation: "Recomendado 50% · Perfil Tilbury",
      expanded: true,
      details: [
        { id: "exp-1-det-1", name: "Arriendo", amount: "0" },
        { id: "exp-1-det-2", name: "Servicios publicos", amount: "0" },
      ],
    },
    {
      id: "exp-2",
      name: "Alimentacion",
      amount: "0",
      recommendation: "",
      expanded: true,
      details: [
        { id: "exp-2-det-1", name: "Mercado", amount: "0" },
        { id: "exp-2-det-2", name: "Restaurantes", amount: "0" },
      ],
    },
    {
      id: "exp-3",
      name: "Transporte",
      amount: "0",
      recommendation: "",
      expanded: true,
      details: [
        { id: "exp-3-det-1", name: "App taxis", amount: "0" },
        { id: "exp-3-det-2", name: "Peajes", amount: "0" },
      ],
    },
    {
      id: "exp-4",
      name: "Entretenimiento",
      amount: "0",
      recommendation: "",
      expanded: true,
      details: [
        { id: "exp-4-det-1", name: "Cine", amount: "0" },
        { id: "exp-4-det-2", name: "Plataformas", amount: "0" },
      ],
    },
    {
      id: "exp-5",
      name: "Deudas",
      amount: "0",
      recommendation: "",
      expanded: true,
      details: [
        { id: "exp-5-det-1", name: "Tarjeta 1", amount: "0" },
        { id: "exp-5-det-2", name: "Carro", amount: "0" },
      ],
    },
  ],
  savings: [
    {
      id: "sav-1",
      name: "Fondo de emergencia",
      amount: "0",
      recommendation: "",
      expanded: true,
      details: [{ id: "sav-1-det-1", name: "Ahorro programado", amount: "0" }],
    },
  ],
};

function toAmountString(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "0";
  return String(Math.round(amount));
}

function createLocalRowId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function createRealityBaseRow(section) {
  const baseRows = {
    accounts: { id: createLocalRowId("acc"), persistedId: null, accountName: "", balance: "", currency: "COP" },
    debts: {
      id: createLocalRowId("debt"),
      persistedId: null,
      debtName: "",
      principal: "",
      interestRateEa: "",
      minimumPayment: "",
      currency: "COP",
      debtType: "other",
    },
    recurringBills: {
      id: createLocalRowId("bill"),
      persistedId: null,
      billName: "",
      amount: "",
      frequency: "monthly",
      dueDay: "",
      currency: "COP",
    },
    savingsGoals: {
      id: createLocalRowId("goal"),
      persistedId: null,
      goalName: "",
      targetAmount: "",
      monthlyTarget: "",
      targetDate: "",
      currency: "COP",
    },
  };

  return baseRows[section];
}

function buildRealityCounts(initialReality = {}) {
  const fromCounts = initialReality?.counts;
  if (fromCounts) {
    return {
      accounts: Number(fromCounts.accounts || 0),
      debts: Number(fromCounts.debts || 0),
      recurringBills: Number(fromCounts.recurringBills || 0),
      savingsGoals: Number(fromCounts.savingsGoals || 0),
    };
  }

  return {
    accounts: Array.isArray(initialReality?.accounts) ? initialReality.accounts.length : 0,
    debts: Array.isArray(initialReality?.debts) ? initialReality.debts.length : 0,
    recurringBills: Array.isArray(initialReality?.recurringBills) ? initialReality.recurringBills.length : 0,
    savingsGoals: Array.isArray(initialReality?.savingsGoals) ? initialReality.savingsGoals.length : 0,
  };
}

function buildPlanDataFromReality(initialReality = {}) {
  const next = JSON.parse(JSON.stringify(initialPlanData));
  const debts = Array.isArray(initialReality?.debts)
    ? initialReality.debts.filter((item) => item?.status !== "closed")
    : [];
  const recurringBills = Array.isArray(initialReality?.recurringBills)
    ? initialReality.recurringBills.filter((item) => item?.isActive !== false)
    : [];
  const savingsGoals = Array.isArray(initialReality?.savingsGoals)
    ? initialReality.savingsGoals.filter((item) => item?.status !== "cancelled")
    : [];

  const debtSection = next.expenses.find((item) => item.id === "exp-5");
  if (debtSection && debts.length > 0) {
    debtSection.details = debts.map((item, index) => {
      const minimum = Number(item.minimumPayment || 0);
      const suggested = Number(item.suggestedMonthlyPayment || 0);
      const amount = minimum > 0 ? minimum : suggested > 0 ? suggested : Number(item.principal || 0);
      return {
        id: `exp-5-det-auto-${index + 1}`,
        name: item.debtName || `Deuda ${index + 1}`,
        edge: "",
        amount: toAmountString(amount),
      };
    });
  }

  if (recurringBills.length > 0) {
    next.expenses.push({
      id: "exp-6",
      name: "Pagos recurrentes (Bills)",
      amount: "0",
      recommendation: "Importado desde tu realidad financiera.",
      expanded: true,
      details: recurringBills.map((item, index) => ({
        id: `exp-6-det-auto-${index + 1}`,
        name: item.billName || `Bill ${index + 1}`,
        edge: "",
        amount: toAmountString(item.amount),
      })),
    });
  }

  const savingsSection = next.savings[0];
  if (savingsSection && savingsGoals.length > 0) {
    savingsSection.details = savingsGoals.map((item, index) => {
      const monthly = Number(item.monthlyTarget || 0);
      const target = Number(item.targetAmount || 0);
      const monthlyFallback = target > 0 ? target / 12 : 0;
      return {
        id: `sav-1-det-auto-${index + 1}`,
        name: item.goalName || `Meta ${index + 1}`,
        edge: "",
        amount: toAmountString(monthly > 0 ? monthly : monthlyFallback),
      };
    });
  }

  return next;
}

function buildRealityForm(initialReality = {}) {
  const toRows = (items, mapRow, fallback) =>
    Array.isArray(items) && items.length > 0 ? items.map(mapRow) : [fallback];

  return {
    accounts: toRows(
      initialReality.accounts,
      (item) => ({
        id: createLocalRowId("acc"),
        persistedId: item.id || null,
        accountName: item.accountName || "",
        balance: toAmountString(item.balance),
        currency: item.currency || "COP",
      }),
      createRealityBaseRow("accounts"),
    ),
    debts: toRows(
      initialReality.debts,
      (item) => ({
        id: createLocalRowId("debt"),
        persistedId: item.id || null,
        debtName: item.debtName || "",
        principal: toAmountString(item.principal),
        interestRateEa: item.interestRateEa === null || item.interestRateEa === undefined ? "" : String(item.interestRateEa),
        minimumPayment: item.minimumPayment === null || item.minimumPayment === undefined ? "" : toAmountString(item.minimumPayment),
        currency: item.currency || "COP",
        debtType: item.debtType || "other",
      }),
      createRealityBaseRow("debts"),
    ),
    recurringBills: toRows(
      initialReality.recurringBills,
      (item) => ({
        id: createLocalRowId("bill"),
        persistedId: item.id || null,
        billName: item.billName || "",
        amount: toAmountString(item.amount),
        frequency: item.frequency || "monthly",
        dueDay: item.dueDay === null || item.dueDay === undefined ? "" : String(item.dueDay),
        currency: item.currency || "COP",
      }),
      createRealityBaseRow("recurringBills"),
    ),
    savingsGoals: toRows(
      initialReality.savingsGoals,
      (item) => ({
        id: createLocalRowId("goal"),
        persistedId: item.id || null,
        goalName: item.goalName || "",
        targetAmount: toAmountString(item.targetAmount),
        monthlyTarget: item.monthlyTarget === null || item.monthlyTarget === undefined ? "" : toAmountString(item.monthlyTarget),
        targetDate: item.targetDate || "",
        currency: item.currency || "COP",
      }),
      createRealityBaseRow("savingsGoals"),
    ),
  };
}

function parsePeriod(period) {
  const hit = String(period || "").match(/^(\d{4})-(\d{2})$/);
  if (!hit) return null;
  const year = Number(hit[1]);
  const month = Number(hit[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return {
    year,
    month: String(month).padStart(2, "0"),
  };
}

function buildPlanDataFromBudget(initialBudget = {}) {
  const safe = initialBudget?.planData;
  if (!safe || typeof safe !== "object") {
    return null;
  }
  const mapSection = (rows) =>
    (Array.isArray(rows) ? rows : []).map((row, index) => ({
      id: row?.id || `plan-${Date.now()}-${index + 1}`,
      name: row?.name || "",
      amount: String(row?.amount ?? "0"),
      recommendation: row?.recommendation || "",
      expanded: row?.expanded !== false,
      details: (Array.isArray(row?.details) ? row.details : []).map((detail, detailIndex) => ({
        id: detail?.id || `detail-${Date.now()}-${detailIndex + 1}`,
        name: detail?.name || "",
        edge: detail?.edge || "",
        amount: String(detail?.amount ?? "0"),
      })),
    }));

  return {
    income: mapSection(safe.income),
    expenses: mapSection(safe.expenses),
    savings: mapSection(safe.savings),
  };
}

function currentMonthYear() {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
  };
}

function formatPeriodLabel(month, year) {
  const monthLabel = monthOptions.find((item) => item.value === month)?.label || "Sin mes";
  if (!year) return monthLabel;
  return `${monthLabel} ${year}`;
}

export default function BudgetWizard({ initialReality = {}, initialBudget = null }) {
  const parsedInitialPeriod = parsePeriod(initialBudget?.period);
  const fallbackPeriod = currentMonthYear();
  const initialMonth = parsedInitialPeriod?.month || fallbackPeriod.month;
  const initialYear = parsedInitialPeriod?.year ? String(parsedInitialPeriod.year) : fallbackPeriod.year;
  const initialPlanFromBudget = buildPlanDataFromBudget(initialBudget);
  const hasBudgetPlan = Boolean(
    initialPlanFromBudget &&
      (initialPlanFromBudget.income.length > 0 ||
        initialPlanFromBudget.expenses.length > 0 ||
        initialPlanFromBudget.savings.length > 0),
  );
  const presetFromBudget = profilePresets[initialBudget?.profileId] || profilePresets.tilbury;

  const [currentStep, setCurrentStep] = useState(1);
  const [profileId, setProfileId] = useState(initialBudget?.profileId || "tilbury");
  const [profileRows, setProfileRows] = useState(() =>
    Array.isArray(initialBudget?.profileRows) && initialBudget.profileRows.length > 0
      ? initialBudget.profileRows.map((row) => ({ ...row }))
      : presetFromBudget.distribution.map((row) => ({ ...row })),
  );
  const [budgetName, setBudgetName] = useState(() => initialBudget?.budgetName || `Presupuesto ${formatPeriodLabel(initialMonth, initialYear)}`);
  const [budgetNote, setBudgetNote] = useState(() => initialBudget?.note || "");
  const [budgetMonth, setBudgetMonth] = useState(initialMonth);
  const [budgetYear, setBudgetYear] = useState(initialYear);
  const [planEdit, setPlanEdit] = useState(false);
  const [planData, setPlanData] = useState(() => (hasBudgetPlan ? initialPlanFromBudget : buildPlanDataFromReality(initialReality)));
  const [planDirty, setPlanDirty] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [activationConfirmed, setActivationConfirmed] = useState(true);
  const [realityCounts, setRealityCounts] = useState(() => buildRealityCounts(initialReality));
  const [realityChoice, setRealityChoice] = useState(initialReality?.needsRealitySetup ? "" : "skip");
  const [realitySaved, setRealitySaved] = useState(!initialReality?.needsRealitySetup);
  const [realitySaving, setRealitySaving] = useState(false);
  const [realityDeletingId, setRealityDeletingId] = useState("");
  const [realityForm, setRealityForm] = useState(() => buildRealityForm(initialReality));
  const needsRealitySetup = Boolean(initialReality?.needsRealitySetup);
  const totalSteps = steps.length;

  const stepMeta = useMemo(() => steps.find((s) => s.id === currentStep) || steps[0], [currentStep]);
  const progress = Math.round((currentStep / totalSteps) * 100);

  function goTo(step) {
    const safeStep = Math.max(1, Math.min(totalSteps, step));
    setCurrentStep(safeStep);
  }

  function handleProfileChange(event) {
    const next = event.target.value;
    setProfileId(next);
    const preset = profilePresets[next];
    if (preset) {
      setProfileRows(preset.distribution.map((row) => ({ ...row })));
    }
  }

  function handleProfilePercentChange(index, value) {
    setProfileRows((rows) =>
      rows.map((row, idx) => (idx === index ? { ...row, percent: value } : row)),
    );
  }

  function formatMoney(value, currency = "COP") {
    const amount = parseAmount(value);
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (_error) {
      return `${currency} ${Math.round(amount).toLocaleString("es-CO")}`;
    }
  }

  function parseAmount(value) {
    if (typeof value === "number") return value;
    const cleaned = String(value ?? "")
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function sumDetails(details) {
    return details.reduce((total, detail) => total + parseAmount(detail.amount), 0);
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function updateRealityRow(section, rowId, field, value) {
    setRealityForm((prev) => ({
      ...prev,
      [section]: prev[section].map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    }));
  }

  function addRealityRow(section) {
    setRealityForm((prev) => ({
      ...prev,
      [section]: [...prev[section], createRealityBaseRow(section)],
    }));
  }

  function removeRealityRow(section, rowId) {
    setRealityForm((prev) => {
      const nextRows = prev[section].filter((row) => row.id !== rowId);
      return {
        ...prev,
        [section]: nextRows.length > 0 ? nextRows : [createRealityBaseRow(section)],
      };
    });
  }

  async function refreshRealitySummary({ replaceForm = false } = {}) {
    const res = await fetch("/api/financial-reality/summary", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || "No se pudo actualizar el resumen.");
    }
    const snapshot = json?.data;
    if (snapshot) {
      if (!planDirty) {
        setPlanData(buildPlanDataFromReality(snapshot));
      }
      setRealityCounts(buildRealityCounts(snapshot));
      if (replaceForm) {
        setRealityForm(buildRealityForm(snapshot));
      }
      setRealitySaved(!snapshot.needsRealitySetup);
    }
    return snapshot;
  }

  async function deleteRealityRow(section, rowId) {
    const row = realityForm[section]?.find((item) => item.id === rowId);
    if (!row) {
      return;
    }

    const persistedId = row.persistedId;
    const confirmed = await confirmDestructiveAction({
      title: persistedId ? "Eliminar registro" : "Quitar registro",
      text: persistedId
        ? "Este registro ya esta guardado. Si lo eliminas no se podra recuperar."
        : "Este registro aun no se ha guardado. Se quitara del formulario.",
      confirmText: persistedId ? "Si, eliminar registro" : "Si, quitar registro",
    });
    if (!confirmed) {
      return;
    }

    if (!persistedId) {
      removeRealityRow(section, rowId);
      return;
    }

    const endpoints = {
      accounts: `/api/accounts/${persistedId}`,
      debts: `/api/debts/${persistedId}`,
      recurringBills: `/api/recurring-bills/${persistedId}`,
      savingsGoals: `/api/savings-goals/${persistedId}`,
    };
    const endpoint = endpoints[section];
    if (!endpoint) {
      return;
    }

    try {
      setRealityDeletingId(rowId);
      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo eliminar el registro.");
      }
      removeRealityRow(section, rowId);
      await refreshRealitySummary({ replaceForm: false });
      await showSuccessMessage({
        title: "Registro eliminado",
        text: "El registro se elimino de tu realidad financiera.",
      });
    } catch (error) {
      await showErrorMessage({
        title: "No se pudo eliminar",
        text: error?.message || "No se pudo eliminar el registro.",
      });
    } finally {
      setRealityDeletingId("");
    }
  }

  function buildRealityPayload() {
    const accounts = realityForm.accounts
      .map((row) => ({
        persistedId: row.persistedId || null,
        accountName: String(row.accountName || "").trim(),
        balance: Number(row.balance),
        currency: row.currency || "COP",
      }))
      .filter((row) => row.accountName && Number.isFinite(row.balance));

    const debts = realityForm.debts
      .map((row) => {
        const principal = Number(row.principal);
        const interestRateEa =
          row.interestRateEa === null || row.interestRateEa === undefined || row.interestRateEa === ""
            ? null
            : Number(row.interestRateEa);
        const minimumPayment =
          row.minimumPayment === null || row.minimumPayment === undefined || row.minimumPayment === ""
            ? null
            : Number(row.minimumPayment);
        return {
          persistedId: row.persistedId || null,
          debtName: String(row.debtName || "").trim(),
          debtType: row.debtType || "other",
          principal,
          interestRateEa,
          minimumPayment,
          currency: row.currency || "COP",
        };
      })
      .filter((row) => row.debtName && Number.isFinite(row.principal) && row.principal > 0);

    const recurringBills = realityForm.recurringBills
      .map((row) => {
        const amount = Number(row.amount);
        const dueDay = row.dueDay === "" ? null : Number(row.dueDay);
        return {
          persistedId: row.persistedId || null,
          billName: String(row.billName || "").trim(),
          amount,
          frequency: row.frequency || "monthly",
          dueDay: dueDay === null || Number.isInteger(dueDay) ? dueDay : null,
          currency: row.currency || "COP",
        };
      })
      .filter((row) => row.billName && Number.isFinite(row.amount) && row.amount >= 0);

    const savingsGoals = realityForm.savingsGoals
      .map((row) => {
        const targetAmount = Number(row.targetAmount);
        const monthlyTarget =
          row.monthlyTarget === null || row.monthlyTarget === undefined || row.monthlyTarget === ""
            ? null
            : Number(row.monthlyTarget);
        return {
          persistedId: row.persistedId || null,
          goalName: String(row.goalName || "").trim(),
          targetAmount,
          monthlyTarget,
          targetDate: row.targetDate || null,
          currency: row.currency || "COP",
        };
      })
      .filter((row) => row.goalName && Number.isFinite(row.targetAmount) && row.targetAmount > 0);

    return { accounts, debts, recurringBills, savingsGoals };
  }

  async function saveRealityData() {
    const payload = buildRealityPayload();
    const totalRows =
      payload.accounts.length +
      payload.debts.length +
      payload.recurringBills.length +
      payload.savingsGoals.length;

    if (totalRows === 0) {
      await showInfoMessage({
        title: "Datos incompletos",
        text: "Agrega al menos un dato valido (cuenta, deuda, bill o meta).",
      });
      return;
    }

    try {
      setRealitySaving(true);
      const res = await fetch("/api/financial-reality/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo guardar");
      }

      const snapshot = json?.data?.snapshot;
      if (snapshot) {
        if (!planDirty) {
          setPlanData(buildPlanDataFromReality(snapshot));
        }
        setRealityCounts(buildRealityCounts(snapshot));
        setRealityForm(buildRealityForm(snapshot));
      }

      const createdCount = ["accounts", "debts", "recurringBills", "savingsGoals"]
        .reduce((sum, key) => sum + Number(json?.data?.created?.[key]?.length || 0), 0);
      const updatedCount = ["accounts", "debts", "recurringBills", "savingsGoals"]
        .reduce((sum, key) => sum + Number(json?.data?.updated?.[key]?.length || 0), 0);
      const skipped = Array.isArray(json?.data?.skipped) ? json.data.skipped : [];
      const duplicateCount = skipped.filter((item) => item?.reason === "duplicate").length;
      const invalidCount = skipped.filter((item) => item?.reason === "invalid_payload").length;
      const skippedCount = skipped.length;

      setRealitySaved(true);
      setRealityChoice("now");
      await showSuccessMessage({
        title: "Realidad guardada",
        text:
          `Creados: ${createdCount}, actualizados: ${updatedCount}, omitidos: ${skippedCount}` +
          (duplicateCount > 0 ? ` (duplicados: ${duplicateCount})` : "") +
          (invalidCount > 0 ? ` (invalidos: ${invalidCount})` : "") +
          ".",
      });
    } catch (error) {
      await showErrorMessage({
        title: "No se pudo guardar",
        text: error?.message || "No se pudo guardar la realidad financiera.",
      });
    } finally {
      setRealitySaving(false);
    }
  }

  function buildBudgetPayload() {
    const year = Number(budgetYear);
    const month = Number(budgetMonth);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Selecciona un periodo valido.");
    }

    if (!String(budgetName || "").trim()) {
      throw new Error("Ingresa un nombre para el presupuesto.");
    }

    return {
      period: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
      budgetName: String(budgetName || "").trim(),
      note: String(budgetNote || "").trim(),
      profileId,
      profileRows,
      incomeTarget: incomeRowsTotal,
      savingsTarget: plannedTotals.savingsTotal,
      currency: "COP",
      startBalance: 0,
      planData,
    };
  }

  async function saveBudget(status) {
    if (status === "active" && !activationConfirmed) {
      await showInfoMessage({
        title: "Confirmacion requerida",
        text: "Debes confirmar la activacion para continuar.",
      });
      return;
    }

    try {
      const payload = buildBudgetPayload();
      setBudgetSaving(true);

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo guardar el presupuesto.");
      }

      const savedPeriod = json?.data?.budget?.period || payload.period;
      const savedStatus = json?.data?.budget?.status || status;
      setPlanDirty(false);
      await showSuccessMessage({
        title: savedStatus === "active" ? "Presupuesto activo" : "Borrador guardado",
        text:
          status === "draft" && savedStatus === "active"
            ? `Cambios guardados en presupuesto activo para ${savedPeriod}.`
            : savedStatus === "active"
              ? `Presupuesto activado para ${savedPeriod}.`
              : `Borrador guardado para ${savedPeriod}.`,
      });

      window.setTimeout(() => {
        window.location.href = `/presupuesto?period=${encodeURIComponent(savedPeriod)}`;
      }, 500);
    } catch (error) {
      await showErrorMessage({
        title: "No se pudo guardar",
        text: error?.message || "No se pudo guardar el presupuesto.",
      });
    } finally {
      setBudgetSaving(false);
    }
  }

  function updateIncomeRow(id, field, value) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      income: prev.income.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  }

  function addIncomeRow() {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      income: [...prev.income, { id: createId("income"), name: "", amount: "0" }],
    }));
  }

  function removeIncomeRow(id) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      income: prev.income.filter((row) => row.id !== id),
    }));
  }

  function updateSubcategory(section, id, field, value) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      [section]: prev[section].map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  }

  function updateDetail(section, subId, detailId, field, value) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      [section]: prev[section].map((row) => {
        if (row.id !== subId) return row;
        return {
          ...row,
          details: row.details.map((detail) =>
            detail.id === detailId ? { ...detail, [field]: value } : detail,
          ),
        };
      }),
    }));
  }

  function addSubcategory(section) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      [section]: [
        ...prev[section],
        {
          id: createId(`${section}-sub`),
          name: "",
          amount: "0",
          recommendation: "",
          expanded: true,
          details: [],
        },
      ],
    }));
  }

  function removeSubcategory(section, subId) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      [section]: prev[section].filter((row) => row.id !== subId),
    }));
  }

  function addDetail(section, subId) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      [section]: prev[section].map((row) => {
        if (row.id !== subId) return row;
        return {
          ...row,
          details: [...row.details, { id: createId(`${section}-detail`), name: "", edge: "", amount: "0" }],
        };
      }),
    }));
  }

  function removeDetail(section, subId, detailId) {
    setPlanDirty(true);
    setPlanData((prev) => ({
      ...prev,
      [section]: prev[section].map((row) => {
        if (row.id !== subId) return row;
        return {
          ...row,
          details: row.details.filter((detail) => detail.id !== detailId),
        };
      }),
    }));
  }

  function toggleSubcategory(section, subId) {
    setPlanData((prev) => ({
      ...prev,
      [section]: prev[section].map((row) =>
        row.id === subId ? { ...row, expanded: !row.expanded } : row,
      ),
    }));
  }

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1, currentYear + 2];
    const selectedYear = Number(budgetYear);
    if (Number.isInteger(selectedYear)) {
      years.push(selectedYear);
    }
    return Array.from(new Set(years))
      .sort((a, b) => a - b)
      .map((item) => String(item));
  }, [budgetYear]);

  const incomeRowsTotal = useMemo(
    () => planData.income.reduce((total, row) => total + parseAmount(row.amount), 0),
    [planData.income],
  );
  const incomeTotal = incomeRowsTotal;
  const plannedTotals = useMemo(() => {
    const sumSection = (section) =>
      section.reduce((total, row) => {
        const rowTotal = row.details.length ? sumDetails(row.details) : parseAmount(row.amount);
        return total + rowTotal;
      }, 0);
    const expensesTotal = sumSection(planData.expenses);
    const savingsTotal = sumSection(planData.savings);
    return {
      expensesTotal,
      savingsTotal,
      total: expensesTotal + savingsTotal,
    };
  }, [planData]);
  const plannedDifference = incomeTotal - plannedTotals.total;
  const selectedPeriodLabel = formatPeriodLabel(budgetMonth, budgetYear);
  const canContinueRealityStep = !needsRealitySetup || realityChoice === "skip" || realitySaved;
  const canActivateBudget = activationConfirmed && !budgetSaving;

  return (
    <article className="panel budget-wizard">
      <div className="wizard-shell">
        <aside className="wizard-sidebar">
          <div className="wizard-brand">
            <span className="wizard-mark">B</span>
            <span className="wizard-name">Crear presupuesto</span>
          </div>

          <div className="wizard-steps">
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isDone = step.id < currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`wizard-step${isActive ? " active" : ""}${isDone ? " done" : ""}`}
                  onClick={() => goTo(step.id)}
                >
                  <span className="wizard-step-index">{isDone ? "✓" : step.id}</span>
                  <span className="wizard-step-text">{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="wizard-progress">
            <div className="wizard-progress-label">
              <span>Progreso</span>
              <span>{currentStep} / {totalSteps}</span>
            </div>
            <div className="wizard-progress-bar">
              <div className="wizard-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </aside>

        <div className="wizard-main">
          <div>
            <span className="wizard-badge">Paso {currentStep} de {totalSteps}</span>
            <h2 className="wizard-title">{stepMeta.title}</h2>
            <p className="wizard-subtitle">{stepMeta.subtitle}</p>
          </div>

          <div className="wizard-step-panel">
            {currentStep === 1 && (
              <div className="wizard-form">
                <div className="info-list" style={{ marginBottom: 16 }}>
                  <div className="info-item"><span>Cuentas</span><strong>{realityCounts.accounts}</strong></div>
                  <div className="info-item"><span>Deudas</span><strong>{realityCounts.debts}</strong></div>
                  <div className="info-item"><span>Bills</span><strong>{realityCounts.recurringBills}</strong></div>
                  <div className="info-item"><span>Metas</span><strong>{realityCounts.savingsGoals}</strong></div>
                </div>

                <div className="panel-soft" style={{ marginBottom: 16 }}>
                  <p className="wizard-hint" style={{ marginBottom: 8 }}>
                    {needsRealitySetup
                      ? "Para un presupuesto limpio, te recomendamos registrar primero tu realidad financiera."
                      : "Ya tienes datos base. Puedes actualizarlos aqui o continuar al presupuesto."}
                  </p>
                  <div className="dashboard-actions" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className={`btn ${realityChoice === "now" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setRealityChoice("now")}
                    >
                      Registrar ahora
                    </button>
                    <button
                      type="button"
                      className={`btn ${realityChoice === "skip" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => {
                        setRealityChoice("skip");
                        setRealitySaved(false);
                      }}
                    >
                      Continuar sin registrar
                    </button>
                  </div>
                </div>

                {realityChoice === "now" && (
                  <>
                    <div className="panel-soft" style={{ marginBottom: 16 }}>
                      <div className="dashboard-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <strong>Cuentas bancarias (nombre y saldo)</strong>
                        <button className="btn btn-ghost" type="button" onClick={() => addRealityRow("accounts")}>
                          + Cuenta
                        </button>
                      </div>
                      {realityForm.accounts.map((row) => (
                        <div key={row.id} className="form-grid" style={{ marginBottom: 8 }}>
                          <input
                            className="input"
                            placeholder="Nombre de cuenta"
                            value={row.accountName}
                            onChange={(event) => updateRealityRow("accounts", row.id, "accountName", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Saldo"
                            value={row.balance}
                            onChange={(event) => updateRealityRow("accounts", row.id, "balance", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Moneda"
                            value={row.currency}
                            onChange={(event) => updateRealityRow("accounts", row.id, "currency", event.target.value)}
                          />
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={realityDeletingId === row.id}
                            onClick={() => deleteRealityRow("accounts", row.id)}
                          >
                            {realityDeletingId === row.id ? "Eliminando..." : row.persistedId ? "Eliminar" : "Quitar"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="panel-soft" style={{ marginBottom: 16 }}>
                      <div className="dashboard-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <strong>Deudas (saldo e interes EA opcional)</strong>
                        <button className="btn btn-ghost" type="button" onClick={() => addRealityRow("debts")}>
                          + Deuda
                        </button>
                      </div>
                      {realityForm.debts.map((row) => (
                        <div key={row.id} className="form-grid" style={{ marginBottom: 8 }}>
                          <input
                            className="input"
                            placeholder="Nombre deuda"
                            value={row.debtName}
                            onChange={(event) => updateRealityRow("debts", row.id, "debtName", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Saldo actual"
                            value={row.principal}
                            onChange={(event) => updateRealityRow("debts", row.id, "principal", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Interes EA (opcional)"
                            value={row.interestRateEa}
                            onChange={(event) => updateRealityRow("debts", row.id, "interestRateEa", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Pago mensual (opcional)"
                            value={row.minimumPayment}
                            onChange={(event) => updateRealityRow("debts", row.id, "minimumPayment", event.target.value)}
                          />
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={realityDeletingId === row.id}
                            onClick={() => deleteRealityRow("debts", row.id)}
                          >
                            {realityDeletingId === row.id ? "Eliminando..." : row.persistedId ? "Eliminar" : "Quitar"}
                          </button>
                        </div>
                      ))}
                      <p className="wizard-hint">Si no indicas interes, el sistema usara 23% EA para estimar cuota mensual.</p>
                    </div>

                    <div className="panel-soft" style={{ marginBottom: 16 }}>
                      <div className="dashboard-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <strong>Pagos recurrentes (Bills)</strong>
                        <button className="btn btn-ghost" type="button" onClick={() => addRealityRow("recurringBills")}>
                          + Bill
                        </button>
                      </div>
                      {realityForm.recurringBills.map((row) => (
                        <div key={row.id} className="form-grid" style={{ marginBottom: 8 }}>
                          <input
                            className="input"
                            placeholder="Concepto"
                            value={row.billName}
                            onChange={(event) => updateRealityRow("recurringBills", row.id, "billName", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Monto"
                            value={row.amount}
                            onChange={(event) => updateRealityRow("recurringBills", row.id, "amount", event.target.value)}
                          />
                          <select
                            className="input"
                            value={row.frequency}
                            onChange={(event) => updateRealityRow("recurringBills", row.id, "frequency", event.target.value)}
                          >
                            <option value="monthly">Mensual</option>
                            <option value="weekly">Semanal</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="yearly">Anual</option>
                          </select>
                          <input
                            className="input"
                            placeholder="Dia pago (1-31)"
                            value={row.dueDay}
                            onChange={(event) => updateRealityRow("recurringBills", row.id, "dueDay", event.target.value)}
                          />
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={realityDeletingId === row.id}
                            onClick={() => deleteRealityRow("recurringBills", row.id)}
                          >
                            {realityDeletingId === row.id ? "Eliminando..." : row.persistedId ? "Eliminar" : "Quitar"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="panel-soft" style={{ marginBottom: 16 }}>
                      <div className="dashboard-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <strong>Metas de ahorro</strong>
                        <button className="btn btn-ghost" type="button" onClick={() => addRealityRow("savingsGoals")}>
                          + Meta
                        </button>
                      </div>
                      {realityForm.savingsGoals.map((row) => (
                        <div key={row.id} className="form-grid" style={{ marginBottom: 8 }}>
                          <input
                            className="input"
                            placeholder="Nombre meta"
                            value={row.goalName}
                            onChange={(event) => updateRealityRow("savingsGoals", row.id, "goalName", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Valor objetivo"
                            value={row.targetAmount}
                            onChange={(event) => updateRealityRow("savingsGoals", row.id, "targetAmount", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Aporte mensual (opcional)"
                            value={row.monthlyTarget}
                            onChange={(event) => updateRealityRow("savingsGoals", row.id, "monthlyTarget", event.target.value)}
                          />
                          <input
                            className="input"
                            type="date"
                            value={row.targetDate}
                            onChange={(event) => updateRealityRow("savingsGoals", row.id, "targetDate", event.target.value)}
                          />
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={realityDeletingId === row.id}
                            onClick={() => deleteRealityRow("savingsGoals", row.id)}
                          >
                            {realityDeletingId === row.id ? "Eliminando..." : row.persistedId ? "Eliminar" : "Quitar"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="dashboard-actions" style={{ marginTop: 8 }}>
                      <button className="btn btn-primary" type="button" onClick={saveRealityData} disabled={realitySaving}>
                        {realitySaving ? "Guardando..." : "Guardar realidad financiera"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="wizard-form">
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label" htmlFor="budget-month">Mes</label>
                    <select
                      id="budget-month"
                      className="input"
                      value={budgetMonth}
                      onChange={(event) => setBudgetMonth(event.target.value)}
                    >
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="wizard-hint">Cada presupuesto se guarda independiente por mes.</p>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="budget-year">Anio</label>
                    <select
                      id="budget-year"
                      className="input"
                      value={budgetYear}
                      onChange={(event) => setBudgetYear(event.target.value)}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <p className="wizard-hint">El presupuesto no replica ingresos automaticamente de otros meses.</p>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="budget-name">Nombre del presupuesto</label>
                  <input
                    id="budget-name"
                    className="input"
                    placeholder="Mi Presupuesto"
                    value={budgetName}
                    onChange={(event) => setBudgetName(event.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="wizard-step-grid">
                <div className="wizard-form">
                  <div className="form-field">
                  <label className="form-label" htmlFor="budget-strategy">Perfil de presupuesto</label>
                  <select id="budget-strategy" className="input" value={profileId} onChange={handleProfileChange}>
                    <option value="tilbury">Perfil Tilbury (1%)</option>
                    <option value="ahorro">Perfil Ahorro Acelerado</option>
                    <option value="inversion">Perfil Inversion Prioritaria</option>
                    <option value="deuda">Perfil Pago de Deudas</option>
                  </select>
                </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="budget-note">Nota para el plan</label>
                    <textarea
                      id="budget-note"
                      className="input"
                      rows={3}
                      value={budgetNote}
                      onChange={(event) => setBudgetNote(event.target.value)}
                    />
                  </div>
                </div>

                <div className="profile-distribution">
                  <div>
                    <h3>Distribucion del perfil</h3>
                    <p>Los porcentajes son editables; si cambias el perfil, la distribucion se ajusta.</p>
                  </div>
                  <div className="profile-dist-grid">
                    {profileRows.map((row, index) => (
                      <div key={`${row.label}-${index}`} className="profile-row">
                        <span className="profile-label">{row.label}</span>
                        <input
                          className="profile-input"
                          value={row.percent}
                          onChange={(event) => handleProfilePercentChange(index, event.target.value)}
                        />
                        <span className="profile-note">{row.note}</span>
                      </div>
                    ))}
                  </div>
                  <p className="wizard-hint">El perfil solo genera sugerencias y alertas; puedes modificar los porcentajes.</p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="wizard-form">
                <div className="plan-toolbar">
                  <div>
                    <p className="plan-title">Valores planificados</p>
                    <p className="wizard-hint">Completa valores por categoria para este mes.</p>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-secondary${planEdit ? " is-active" : ""}`}
                    onClick={() => setPlanEdit((prev) => !prev)}
                  >
                    {planEdit ? "Salir de edicion" : "Editar rubros"}
                  </button>
                </div>
                <div className="balance-meter">
                  <div className="bm-row">
                    <div className="bm-col">
                      <div className="bm-label">Ingresos totales</div>
                      <div className="bm-val teal">{formatMoney(incomeTotal)}</div>
                    </div>
                    <div className="bm-col">
                      <div className="bm-label">Total planificado</div>
                      <div className="bm-val">{formatMoney(plannedTotals.total)}</div>
                    </div>
                    <div className="bm-col">
                      <div className="bm-label">Diferencia (debe ser 0)</div>
                      <div className="bm-val warn">{formatMoney(plannedDifference)}</div>
                    </div>
                  </div>
                  <div className="bm-hint">Completa los valores planificados para que la diferencia quede en $ 0.</div>
                </div>

                <table className="budget-table" style={{ marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 240 }}>Categoria / Rubro</th>
                      <th className="cell-right" style={{ width: 140 }}>Valor plan</th>
                    </tr>
                  </thead>
                  <tbody className="bt-income-block">
                    <tr className="bt-cat">
                      <td colSpan={2}>
                        <div className="bt-group-head">
                          <span className="bt-cat-title">↑ Ingresos</span>
                          <div className="bt-group-actions">
                            <span className="bt-group-hint">Editar rubros</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {planData.income.map((row) => (
                      <tr key={row.id} className="bt-sub">
                        <td>
                          {planEdit ? (
                            <div className="bt-edit-row">
                              <input
                                className="bt-name-input"
                                placeholder="Nuevo detalle"
                                value={row.name}
                                onChange={(event) => updateIncomeRow(row.id, "name", event.target.value)}
                              />
                              <button
                                type="button"
                                className="bt-remove sm"
                                onClick={() => removeIncomeRow(row.id)}
                                aria-label="Eliminar detalle"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="bt-sub-name">{row.name || "Sin nombre"}</div>
                          )}
                        </td>
                        <td className="cell-right">
                          <input
                            className="bt-plan"
                            value={row.amount}
                            onChange={(event) => updateIncomeRow(row.id, "amount", event.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    {planEdit && (
                      <tr className="bt-sub-add-row">
                        <td colSpan={2}>
                          <button type="button" className="bt-add-btn" onClick={addIncomeRow}>
                            + Agregar detalle de ingreso
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <table className="budget-table">
                  <thead>
                    <tr>
                      <th style={{ width: 260 }}>Gastos y Ahorro</th>
                      <th className="cell-right" style={{ width: 150 }}>Plan (este mes)</th>
                      <th className="bt-rec-col">Recomendaciones del perfil</th>
                    </tr>
                  </thead>
                  <tbody className="bt-group-head">
                    <tr className="bt-cat">
                      <td colSpan={3}>
                        <div className="bt-group-head">
                          <span className="bt-cat-title">↓ Gastos</span>
                          <div className="bt-group-actions">
                            <span className="bt-group-hint">Editar rubros</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>

                  {planData.expenses.map((row) => {
                    const rowTotal = row.details.length ? sumDetails(row.details) : parseAmount(row.amount);
                    return (
                    <tbody key={row.id} className={`bt-sub-block${row.expanded ? "" : " collapsed"}`}>
                      <tr className="bt-sub-row">
                        <td>
                          <div className="bt-tree-node">
                            <button
                              type="button"
                              className="bt-toggle"
                              aria-label="Expandir o colapsar"
                              aria-expanded={row.expanded}
                              onClick={() => toggleSubcategory("expenses", row.id)}
                            ></button>
                            {planEdit ? (
                              <div className="bt-edit-row">
                                <input
                                  className="bt-name-input"
                                  placeholder="Nueva subcategoria"
                                  value={row.name}
                                  onChange={(event) => updateSubcategory("expenses", row.id, "name", event.target.value)}
                                />
                                <button
                                  type="button"
                                  className="bt-remove"
                                  onClick={() => removeSubcategory("expenses", row.id)}
                                  aria-label="Eliminar subcategoria"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <span className="bt-sub-name">{row.name || "Sin nombre"}</span>
                            )}
                          </div>
                        </td>
                        <td className="cell-right">
                          <input
                            className="bt-plan"
                            value={String(rowTotal)}
                            readOnly={row.details.length > 0}
                            onChange={(event) => updateSubcategory("expenses", row.id, "amount", event.target.value)}
                          />
                        </td>
                        <td className="bt-rec-col" style={{ fontSize: 11, color: "var(--ink3)" }}>
                          {row.recommendation}
                        </td>
                      </tr>
                      {row.details.map((detail) => (
                        <tr key={detail.id} className="bt-detail-row">
                          <td>
                            <div className="bt-tree-node">
                              <span className="bt-tree-branch"></span>
                              {planEdit ? (
                                <div className="bt-edit-row">
                                  <input
                                    className="bt-detail-input"
                                    placeholder="Nuevo detalle"
                                    value={detail.name}
                                    onChange={(event) =>
                                      updateDetail("expenses", row.id, detail.id, "name", event.target.value)
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="bt-remove sm"
                                    onClick={() => removeDetail("expenses", row.id, detail.id)}
                                    aria-label="Eliminar detalle"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <span className="bt-detail-name">{detail.name || "Sin nombre"}</span>
                              )}
                            </div>
                          </td>
                          <td className="cell-right">
                            <input
                              className="bt-detail-value"
                              value={detail.amount}
                              onChange={(event) =>
                                updateDetail("expenses", row.id, detail.id, "amount", event.target.value)
                              }
                            />
                          </td>
                          <td className="bt-detail-note">
                            {planEdit ? (
                              <input
                                className="bt-detail-input"
                                placeholder="Arista (opcional)"
                                value={detail.edge || ""}
                                onChange={(event) =>
                                  updateDetail("expenses", row.id, detail.id, "edge", event.target.value)
                                }
                              />
                            ) : (
                              <span>{detail.edge || ""}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {planEdit && (
                        <tr className="bt-detail-add-row">
                          <td>
                            <button type="button" className="bt-add-btn" onClick={() => addDetail("expenses", row.id)}>
                              + Agregar detalle
                            </button>
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  );
                  })}

                  {planEdit && (
                    <tbody className="bt-sub-add-row">
                      <tr className="bt-sub-add-row">
                        <td colSpan={3}>
                          <button type="button" className="bt-add-btn" onClick={() => addSubcategory("expenses")}>
                            + Agregar subcategoria
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  )}

                  <tbody className="bt-group-head">
                    <tr className="bt-cat">
                      <td colSpan={3}>
                        <div className="bt-group-head">
                          <span className="bt-cat-title">Ahorro</span>
                          <div className="bt-group-actions">
                            <span className="bt-group-hint">Editar rubros</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>

                  {planData.savings.map((row) => {
                    const rowTotal = row.details.length ? sumDetails(row.details) : parseAmount(row.amount);
                    return (
                    <tbody key={row.id} className={`bt-sub-block${row.expanded ? "" : " collapsed"}`}>
                      <tr className="bt-sub-row">
                        <td>
                          <div className="bt-tree-node">
                            <button
                              type="button"
                              className="bt-toggle"
                              aria-label="Expandir o colapsar"
                              aria-expanded={row.expanded}
                              onClick={() => toggleSubcategory("savings", row.id)}
                            ></button>
                            {planEdit ? (
                              <div className="bt-edit-row">
                                <input
                                  className="bt-name-input"
                                  placeholder="Nueva subcategoria"
                                  value={row.name}
                                  onChange={(event) => updateSubcategory("savings", row.id, "name", event.target.value)}
                                />
                                <button
                                  type="button"
                                  className="bt-remove"
                                  onClick={() => removeSubcategory("savings", row.id)}
                                  aria-label="Eliminar subcategoria"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <span className="bt-sub-name">{row.name || "Sin nombre"}</span>
                            )}
                          </div>
                        </td>
                        <td className="cell-right">
                          <input
                            className="bt-plan"
                            value={String(rowTotal)}
                            readOnly={row.details.length > 0}
                            onChange={(event) => updateSubcategory("savings", row.id, "amount", event.target.value)}
                          />
                        </td>
                        <td className="bt-rec-col"></td>
                      </tr>
                      {row.details.map((detail) => (
                        <tr key={detail.id} className="bt-detail-row">
                          <td>
                            <div className="bt-tree-node">
                              <span className="bt-tree-branch"></span>
                              {planEdit ? (
                                <div className="bt-edit-row">
                                  <input
                                    className="bt-detail-input"
                                    placeholder="Nuevo detalle"
                                    value={detail.name}
                                    onChange={(event) =>
                                      updateDetail("savings", row.id, detail.id, "name", event.target.value)
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="bt-remove sm"
                                    onClick={() => removeDetail("savings", row.id, detail.id)}
                                    aria-label="Eliminar detalle"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <span className="bt-detail-name">{detail.name || "Sin nombre"}</span>
                              )}
                            </div>
                          </td>
                          <td className="cell-right">
                            <input
                              className="bt-detail-value"
                              value={detail.amount}
                              onChange={(event) =>
                                updateDetail("savings", row.id, detail.id, "amount", event.target.value)
                              }
                            />
                          </td>
                          <td className="bt-detail-note">
                            {planEdit ? (
                              <input
                                className="bt-detail-input"
                                placeholder="Arista (opcional)"
                                value={detail.edge || ""}
                                onChange={(event) =>
                                  updateDetail("savings", row.id, detail.id, "edge", event.target.value)
                                }
                              />
                            ) : (
                              <span>{detail.edge || ""}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {planEdit && (
                        <tr className="bt-detail-add-row">
                          <td>
                            <button type="button" className="bt-add-btn" onClick={() => addDetail("savings", row.id)}>
                              + Agregar detalle
                            </button>
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  );
                  })}

                  {planEdit && (
                    <tbody className="bt-sub-add-row">
                      <tr className="bt-sub-add-row">
                        <td colSpan={3}>
                          <button type="button" className="bt-add-btn" onClick={() => addSubcategory("savings")}>
                            + Agregar subcategoria
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
            )}

            {currentStep === 5 && (
              <div className="wizard-form">
                <div className="info-list">
                  <div className="info-item"><span>Periodo</span><strong>{selectedPeriodLabel}</strong></div>
                  <div className="info-item"><span>Ingreso mensual</span><strong>{formatMoney(incomeTotal)}</strong></div>
                  <div className="info-item"><span>Ahorro planificado</span><strong>{formatMoney(plannedTotals.savingsTotal)}</strong></div>
                  <div className="info-item"><span>Compromisos base</span><strong>{realityCounts.debts + realityCounts.recurringBills}</strong></div>
                </div>
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={activationConfirmed}
                    onChange={(event) => setActivationConfirmed(event.target.checked)}
                  />
                  Confirmo que revise el plan y quiero activarlo.
                </label>
              </div>
            )}
          </div>

          <div className="dashboard-actions wizard-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => goTo(currentStep - 1)}
              disabled={currentStep === 1 || budgetSaving}
            >
              Atras
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={budgetSaving}
              onClick={() => saveBudget("draft")}
            >
              {budgetSaving ? "Guardando..." : "Guardar borrador"}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={(currentStep === 1 && !canContinueRealityStep) || budgetSaving || (currentStep === totalSteps && !canActivateBudget)}
              onClick={() => {
                if (currentStep < totalSteps) {
                  goTo(currentStep + 1);
                  return;
                }
                saveBudget("active");
              }}
            >
              {budgetSaving ? "Guardando..." : currentStep === totalSteps ? "Activar presupuesto" : "Continuar"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
