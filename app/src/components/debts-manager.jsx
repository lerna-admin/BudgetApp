"use client";

import { useEffect, useMemo, useState } from "react";

const DEBT_TYPES = [
  { id: "credit_card", label: "Tarjeta de credito" },
  { id: "personal_loan", label: "Prestamo personal" },
  { id: "student_loan", label: "Credito educativo" },
  { id: "mortgage", label: "Hipoteca" },
  { id: "other", label: "Otra deuda" },
];

const CURRENCIES = ["COP", "USD", "EUR"];
const DEBT_STATUSES = [
  { id: "open", label: "Abierta" },
  { id: "closed", label: "Cerrada" },
  { id: "restructured", label: "Reestructurada" },
];

const LINK_TYPES = [
  { id: "none", label: "Sin vinculo" },
  { id: "account", label: "Cuenta bancaria" },
  { id: "card", label: "Tarjeta" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch (_error) {
    return `${currency} ${value || 0}`;
  }
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(2)}% EA`;
}

function toMonthlyRate(interestRateEa) {
  const ea = Number(interestRateEa || 0);
  if (!Number.isFinite(ea) || ea < 0) return null;
  if (ea === 0) return 0;
  return Math.pow(1 + ea / 100, 1 / 12) - 1;
}

function estimateDebtPayoff({ principal, monthlyPayment, interestRateEa }) {
  const startingBalance = Number(principal);
  const payment = Number(monthlyPayment);
  const monthlyRate = toMonthlyRate(interestRateEa);
  const epsilon = 0.01;
  const maxMonths = 1200;

  if (!Number.isFinite(startingBalance) || startingBalance <= 0 || monthlyRate === null) {
    return { status: "invalid" };
  }
  if (!Number.isFinite(payment) || payment <= 0) {
    return { status: "missing_payment" };
  }

  let balance = startingBalance;
  let months = 0;
  let totalPaid = 0;

  while (balance > epsilon && months < maxMonths) {
    const interest = balance * monthlyRate;
    const balanceWithInterest = balance + interest;
    if (payment <= interest + 1e-9) {
      return { status: "impossible" };
    }

    const installment = Math.min(payment, balanceWithInterest);
    balance = balanceWithInterest - installment;
    totalPaid += installment;
    months += 1;
  }

  if (months >= maxMonths) {
    return { status: "impossible" };
  }

  return {
    status: "ok",
    months,
    totalPaid,
  };
}

function formatPayoffTime(months) {
  const m = Number(months || 0);
  if (!Number.isFinite(m) || m <= 0) return "-";
  const years = Math.floor(m / 12);
  const remMonths = m % 12;
  if (years === 0) return `${m} mes${m === 1 ? "" : "es"}`;
  if (remMonths === 0) return `${years} año${years === 1 ? "" : "s"}`;
  return `${years} año${years === 1 ? "" : "s"} y ${remMonths} mes${remMonths === 1 ? "" : "es"}`;
}

function createInitialForm() {
  return {
    debtName: "",
    debtType: "credit_card",
    principal: "",
    interestRateEa: "",
    minimumPayment: "",
    currency: "COP",
    status: "open",
    dueDate: "",
    notes: "",
    linkType: "none",
    accountId: "",
    cardId: "",
  };
}

function toInputNumber(value) {
  if (value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(numeric);
}

export default function DebtsManager() {
  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(createInitialForm);

  useEffect(() => {
    async function load() {
      try {
        const [debtsRes, accountsRes, cardsRes] = await Promise.all([
          fetch("/api/debts", { cache: "no-store" }),
          fetch("/api/accounts", { cache: "no-store" }),
          fetch("/api/cards", { cache: "no-store" }),
        ]);
        if (!debtsRes.ok || !accountsRes.ok || !cardsRes.ok) {
          throw new Error();
        }

        const [debtsJson, accountsJson, cardsJson] = await Promise.all([
          debtsRes.json(),
          accountsRes.json(),
          cardsRes.json(),
        ]);
        setDebts(debtsJson.data || []);
        setAccounts(accountsJson.data || []);
        setCards(cardsJson.data || []);
        setError("");
      } catch (_error) {
        setError("No se pudo cargar el modulo de deudas.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totals = useMemo(() => {
    const today = todayIso();
    const openDebts = debts.filter((item) => item.status !== "closed");
    const principal = openDebts.reduce((sum, item) => sum + Number(item.principal || 0), 0);
    const minimum = openDebts.reduce((sum, item) => sum + Number(item.minimumPayment || 0), 0);
    const avgEa = openDebts.length
      ? openDebts.reduce((sum, item) => sum + Number(item.interestRateEa || 0), 0) / openDebts.length
      : 0;
    const overdue = openDebts.filter((item) => item.dueDate && item.dueDate < today).length;
    return {
      openCount: openDebts.length,
      principal,
      minimum,
      avgEa,
      overdue,
    };
  }, [debts]);

  const formProjection = useMemo(
    () =>
      estimateDebtPayoff({
        principal: form.principal,
        monthlyPayment: form.minimumPayment,
        interestRateEa: form.interestRateEa,
      }),
    [form.principal, form.minimumPayment, form.interestRateEa],
  );

  function resetForm() {
    setEditingId("");
    setForm(createInitialForm());
  }

  function updateForm(patch) {
    setForm((current) => {
      const next = { ...current, ...patch };
      if (next.linkType !== "account") next.accountId = "";
      if (next.linkType !== "card") next.cardId = "";
      return next;
    });
  }

  function editDebt(item) {
    setEditingId(item.id);
    setFeedback(null);
    setForm({
      debtName: item.debtName || "",
      debtType: item.debtType || "other",
      principal: toInputNumber(item.principal),
      interestRateEa: toInputNumber(item.interestRateEa),
      minimumPayment: toInputNumber(item.minimumPayment),
      currency: item.currency || "COP",
      status: item.status || "open",
      dueDate: item.dueDate || "",
      notes: item.notes || "",
      linkType: item.cardId ? "card" : item.accountId ? "account" : "none",
      accountId: item.accountId || "",
      cardId: item.cardId || "",
    });
  }

  async function submitDebt(event) {
    event.preventDefault();
    setFeedback(null);

    const debtName = form.debtName.trim();
    const debtType = form.debtType;
    const principal = Number(form.principal);
    const interestRateEa = Number(form.interestRateEa);
    const minimumPayment = form.minimumPayment === "" ? null : Number(form.minimumPayment);

    if (!debtName) {
      setFeedback({ type: "error", text: "El nombre de la deuda es obligatorio." });
      return;
    }
    if (!debtType) {
      setFeedback({ type: "error", text: "Selecciona un tipo de deuda." });
      return;
    }
    if (!Number.isFinite(principal) || principal <= 0) {
      setFeedback({ type: "error", text: "Ingresa un principal mayor a 0." });
      return;
    }
    if (!Number.isFinite(interestRateEa) || interestRateEa < 0) {
      setFeedback({ type: "error", text: "Ingresa una tasa EA valida." });
      return;
    }
    if (minimumPayment !== null && (!Number.isFinite(minimumPayment) || minimumPayment < 0)) {
      setFeedback({ type: "error", text: "El pago minimo debe ser mayor o igual a 0." });
      return;
    }
    if (form.linkType === "account" && !form.accountId) {
      setFeedback({ type: "error", text: "Selecciona una cuenta para vincular la deuda." });
      return;
    }
    if (form.linkType === "card" && !form.cardId) {
      setFeedback({ type: "error", text: "Selecciona una tarjeta para vincular la deuda." });
      return;
    }

    const linkedAccount = accounts.find((item) => item.id === form.accountId);
    const linkedCard = cards.find((item) => item.id === form.cardId);
    const payload = {
      debtName,
      debtType,
      principal,
      interestRateEa,
      minimumPayment,
      currency: form.currency || "COP",
      status: form.status || "open",
      dueDate: form.dueDate || null,
      notes: form.notes || "",
      accountId: form.linkType === "account" ? form.accountId : null,
      cardId: form.linkType === "card" ? form.cardId : null,
      bankId:
        form.linkType === "account"
          ? linkedAccount?.bankId || null
          : form.linkType === "card"
            ? linkedCard?.bankId || null
            : null,
    };

    try {
      setSaving(true);
      const endpoint = editingId ? `/api/debts/${editingId}` : "/api/debts";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "No se pudo guardar");
      }

      const { data } = await res.json();
      setDebts((current) =>
        editingId ? current.map((item) => (item.id === editingId ? data : item)) : [data, ...current],
      );
      setFeedback({
        type: "ok",
        text: editingId
          ? "Deuda actualizada y sincronizada con presupuesto."
          : "Deuda creada. Se registro automaticamente en presupuesto.",
      });
      resetForm();
    } catch (submitError) {
      setFeedback({ type: "error", text: submitError.message || "No se pudo guardar la deuda." });
    } finally {
      setSaving(false);
    }
  }

  async function removeDebt(id) {
    const ok = window.confirm("¿Eliminar deuda?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDebts((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (_error) {
      setFeedback({ type: "error", text: "No se pudo eliminar la deuda." });
    }
  }

  function linkedTarget(item) {
    if (item.cardName) {
      return `${item.cardName}${item.cardLast4 ? ` ••••${item.cardLast4}` : ""}`;
    }
    if (item.accountName) {
      return `${item.accountName}${item.accountNumber ? ` · ${item.accountNumber}` : ""}`;
    }
    return "Sin vinculo";
  }

  return (
    <section className="expense-workspace">
      <article className="panel expense-log">
        <div className="expense-summary-strip">
          <div className="expense-summary-card">
            <p>Deudas abiertas</p>
            <strong>{totals.openCount}</strong>
          </div>
          <div className="expense-summary-card">
            <p>Principal total</p>
            <strong className="neg">{formatCurrency(totals.principal, "COP")}</strong>
          </div>
          <div className="expense-summary-card">
            <p>Pago minimo mensual</p>
            <strong>{formatCurrency(totals.minimum, "COP")}</strong>
          </div>
          <div className="expense-summary-card">
            <p>Tasa promedio</p>
            <strong>{formatPercent(totals.avgEa)}</strong>
          </div>
          <div className="expense-summary-card expense-summary-card-live">
            <p>Vencidas</p>
            <strong>{totals.overdue}</strong>
          </div>
        </div>

        {loading ? <p className="dashboard-empty">Cargando deudas...</p> : null}
        {error ? <p className="message message-error">{error}</p> : null}

        <article className="panel dashboard-card" style={{ marginBottom: 12 }}>
          <div className="dashboard-card-head">
            <div>
              <p className="dashboard-path">CRUD de deudas</p>
              <h2>{editingId ? "Editar deuda" : "Nueva deuda"}</h2>
            </div>
            <span>💳</span>
          </div>

          <form onSubmit={submitDebt}>
            <div className="expense-form-grid" style={{ marginBottom: 10 }}>
              <input
                className="input"
                placeholder="Nombre deuda"
                value={form.debtName}
                onChange={(event) => updateForm({ debtName: event.target.value })}
              />
              <select
                className="input"
                value={form.debtType}
                onChange={(event) => updateForm({ debtType: event.target.value })}
              >
                {DEBT_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Principal"
                value={form.principal}
                onChange={(event) => updateForm({ principal: event.target.value })}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Interes EA (%)"
                value={form.interestRateEa}
                onChange={(event) => updateForm({ interestRateEa: event.target.value })}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Pago minimo"
                value={form.minimumPayment}
                onChange={(event) => updateForm({ minimumPayment: event.target.value })}
              />
              <select
                className="input"
                value={form.currency}
                onChange={(event) => updateForm({ currency: event.target.value })}
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateForm({ dueDate: event.target.value })}
              />
              <select
                className="input"
                value={form.status}
                onChange={(event) => updateForm({ status: event.target.value })}
              >
                {DEBT_STATUSES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <select
                className="input"
                value={form.linkType}
                onChange={(event) => updateForm({ linkType: event.target.value })}
              >
                {LINK_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {form.linkType === "account" ? (
                <select
                  className="input"
                  value={form.accountId}
                  onChange={(event) => updateForm({ accountId: event.target.value })}
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.accountName}{item.accountNumber ? ` · ${item.accountNumber}` : ""}
                    </option>
                  ))}
                </select>
              ) : null}
              {form.linkType === "card" ? (
                <select
                  className="input"
                  value={form.cardId}
                  onChange={(event) => updateForm({ cardId: event.target.value })}
                >
                  <option value="">Seleccionar tarjeta</option>
                  {cards.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.cardName}{item.last4 ? ` ••••${item.last4}` : ""}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <textarea
              className="input"
              rows={3}
              placeholder="Notas de la deuda (opcional)"
              value={form.notes}
              onChange={(event) => updateForm({ notes: event.target.value })}
              style={{ marginBottom: 10 }}
            />

            <p className="expense-hint" style={{ marginBottom: 10 }}>
              Al guardar, la deuda se registra automaticamente en el presupuesto del periodo actual.
            </p>
            <p className="expense-hint" style={{ marginBottom: 10 }}>
              {formProjection.status === "ok"
                ? `Proyeccion: ${formatPayoffTime(formProjection.months)} para pagarla. Total estimado pagado ${formatCurrency(formProjection.totalPaid, form.currency || "COP")}.`
                : formProjection.status === "impossible"
                  ? "Con esa cuota e interes, la deuda no se alcanzaria a pagar. Sube la cuota mensual."
                  : "Agrega principal, interes EA y cuota mensual para estimar tiempo y total pagado."}
            </p>

            {feedback ? (
              <p className={`message ${feedback.type === "error" ? "message-error" : "message-ok"}`}>
                {feedback.text}
              </p>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Actualizar deuda" : "Guardar deuda"}
              </button>
              {editingId ? (
                <button className="btn btn-secondary" type="button" onClick={resetForm}>
                  Cancelar edicion
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Historial de deudas</h2>
          </div>
          <table className="expense-table">
            <thead>
              <tr>
                <th>Deuda</th>
                <th>Principal</th>
                <th>Interes EA</th>
                <th>Pago minimo</th>
                <th>Tiempo estimado</th>
                <th>Total pagado est.</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Vinculo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="dashboard-empty">No hay deudas registradas.</div>
                  </td>
                </tr>
              ) : null}
              {debts.map((item) => {
                const projection = estimateDebtPayoff({
                  principal: item.principal,
                  monthlyPayment: item.minimumPayment,
                  interestRateEa: item.interestRateEa,
                });

                return (
                  <tr key={item.id}>
                    <td>
                      <p className="expense-row-title">{item.debtName}</p>
                      <p className="expense-row-meta">{item.debtType}</p>
                    </td>
                    <td>{formatCurrency(item.principal, item.currency)}</td>
                    <td>{formatPercent(item.interestRateEa)}</td>
                    <td>{item.minimumPayment ? formatCurrency(item.minimumPayment, item.currency) : "-"}</td>
                    <td>{projection.status === "ok" ? formatPayoffTime(projection.months) : "-"}</td>
                    <td>
                      {projection.status === "ok"
                        ? formatCurrency(projection.totalPaid, item.currency)
                        : projection.status === "impossible"
                          ? "No amortiza"
                          : "-"}
                    </td>
                    <td>{item.dueDate || "-"}</td>
                    <td>
                      <span className={`chip ${item.status === "open" ? "chip-live" : ""}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{linkedTarget(item)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost" type="button" onClick={() => editDebt(item)}>
                          Editar
                        </button>
                        <button className="btn btn-ghost" type="button" onClick={() => removeDebt(item.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      </article>
    </section>
  );
}
