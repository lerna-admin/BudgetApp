"use client";

import { useEffect, useState } from "react";

import AppShell from "../../components/app-shell";
import DashboardSidebar from "../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";

export default function BanksPageWrapper() {
  return <BanksPage />;
}

function BanksPage() {
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState("accounts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formAcc, setFormAcc] = useState({ name: "", type: "checking", currency: "COP", balance: "", bankName: "", accountNumber: "" });
  const [formCard, setFormCard] = useState({ name: "", type: "debit", currency: "COP", limit: "", available: "", bankName: "", last4: "" });

  useEffect(() => {
    async function load() {
      try {
        const [accRes, cardRes] = await Promise.all([
          fetch("/api/accounts", { cache: "no-store" }),
          fetch("/api/cards", { cache: "no-store" }),
        ]);
        if (!accRes.ok || !cardRes.ok) throw new Error();
        const accJson = await accRes.json();
        const cardJson = await cardRes.json();
        setAccounts(accJson.data || []);
        setCards(cardJson.data || []);
        setError("");
      } catch (_e) {
        setError("No se pudieron cargar cuentas/tarjetas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addAccount() {
    if (!formAcc.name.trim()) return;
    const payload = {
      accountName: formAcc.name.trim(),
      accountType: formAcc.type,
      currency: formAcc.currency,
      balance: Number(formAcc.balance) || 0,
      bankName: formAcc.bankName || null,
      accountNumber: formAcc.accountNumber || null,
    };
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { data } = await res.json();
      setAccounts((curr) => [data, ...curr]);
      setFormAcc({ name: "", type: "checking", currency: "COP", balance: "", bankName: "", accountNumber: "" });
    }
  }

  async function deleteAccount(id) {
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (res.ok) setAccounts((curr) => curr.filter((a) => a.id !== id));
  }

  async function addCard() {
    if (!formCard.name.trim()) return;
    const payload = {
      cardName: formCard.name.trim(),
      cardType: formCard.type,
      currency: formCard.currency,
      creditLimit: formCard.limit ? Number(formCard.limit) : null,
      availableCredit: formCard.available ? Number(formCard.available) : null,
      bankName: formCard.bankName || null,
      last4: formCard.last4 || null,
    };
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { data } = await res.json();
      setCards((curr) => [data, ...curr]);
      setFormCard({ name: "", type: "debit", currency: "COP", limit: "", available: "", bankName: "", last4: "" });
    }
  }

  async function deleteCard(id) {
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    if (res.ok) setCards((curr) => curr.filter((c) => c.id !== id));
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="banks" />

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Config / Bancos</p>
                <h1 className="dashboard-title">Cuentas y tarjetas</h1>
                <p className="dashboard-path" style={{ marginTop: 4 }}>
                  Organiza tus destinos de ingresos y medios de pago. Define primero las cuentas; luego vincula tarjetas si aplica.
                </p>
              </div>
            </div>
          </header>

          <div className="expense-summary-strip" style={{ marginBottom: 12 }}>
            <div className="expense-summary-card">
              <p>Cuentas</p>
              <strong>{accounts.length}</strong>
            </div>
            <div className="expense-summary-card">
              <p>Tarjetas</p>
              <strong>{cards.length}</strong>
            </div>
            <div className="expense-summary-card">
              <p>Efectivo</p>
              <strong>{accounts.filter((a) => a.accountType === "cash").length}</strong>
            </div>
          </div>

          {error && <p className="message message-error">{error}</p>}
          {loading ? <p className="dashboard-empty">Cargando...</p> : null}

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className={`btn ${activeTab === "accounts" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("accounts")}
            >
              🏦 Cuentas
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "cards" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("cards")}
            >
              💳 Tarjetas
            </button>
          </div>

          {activeTab === "accounts" && (
            <article className="panel dashboard-card" style={{ marginBottom: 12 }}>
              <div className="dashboard-card-head">
                <div>
                  <p className="dashboard-path">Destino de ingresos</p>
                  <h2>Cuentas</h2>
                </div>
                <span>🏦</span>
              </div>
              <div className="expense-form-grid" style={{ marginBottom: 12 }}>
                <input className="input" placeholder="Nombre cuenta" value={formAcc.name} onChange={(e) => setFormAcc({ ...formAcc, name: e.target.value })} />
                <input className="input" placeholder="Banco" value={formAcc.bankName} onChange={(e) => setFormAcc({ ...formAcc, bankName: e.target.value })} />
                <input className="input" placeholder="Número de cuenta" value={formAcc.accountNumber} onChange={(e) => setFormAcc({ ...formAcc, accountNumber: e.target.value })} />
                <select className="input" value={formAcc.type} onChange={(e) => setFormAcc({ ...formAcc, type: e.target.value })}>
                  <option value="checking">Cuenta corriente</option>
                  <option value="savings">Cuenta ahorros</option>
                  <option value="cash">Efectivo</option>
                </select>
                <select className="input" value={formAcc.currency} onChange={(e) => setFormAcc({ ...formAcc, currency: e.target.value })}>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <input className="input" placeholder="Saldo inicial" value={formAcc.balance} onChange={(e) => setFormAcc({ ...formAcc, balance: e.target.value })} />
                <button className="btn btn-primary" type="button" onClick={addAccount}>Agregar</button>
              </div>
              <table className="expense-table">
                <thead><tr><th>Nombre</th><th>Tipo</th><th>Moneda</th><th>Saldo</th><th></th></tr></thead>
                <tbody>
                  {accounts.length === 0 && <tr><td colSpan={5}><div className="dashboard-empty">Sin cuentas.</div></td></tr>}
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td>{acc.accountName}</td>
                      <td>{acc.accountType}</td>
                      <td>{acc.currency}</td>
                      <td>{acc.balance}</td>
                      <td><button className="btn btn-ghost" type="button" onClick={() => deleteAccount(acc.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          )}

          {activeTab === "cards" && (
            <article className="panel dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <p className="dashboard-path">Medios de pago</p>
                  <h2>Tarjetas</h2>
                </div>
                <span>💳</span>
              </div>
              <div className="expense-form-grid" style={{ marginBottom: 12 }}>
                <input className="input" placeholder="Nombre tarjeta" value={formCard.name} onChange={(e) => setFormCard({ ...formCard, name: e.target.value })} />
                <input className="input" placeholder="Banco" value={formCard.bankName} onChange={(e) => setFormCard({ ...formCard, bankName: e.target.value })} />
                <input className="input" placeholder="Últimos 4" value={formCard.last4} onChange={(e) => setFormCard({ ...formCard, last4: e.target.value })} />
                <select className="input" value={formCard.type} onChange={(e) => setFormCard({ ...formCard, type: e.target.value })}>
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                  <option value="prepaid">Prepago</option>
                </select>
                <select className="input" value={formCard.currency} onChange={(e) => setFormCard({ ...formCard, currency: e.target.value })}>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <input className="input" placeholder="Cupo" value={formCard.limit} onChange={(e) => setFormCard({ ...formCard, limit: e.target.value })} />
                <input className="input" placeholder="Disponible" value={formCard.available} onChange={(e) => setFormCard({ ...formCard, available: e.target.value })} />
                <button className="btn btn-primary" type="button" onClick={addCard}>Agregar</button>
              </div>
              <table className="expense-table">
                <thead><tr><th>Nombre</th><th>Tipo</th><th>Moneda</th><th>Cupo</th><th></th></tr></thead>
                <tbody>
                  {cards.length === 0 && <tr><td colSpan={5}><div className="dashboard-empty">Sin tarjetas.</div></td></tr>}
                  {cards.map((card) => (
                    <tr key={card.id}>
                      <td>{card.cardName}</td>
                      <td>{card.cardType}</td>
                      <td>{card.currency}</td>
                      <td>{card.creditLimit ?? "-"}</td>
                      <td><button className="btn btn-ghost" type="button" onClick={() => deleteCard(card.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          )}
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
