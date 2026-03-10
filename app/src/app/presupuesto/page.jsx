import { redirect } from "next/navigation";

import AppShell from "../../components/app-shell";
import BudgetWizard from "../../components/budget-wizard";
import DashboardSidebar from "../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";
import { getBudgetPerformanceForPeriod, getCurrentBudgetPerformance } from "../../lib/server/budgets-repository";
import { getFinancialRealitySnapshot } from "../../lib/server/financial-reality-repository";
import { getSessionUser } from "../../lib/server/session-user";

const MONTHS = [
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

function formatPeriod(period) {
  const hit = String(period || "").match(/^(\d{4})-(\d{2})$/);
  if (!hit) {
    return "Sin periodo";
  }
  const year = Number(hit[1]);
  const month = Number(hit[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return period;
  }
  return `${MONTHS[month - 1]} ${year}`;
}

function parsePeriodValue(rawValue) {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const hit = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!hit) {
    return "";
  }
  const year = Number(hit[1]);
  const month = Number(hit[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatMoney(value, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch (_error) {
    return `${currency} ${Number(value || 0)}`;
  }
}

function balanceStyle(value) {
  if (value >= 0) {
    return "budget-pill ok";
  }
  return "budget-pill warn";
}

function typeLabel(kind) {
  if (kind === "income") return "Ingreso";
  if (kind === "saving") return "Ahorro";
  return "Gasto";
}

export default async function BudgetPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/presupuesto");
  }
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedPeriod = parsePeriodValue(resolvedSearchParams?.period);

  let financialReality = {
    counts: { accounts: 0, debts: 0, recurringBills: 0, savingsGoals: 0 },
    totals: { accountBalance: 0, debtPrincipal: 0, debtMonthly: 0, recurringBillsMonthly: 0, savingsMonthlyTarget: 0 },
    missing: { accounts: true, debts: true, recurringBills: true, savingsGoals: true },
    needsRealitySetup: true,
    accounts: [],
    debts: [],
    recurringBills: [],
    savingsGoals: [],
  };

  let budgetPerformance = null;

  try {
    const [reality, budgetDataByPeriod, currentBudgetData] = await Promise.all([
      getFinancialRealitySnapshot({ userId: user.id }),
      requestedPeriod ? getBudgetPerformanceForPeriod({ userId: user.id, period: requestedPeriod }) : Promise.resolve(null),
      getCurrentBudgetPerformance({ userId: user.id }),
    ]);
    financialReality = reality;
    budgetPerformance = budgetDataByPeriod || currentBudgetData;
  } catch (error) {
    console.error("Unable to load budget page data", error);
  }

  const currentBudget = budgetPerformance?.budget || null;
  const rows = Array.isArray(budgetPerformance?.categories) ? budgetPerformance.categories : [];
  const hasBudget = Boolean(currentBudget);
  const periodLabel = currentBudget ? formatPeriod(currentBudget.period) : "Sin presupuesto";
  const overview = budgetPerformance?.overview || null;

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="budget" user={user} />

        <main className="dashboard-main budget-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Presupuesto / {periodLabel}</p>
                <h1 className="dashboard-title">Plan mensual</h1>
              </div>
            </div>
            <div className="dashboard-actions">
              <a href={requestedPeriod ? `/presupuesto?period=${requestedPeriod}` : "/presupuesto"} className="btn btn-secondary">Recalcular</a>
              <a href="#wizard" className="btn btn-primary">Ir al wizard</a>
            </div>
          </header>

          <section className="panel-soft budget-intro">
            <div>
              <strong>{hasBudget ? currentBudget.budgetName : "Objetivo de este mes"}</strong>
              <p>
                {hasBudget
                  ? `Estado: ${currentBudget.status === "active" ? "Activo" : "Borrador"}. Revisa variaciones del plan contra tus movimientos reales.`
                  : "Define metas realistas y revisa el avance por categoria."}
              </p>
            </div>
            <div className="chip-row">
              <span className="chip chip-live">{periodLabel}</span>
              <span className="chip">{currentBudget?.currency || "COP"}</span>
              <span className="chip">{hasBudget ? currentBudget.status : "Sin estado"}</span>
            </div>
          </section>

          <section className="budget-grid" id="wizard">
            <BudgetWizard initialReality={financialReality} initialBudget={currentBudget} />
          </section>

          <section className="panel budget-table-panel">
            <div className="budget-table-head">
              <h2>Presupuesto vs real</h2>
              <div className="chip-row">
                <span className="chip chip-live">{periodLabel}</span>
                <span className="chip">{currentBudget?.currency || "COP"}</span>
                <span className="chip">Movimientos: {overview?.movementCount || 0}</span>
              </div>
            </div>

            {hasBudget ? (
              <>
                <table className="budget-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Planificado</th>
                      <th>Real</th>
                      <th>Balance</th>
                      <th>Avance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isIncome = row.kind === "income";
                      const balance = isIncome
                        ? Number(row.actual || 0) - Number(row.planned || 0)
                        : Number(row.planned || 0) - Number(row.actual || 0);

                      const progress = Number.isFinite(Number(row.progress))
                        ? Math.min(100, Math.max(0, Number(row.progress)))
                        : 0;

                      const dotColor =
                        row.kind === "income"
                          ? "var(--mint)"
                          : row.kind === "saving"
                            ? "var(--violet)"
                            : "var(--amber)";

                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="budget-cat">
                              <span className="budget-dot" style={{ background: dotColor }}></span>
                              <div>
                                <div className="budget-cat-name">{row.name}</div>
                                <div className="budget-cat-note">{row.detailCount > 0 ? `${row.detailCount} detalle(s)` : row.recommendation || "Sin detalle"}</div>
                              </div>
                            </div>
                          </td>
                          <td>{typeLabel(row.kind)}</td>
                          <td>{formatMoney(row.planned, currentBudget.currency)}</td>
                          <td>{formatMoney(row.actual, currentBudget.currency)}</td>
                          <td>
                            <span className={balanceStyle(balance)}>{formatMoney(balance, currentBudget.currency)}</span>
                          </td>
                          <td>
                            <div className="budget-progress"><span style={{ width: `${progress}%`, background: dotColor }}></span></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="budget-footer">
                  <p className="lead">
                    Planeado: {formatMoney(overview?.planned?.outflow || 0, currentBudget.currency)} ·
                    Real: {formatMoney(overview?.actual?.outflow || 0, currentBudget.currency)} ·
                    Variacion: {formatMoney(overview?.variance?.outflow || 0, currentBudget.currency)}
                  </p>
                  <div className="dashboard-actions">
                    <a className="btn btn-secondary" href="/gastos">Registrar movimiento</a>
                    <a className="btn btn-primary" href="#wizard">Editar presupuesto</a>
                  </div>
                </div>
              </>
            ) : (
              <div className="dashboard-empty">Aun no tienes presupuesto guardado para comparar.</div>
            )}
          </section>
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
