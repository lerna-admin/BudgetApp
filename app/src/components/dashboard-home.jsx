"use client";

import { useEffect, useMemo, useState } from "react";
import MobileMenuToggle from "./mobile-menu-toggle";

function formatCurrency(value, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
  } catch (_e) {
    return `${currency} ${value}`;
  }
}

const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatPeriodLabel(period) {
  const hit = String(period || "").match(/^(\d{4})-(\d{2})$/);
  if (!hit) {
    return "Sin periodo";
  }
  const month = Number(hit[2]);
  const year = Number(hit[1]);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return period;
  }
  return `${monthLabels[month - 1]} ${year}`;
}

function formatPeriodShort(period) {
  const hit = String(period || "").match(/^(\d{4})-(\d{2})$/);
  if (!hit) {
    return "--";
  }
  const month = Number(hit[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return period;
  }
  return `${monthLabels[month - 1].slice(0, 3)} ${hit[1].slice(-2)}`;
}

function movementTypeLabel(type) {
  if (type === "income") return "Ingreso";
  if (type === "expense") return "Gasto";
  if (type === "saving") return "Ahorro";
  if (type === "investment") return "Inversion";
  if (type === "transfer") return "Transferencia";
  return "Movimiento";
}

function getMonthKey(dateLike) {
  const value = String(dateLike || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 7);
  }
  return "";
}

function buildRecentPeriods(size = 6) {
  const periods = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  for (let index = size - 1; index >= 0; index -= 1) {
    const point = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    const period = `${point.getFullYear()}-${String(point.getMonth() + 1).padStart(2, "0")}`;
    periods.push(period);
  }
  return periods;
}

function formatSignedCurrency(value, currency = "COP") {
  const amount = Number(value || 0);
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatCurrency(amount, currency)}`;
}

function alertClass(level) {
  if (level === "high") return "alert-high";
  if (level === "medium") return "alert-medium";
  return "alert-info";
}

export default function DashboardHome({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [realitySnapshot, setRealitySnapshot] = useState(null);
  const [budgetSnapshot, setBudgetSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [expRes, realityRes, budgetRes] = await Promise.all([
          fetch("/api/expenses", { cache: "no-store" }),
          fetch("/api/financial-reality/summary", { cache: "no-store" }),
          fetch("/api/budgets/current", { cache: "no-store" }),
        ]);
        if (!expRes.ok || !realityRes.ok) throw new Error();
        const expJson = await expRes.json();
        const realityJson = await realityRes.json();
        const budgetJson = budgetRes.ok ? await budgetRes.json() : { data: null };
        setExpenses(expJson.data || []);
        setRealitySnapshot(realityJson?.data || null);
        setBudgetSnapshot(budgetJson?.data || null);
        setError("");
      } catch (_e) {
        setError("No pudimos cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const budget = budgetSnapshot?.budget || null;
  const budgetOverview = budgetSnapshot?.overview || null;
  const budgetCategories = Array.isArray(budgetSnapshot?.categories) ? budgetSnapshot.categories : [];
  const activePeriod = budget?.period || new Date().toISOString().slice(0, 7);

  const accountBalance = Number(realitySnapshot?.totals?.accountBalance || 0);
  const debtPrincipal = Number(realitySnapshot?.totals?.debtPrincipal || 0);
  const debtMonthly = Number(realitySnapshot?.totals?.debtMonthly || 0);
  const recurringBillsMonthly = Number(realitySnapshot?.totals?.recurringBillsMonthly || 0);
  const savingsMonthlyTarget = Number(realitySnapshot?.totals?.savingsMonthlyTarget || 0);
  const accountsCount = Number(realitySnapshot?.counts?.accounts || 0);
  const debtsCount = Number(realitySnapshot?.counts?.debts || 0);
  const recurringCount = Number(realitySnapshot?.counts?.recurringBills || 0);
  const goals = Array.isArray(realitySnapshot?.savingsGoals) ? realitySnapshot.savingsGoals : [];

  const recentPeriods = useMemo(() => buildRecentPeriods(6), []);
  const monthlySeries = useMemo(() => {
    const seed = {};
    recentPeriods.forEach((period) => {
      seed[period] = { period, income: 0, outflow: 0, net: 0 };
    });
    expenses.forEach((item) => {
      const period = getMonthKey(item.date);
      const hit = seed[period];
      if (!hit) return;
      const amount = Number(item.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return;
      if (item.movementType === "income") {
        hit.income += amount;
      } else if (item.movementType === "expense" || item.movementType === "saving" || item.movementType === "investment") {
        hit.outflow += amount;
      }
    });
    return recentPeriods.map((period) => {
      const row = seed[period];
      return {
        ...row,
        net: row.income - row.outflow,
      };
    });
  }, [expenses, recentPeriods]);

  const maxMonthlyScale = useMemo(() => {
    const maxValue = monthlySeries.reduce((max, row) => {
      return Math.max(max, row.income, row.outflow, Math.abs(row.net));
    }, 0);
    return maxValue > 0 ? maxValue : 1;
  }, [monthlySeries]);

  const periodActivity = useMemo(() => {
    return expenses.reduce(
      (acc, item) => {
        if (getMonthKey(item.date) !== activePeriod) {
          return acc;
        }
        const amount = Number(item.amount || 0);
        if (!Number.isFinite(amount)) return acc;
        if (item.movementType === "income") {
          acc.income += amount;
        } else if (item.movementType === "expense" || item.movementType === "saving" || item.movementType === "investment") {
          acc.outflow += amount;
        }
        return acc;
      },
      { income: 0, outflow: 0 },
    );
  }, [activePeriod, expenses]);

  const goalsSummary = useMemo(() => {
    const activeGoals = goals.filter((item) => item.status !== "cancelled");
    const current = activeGoals.reduce((sum, item) => sum + Number(item.currentAmount || 0), 0);
    const target = activeGoals.reduce((sum, item) => sum + Number(item.targetAmount || 0), 0);
    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      activeGoals,
      current,
      target,
      progress,
    };
  }, [goals]);

  const commitmentsMonthly = debtMonthly + recurringBillsMonthly;
  const periodIncome = budgetOverview ? Number(budgetOverview.actual?.income || 0) : periodActivity.income;
  const periodOutflow = budgetOverview ? Number(budgetOverview.actual?.outflow || 0) : periodActivity.outflow;
  const periodNet = budgetOverview ? Number(budgetOverview.actual?.difference || 0) : periodIncome - periodOutflow;
  const outflowVariance = budgetOverview ? Number(budgetOverview.variance?.outflow || 0) : 0;
  const incomeVariance = budgetOverview ? Number(budgetOverview.variance?.income || 0) : 0;

  const budgetRiskRows = useMemo(() => {
    return budgetCategories
      .filter((item) => item.kind !== "income")
      .filter((item) => Number(item.planned || 0) > 0 || Number(item.actual || 0) > 0)
      .map((item) => {
        const planned = Number(item.planned || 0);
        const actual = Number(item.actual || 0);
        const diff = actual - planned;
        const progress = planned > 0 ? Math.round((actual / planned) * 100) : (actual > 0 ? 100 : 0);
        return {
          id: item.id,
          name: item.name,
          planned,
          actual,
          diff,
          progress: Math.max(0, Math.min(300, progress)),
        };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 6);
  }, [budgetCategories]);

  const alerts = useMemo(() => {
    const list = [];

    if (!budget) {
      list.push({
        id: "missing-budget",
        level: "medium",
        title: "Sin presupuesto activo",
        text: "Crea o activa un presupuesto para detectar sobregasto por rubro.",
      });
    }

    if (budgetOverview && outflowVariance > 0) {
      list.push({
        id: "outflow-over",
        level: "high",
        title: "Sobregasto en egresos",
        text: `Estas por encima del plan en ${formatCurrency(outflowVariance)}.`,
      });
    }

    if (budgetOverview && incomeVariance < 0) {
      list.push({
        id: "income-under",
        level: "medium",
        title: "Ingreso por debajo del plan",
        text: `Te faltan ${formatCurrency(Math.abs(incomeVariance))} para cumplir el ingreso esperado.`,
      });
    }

    const overspent = budgetRiskRows.filter((item) => item.diff > 0).slice(0, 2);
    overspent.forEach((item) => {
      list.push({
        id: `cat-over-${item.id}`,
        level: item.diff > item.planned * 0.2 ? "high" : "medium",
        title: `Rubro excedido: ${item.name}`,
        text: `Exceso de ${formatCurrency(item.diff)} frente al plan.`,
      });
    });

    if (commitmentsMonthly > 0 && periodIncome > 0 && commitmentsMonthly / periodIncome > 0.6) {
      list.push({
        id: "commitment-stress",
        level: "high",
        title: "Compromisos mensuales altos",
        text: `Deudas + recurrentes consumen ${Math.round((commitmentsMonthly / periodIncome) * 100)}% de tus ingresos del periodo.`,
      });
    }

    if (accountBalance <= 0) {
      list.push({
        id: "negative-balance",
        level: "high",
        title: "Saldo disponible critico",
        text: "Tu saldo total en cuentas esta en cero o negativo.",
      });
    }

    if (!list.length) {
      list.push({
        id: "all-good",
        level: "info",
        title: "Sin alertas criticas",
        text: "Tu ejecucion va dentro de rangos esperados para el periodo.",
      });
    }

    return list.slice(0, 6);
  }, [accountBalance, budget, budgetOverview, budgetRiskRows, commitmentsMonthly, incomeVariance, outflowVariance, periodIncome]);

  const healthSummary = useMemo(() => {
    let score = 0;
    if (accountBalance > 0) score += 1;
    if (periodNet >= 0) score += 1;
    if (outflowVariance <= 0) score += 1;
    if (commitmentsMonthly > 0 && periodIncome > 0 && commitmentsMonthly / periodIncome <= 0.5) score += 1;
    if (debtPrincipal === 0 || debtPrincipal < accountBalance * 1.5) score += 1;

    if (score >= 4) {
      return { label: "Estable", className: "health-good", hint: "Mantienes control de flujo y compromisos." };
    }
    if (score >= 2) {
      return { label: "Atencion", className: "health-warn", hint: "Hay desviaciones que requieren ajuste esta semana." };
    }
    return { label: "Riesgo alto", className: "health-bad", hint: "Prioriza recorte de egresos y orden de pagos." };
  }, [accountBalance, commitmentsMonthly, debtPrincipal, outflowVariance, periodIncome, periodNet]);

  const recent = expenses.slice(0, 5);
  const currency = budget?.currency || "COP";

  return (
    <main className="dashboard-main">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <MobileMenuToggle />
          <div className="dashboard-heading">
            <p className="dashboard-path">Dashboard / Sesion activa</p>
            <h1 className="dashboard-title">Centro de control financiero</h1>
          </div>
        </div>
        <div className="dashboard-actions">
          <a href="/gastos" className="btn btn-secondary">+ Nuevo movimiento</a>
          <a href="/presupuesto" className="btn btn-primary">Presupuesto mensual</a>
        </div>
      </header>

      <section className="panel-soft dashboard-insight-strip">
        <div>
          <p className="dashboard-path">Hola, {user?.name || "usuario"}.</p>
          <p className="dashboard-lead">
            Vista consolidada de realidad, presupuesto y alertas para decidir pagos y ahorros sin perder control.
          </p>
        </div>
        <span className={`health-pill ${healthSummary.className}`}>{healthSummary.label}</span>
        <p className="dashboard-lead dashboard-lead-compact">{healthSummary.hint}</p>
      </section>

      <section className="dashboard-kpis dashboard-kpis-extended">
        <article className="kpi-card">
          <p>Saldo en cuentas</p>
          <strong className={accountBalance >= 0 ? "pos" : "neg"}>{formatCurrency(accountBalance, currency)}</strong>
        </article>
        <article className="kpi-card">
          <p>Flujo neto ({formatPeriodShort(activePeriod)})</p>
          <strong className={periodNet >= 0 ? "pos" : "neg"}>{formatSignedCurrency(periodNet, currency)}</strong>
        </article>
        <article className="kpi-card">
          <p>Variacion egresos vs plan</p>
          <strong className={outflowVariance <= 0 ? "pos" : "neg"}>
            {budgetOverview ? formatSignedCurrency(outflowVariance, currency) : "Sin presupuesto"}
          </strong>
        </article>
        <article className="kpi-card">
          <p>Deuda pendiente</p>
          <strong className="neg">{formatCurrency(debtPrincipal, currency)}</strong>
        </article>
        <article className="kpi-card">
          <p>Avance metas de ahorro</p>
          <strong className="pos">
            {goalsSummary.target > 0
              ? `${goalsSummary.progress}% · ${formatCurrency(goalsSummary.current, currency)}`
              : "Sin metas"}
          </strong>
        </article>
        <article className="kpi-card">
          <p>Compromisos fijos mensuales</p>
          <strong>{formatCurrency(commitmentsMonthly, currency)}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Alertas prioritarias</h2>
            <a href="/gastos">Registrar ajuste</a>
          </div>
          <div className="dashboard-alert-list">
            {alerts.map((alert) => (
              <article key={alert.id} className={`dashboard-alert-item ${alertClass(alert.level)}`}>
                <div>
                  <p className="dashboard-alert-title">{alert.title}</p>
                  <p className="dashboard-alert-copy">{alert.text}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Flujo mensual (6 meses)</h2>
            <a href="/gastos">Ver movimientos</a>
          </div>
          <div className="cashflow-chart">
            {monthlySeries.map((row) => {
              const incomeHeight = Math.max(4, Math.round((row.income / maxMonthlyScale) * 100));
              const outflowHeight = Math.max(4, Math.round((row.outflow / maxMonthlyScale) * 100));
              return (
                <article key={row.period} className="cashflow-col">
                  <div className="cashflow-bars">
                    <span className="cashflow-bar cashflow-income" style={{ height: `${incomeHeight}%` }}></span>
                    <span className="cashflow-bar cashflow-outflow" style={{ height: `${outflowHeight}%` }}></span>
                  </div>
                  <p className={`cashflow-net ${row.net >= 0 ? "pos" : "neg"}`}>
                    {formatSignedCurrency(row.net, currency)}
                  </p>
                  <p className="cashflow-label">{formatPeriodShort(row.period)}</p>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-wide">
        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Presupuesto vs real</h2>
            <a href="/presupuesto">Ver detalle</a>
          </div>
          {budget && budgetOverview ? (
            <div className="bar-listing">
              <div className="info-item">
                <span>Periodo</span>
                <strong>{formatPeriodLabel(budget.period)}</strong>
              </div>
              <div className="info-item">
                <span>Ingreso (plan / real)</span>
                <strong>{formatCurrency(budgetOverview.planned.income, currency)} / {formatCurrency(budgetOverview.actual.income, currency)}</strong>
              </div>
              <div className="info-item">
                <span>Egresos (plan / real)</span>
                <strong>{formatCurrency(budgetOverview.planned.outflow, currency)} / {formatCurrency(budgetOverview.actual.outflow, currency)}</strong>
              </div>
              {budgetRiskRows.length > 0 ? (
                <div className="category-health-list">
                  {budgetRiskRows.map((row) => {
                    const safeProgress = Math.max(0, Math.min(100, row.progress));
                    const state = row.diff > 0 ? "neg" : "pos";
                    return (
                      <article key={row.id} className="category-health-item">
                        <div className="bar-meta">
                          <span>{row.name}</span>
                          <strong className={state}>
                            {formatCurrency(row.actual, currency)} / {formatCurrency(row.planned, currency)}
                          </strong>
                        </div>
                        <div className="bar-track">
                          <span
                            className={`bar-fill ${row.diff > 0 ? "bar-over" : "bar-safe"}`}
                            style={{ width: `${safeProgress}%` }}
                          ></span>
                        </div>
                        <p className={`dashboard-mini-note ${state}`}>
                          {row.diff > 0
                            ? `Exceso: ${formatCurrency(row.diff, currency)}`
                            : `Disponible: ${formatCurrency(Math.abs(row.diff), currency)}`}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="dashboard-empty">Aun no hay rubros para comparar en este periodo.</div>
              )}
            </div>
          ) : (
            <div className="dashboard-empty">
              No hay presupuesto activo para esta vista.
              <div style={{ marginTop: 10 }}>
                <a href="/presupuesto" className="btn btn-primary">Crear presupuesto</a>
              </div>
            </div>
          )}
        </article>

        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Realidad financiera</h2>
            <a href="/bancos">Configurar</a>
          </div>
          <div className="reality-grid">
            <article className="reality-item">
              <p>Cuentas</p>
              <strong>{accountsCount}</strong>
              <span>{formatCurrency(accountBalance, currency)}</span>
            </article>
            <article className="reality-item">
              <p>Deudas activas</p>
              <strong>{debtsCount}</strong>
              <span>{formatCurrency(debtPrincipal, currency)}</span>
            </article>
            <article className="reality-item">
              <p>Pagos recurrentes</p>
              <strong>{recurringCount}</strong>
              <span>{formatCurrency(recurringBillsMonthly, currency)} / mes</span>
            </article>
            <article className="reality-item">
              <p>Metas activas</p>
              <strong>{goalsSummary.activeGoals.length}</strong>
              <span>{formatCurrency(savingsMonthlyTarget, currency)} / mes</span>
            </article>
          </div>
          <div className="chip-row" style={{ marginTop: 10 }}>
            <a href="/bancos" className="chip expense-filter-chip">Cuentas</a>
            <a href="/deudas" className="chip expense-filter-chip">Deudas</a>
            <a href="/gastos" className="chip expense-filter-chip">Movimientos</a>
            <a href="/presupuesto" className="chip expense-filter-chip">Presupuesto</a>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-wide">
        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Metas de ahorro</h2>
            <a href="/presupuesto">Ver metas</a>
          </div>
          {goalsSummary.activeGoals.length === 0 ? (
            <div className="dashboard-empty">No tienes metas de ahorro activas.</div>
          ) : (
            <div className="goal-progress-list">
              {goalsSummary.activeGoals.slice(0, 5).map((goal) => {
                const current = Number(goal.currentAmount || 0);
                const target = Number(goal.targetAmount || 0);
                const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return (
                  <article key={goal.id} className="goal-progress-item">
                    <div className="bar-meta">
                      <span>{goal.goalName}</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="bar-track">
                      <span className="bar-fill bar-safe" style={{ width: `${progress}%` }}></span>
                    </div>
                    <p className="dashboard-mini-note">
                      {formatCurrency(current, goal.currency)} de {formatCurrency(target, goal.currency)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </article>

        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Movimientos recientes</h2>
            <a href="/gastos">Ir al registro</a>
          </div>
          {loading ? (
            <div className="dashboard-empty">Cargando movimientos...</div>
          ) : error ? (
            <div className="message message-error">{error}</div>
          ) : recent.length === 0 ? (
            <div className="dashboard-empty">Aun no hay movimientos.</div>
          ) : (
            <div className="movement-list">
              {recent.map((item) => {
                const isExpense = item.movementType === "expense";
                const isSaving = item.movementType === "saving" || item.movementType === "investment";
                const cls = isExpense ? "neg" : isSaving ? "pos" : "pos";
                const prefix = isExpense ? "-" : "+";
                return (
                  <div key={item.id} className="movement-item">
                    <div>
                      <p className="movement-name">{item.detail}</p>
                      <p className="movement-meta">{movementTypeLabel(item.movementType)} · {item.subcategory || "Sin subcategoria"}</p>
                    </div>
                    <p className={`movement-amount ${cls}`}>{prefix}{formatCurrency(item.amount, item.currency || currency)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
