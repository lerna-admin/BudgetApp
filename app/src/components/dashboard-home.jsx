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

export default function DashboardHome({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [expRes, accRes] = await Promise.all([
          fetch("/api/expenses", { cache: "no-store" }),
          fetch("/api/accounts", { cache: "no-store" }),
        ]);
        if (!expRes.ok || !accRes.ok) throw new Error();
        const [expJson, accJson] = await Promise.all([expRes.json(), accRes.json()]);
        setExpenses(expJson.data || []);
        setAccounts(accJson.data || []);
        setError("");
      } catch (_e) {
        setError("No pudimos cargar tus movimientos/cuentas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totals = useMemo(() => {
    return expenses.reduce(
      (acc, item) => {
        if (item.movementType === "income") acc.income += item.amount;
        else if (item.movementType === "expense") acc.expense += item.amount;
        else if (item.movementType === "saving" || item.movementType === "investment") acc.saving += item.amount;
        return acc;
      },
      { income: 0, expense: 0, saving: 0 },
    );
  }, [expenses]);

  const accountBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const available = accountBalance + totals.income - totals.expense - totals.saving;
  const recent = expenses.slice(0, 4);

  return (
    <main className="dashboard-main">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <MobileMenuToggle />
          <div className="dashboard-heading">
            <p className="dashboard-path">Dashboard / Sesion activa</p>
            <h1 className="dashboard-title">Resumen financiero</h1>
          </div>
        </div>
        <div className="dashboard-actions">
          <a href="/gastos" className="btn btn-secondary">+ Nuevo movimiento</a>
          <a href="#" className="btn btn-primary">Crear presupuesto</a>
        </div>
      </header>

      <section className="dashboard-kpis">
        <article className="kpi-card"><p>Disponible</p><strong className="pos">{formatCurrency(available)}</strong></article>
        <article className="kpi-card"><p>Ingresos</p><strong className="pos">{formatCurrency(totals.income)}</strong></article>
        <article className="kpi-card"><p>Gastos</p><strong className="neg">{formatCurrency(totals.expense)}</strong></article>
        <article className="kpi-card"><p>Ahorro</p><strong className="pos">{formatCurrency(totals.saving)}</strong></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Presupuesto vs real</h2>
            <a href="#">Ver detalle</a>
          </div>
          <div className="dashboard-empty">
            No hay presupuestos creados todavía.
            <div style={{ marginTop: 10 }}>
              <a href="#" className="btn btn-primary">Crear presupuesto</a>
            </div>
          </div>
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
                      <p className="movement-meta">{item.movementType === "income" ? "Ingreso" : item.subcategory}</p>
                    </div>
                    <p className={`movement-amount ${cls}`}>{prefix}{formatCurrency(item.amount, item.currency)}</p>
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
