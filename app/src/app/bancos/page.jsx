"use client";

import { useEffect, useState } from "react";

import AppShell from "../../components/app-shell";
import DashboardSidebar from "../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";
import {
  confirmDestructiveAction,
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../../lib/swal";

function formatCurrency(value, currency = "COP") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (_error) {
    return `${currency} ${amount.toLocaleString("es-CO")}`;
  }
}

export default function BanksPageWrapper() {
  return <BanksPage />;
}

function BanksPage() {
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState("accounts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState("");
  const [editingCardId, setEditingCardId] = useState("");
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
        showErrorMessage({
          title: "No se pudo cargar",
          text: "No se pudieron cargar cuentas y tarjetas.",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function resetAccountForm() {
    setEditingAccountId("");
    setFormAcc({ name: "", type: "checking", currency: "COP", balance: "", bankName: "", accountNumber: "" });
  }

  function resetCardForm() {
    setEditingCardId("");
    setFormCard({ name: "", type: "debit", currency: "COP", limit: "", available: "", bankName: "", last4: "" });
  }

  function startEditAccount(account) {
    setActiveTab("accounts");
    setEditingAccountId(account.id);
    setFormAcc({
      name: account.accountName || "",
      type: account.accountType || "checking",
      currency: account.currency || "COP",
      balance: String(account.balance ?? ""),
      bankName: account.bankName || "",
      accountNumber: account.accountNumber || "",
    });
  }

  function startEditCard(card) {
    setActiveTab("cards");
    setEditingCardId(card.id);
    setFormCard({
      name: card.cardName || "",
      type: card.cardType || "debit",
      currency: card.currency || "COP",
      limit: card.creditLimit === null || card.creditLimit === undefined ? "" : String(card.creditLimit),
      available: card.availableCredit === null || card.availableCredit === undefined ? "" : String(card.availableCredit),
      bankName: card.bankName || "",
      last4: card.last4 || "",
    });
  }

  async function saveAccount() {
    if (!formAcc.name.trim()) {
      await showInfoMessage({
        title: "Dato requerido",
        text: "El nombre de la cuenta es obligatorio.",
      });
      return;
    }

    const payload = {
      accountName: formAcc.name.trim(),
      accountType: formAcc.type,
      currency: formAcc.currency,
      balance: Number(formAcc.balance) || 0,
      bankName: formAcc.bankName || null,
      accountNumber: formAcc.accountNumber || null,
    };

    try {
      setSavingAccount(true);
      const endpoint = editingAccountId ? `/api/accounts/${editingAccountId}` : "/api/accounts";
      const method = editingAccountId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo guardar la cuenta.");
      }

      const data = json?.data;
      setAccounts((curr) =>
        editingAccountId
          ? curr.map((item) => (item.id === editingAccountId ? data : item))
          : [data, ...curr],
      );
      resetAccountForm();
      await showSuccessMessage({
        title: editingAccountId ? "Cuenta actualizada" : "Cuenta creada",
        text: editingAccountId
          ? "Los cambios de la cuenta se guardaron correctamente."
          : "La cuenta se registro correctamente.",
      });
    } catch (requestError) {
      await showErrorMessage({
        title: "No se pudo guardar",
        text: requestError?.message || "No se pudo guardar la cuenta.",
      });
    } finally {
      setSavingAccount(false);
    }
  }

  async function deleteAccount(id) {
    const confirmed = await confirmDestructiveAction({
      title: "Eliminar cuenta",
      text: "La cuenta se eliminara de forma permanente.",
      confirmText: "Si, eliminar cuenta",
    });
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo eliminar la cuenta.");
      }
      setAccounts((curr) => curr.filter((a) => a.id !== id));
      if (editingAccountId === id) {
        resetAccountForm();
      }
      await showSuccessMessage({
        title: "Cuenta eliminada",
        text: "La cuenta fue eliminada correctamente.",
      });
    } catch (requestError) {
      await showErrorMessage({
        title: "No se pudo eliminar",
        text: requestError?.message || "No se pudo eliminar la cuenta.",
      });
    }
  }

  async function saveCard() {
    if (!formCard.name.trim()) {
      await showInfoMessage({
        title: "Dato requerido",
        text: "El nombre de la tarjeta es obligatorio.",
      });
      return;
    }

    if (formCard.last4 && !/^\d{4}$/.test(formCard.last4)) {
      await showInfoMessage({
        title: "Ultimos 4 invalidos",
        text: "Debes ingresar exactamente 4 digitos para la tarjeta.",
      });
      return;
    }

    const payload = {
      cardName: formCard.name.trim(),
      cardType: formCard.type,
      currency: formCard.currency,
      creditLimit: formCard.limit ? Number(formCard.limit) : null,
      availableCredit: formCard.available ? Number(formCard.available) : null,
      bankName: formCard.bankName || null,
      last4: formCard.last4 || null,
    };

    try {
      setSavingCard(true);
      const endpoint = editingCardId ? `/api/cards/${editingCardId}` : "/api/cards";
      const method = editingCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo guardar la tarjeta.");
      }

      const data = json?.data;
      setCards((curr) =>
        editingCardId
          ? curr.map((item) => (item.id === editingCardId ? data : item))
          : [data, ...curr],
      );
      resetCardForm();
      await showSuccessMessage({
        title: editingCardId ? "Tarjeta actualizada" : "Tarjeta creada",
        text: editingCardId
          ? "Los cambios de la tarjeta se guardaron correctamente."
          : "La tarjeta se registro correctamente.",
      });
    } catch (requestError) {
      await showErrorMessage({
        title: "No se pudo guardar",
        text: requestError?.message || "No se pudo guardar la tarjeta.",
      });
    } finally {
      setSavingCard(false);
    }
  }

  async function deleteCard(id) {
    const confirmed = await confirmDestructiveAction({
      title: "Eliminar tarjeta",
      text: "La tarjeta se eliminara de forma permanente.",
      confirmText: "Si, eliminar tarjeta",
    });
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo eliminar la tarjeta.");
      }
      setCards((curr) => curr.filter((c) => c.id !== id));
      if (editingCardId === id) {
        resetCardForm();
      }
      await showSuccessMessage({
        title: "Tarjeta eliminada",
        text: "La tarjeta fue eliminada correctamente.",
      });
    } catch (requestError) {
      await showErrorMessage({
        title: "No se pudo eliminar",
        text: requestError?.message || "No se pudo eliminar la tarjeta.",
      });
    }
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
                <button className="btn btn-primary" type="button" onClick={saveAccount} disabled={savingAccount}>
                  {savingAccount ? "Guardando..." : editingAccountId ? "Actualizar" : "Agregar"}
                </button>
                {editingAccountId ? (
                  <button className="btn btn-secondary" type="button" onClick={resetAccountForm} disabled={savingAccount}>
                    Cancelar
                  </button>
                ) : null}
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
                      <td>{formatCurrency(acc.balance, acc.currency)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost" type="button" onClick={() => startEditAccount(acc)}>
                            Editar
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => deleteAccount(acc.id)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
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
                <button className="btn btn-primary" type="button" onClick={saveCard} disabled={savingCard}>
                  {savingCard ? "Guardando..." : editingCardId ? "Actualizar" : "Agregar"}
                </button>
                {editingCardId ? (
                  <button className="btn btn-secondary" type="button" onClick={resetCardForm} disabled={savingCard}>
                    Cancelar
                  </button>
                ) : null}
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
                      <td>{card.creditLimit === null || card.creditLimit === undefined ? "-" : formatCurrency(card.creditLimit, card.currency)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost" type="button" onClick={() => startEditCard(card)}>
                            Editar
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => deleteCard(card.id)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
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
