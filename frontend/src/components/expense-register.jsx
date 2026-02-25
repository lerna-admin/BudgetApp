"use client";

import { useEffect, useMemo, useState } from "react";

import { getAristas, getSubcategories } from "../lib/expense-catalog";

const movementTypes = [
  { id: "income", label: "Ingreso", icon: "💰" },
  { id: "expense", label: "Gasto", icon: "💸" },
  { id: "saving", label: "Ahorro", icon: "🏦" },
  { id: "investment", label: "Inversion", icon: "📈" },
  { id: "transfer", label: "Entre cuentas", icon: "↔️" },
];

const paymentMethods = [
  { id: "cash", label: "Efectivo", icon: "💵" },
  { id: "card", label: "Tarjeta", icon: "💳" },
  { id: "bank_transfer", label: "Transferencia", icon: "🏦" },
  { id: "loan", label: "Prestamo", icon: "🤝" },
];

const currencyOptions = ["COP", "USD", "EUR"];

let startingBalance = 0;
const cashLabel = "Efectivo";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value, currency) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch (_error) {
    return `${currency} ${value}`;
  }
}

function typeToCategory(movementType) {
  if (movementType === "income") {
    return "Ingresos";
  }
  if (movementType === "expense") {
    return "Gastos";
  }
  if (movementType === "saving" || movementType === "investment") {
    return "Ahorro";
  }
  return "";
}

function methodNeedsBank(method) {
  return method === "card" || method === "bank_transfer";
}

function methodNeedsCard(method) {
  return method === "card";
}

function normalizeForm(nextForm) {
  const next = { ...nextForm };

  if (next.movementType === "transfer") {
    next.category = "";
    next.subcategory = "";
    next.edge = "";
    next.method = "bank_transfer";
  } else if (next.movementType === "income" && next.method === "bank_transfer") {
    // allow income to be banked, but method remains optional
    next.category = typeToCategory(next.movementType);
  } else {
    next.category = typeToCategory(next.movementType);
  }

  if (next.movementType !== "transfer") {
    const subcategories = getSubcategories(next.category);
    if (subcategories.length > 0 && !next.subcategory) {
      next.subcategory = subcategories[0] || "";
    }
    const aristas = getAristas(next.category, next.subcategory);
    if (aristas.length > 0 && !next.edge) {
      next.edge = aristas[0] || "";
    }
  } else {
    next.edge = next.edge || "";
  }

  if (!methodNeedsBank(next.method)) {
    if (next.method === "cash") {
      next.bank = cashLabel;
    } else {
      next.bank = "";
    }
  }

  if (!methodNeedsCard(next.method)) {
    next.card = "";
  }

  return next;
}

function createInitialForm() {
  return normalizeForm({
    movementType: "expense",
    date: todayIso(),
    detail: "",
    amount: "",
    notes: "",
    category: "",
    subcategory: "",
    edge: "",
    method: "cash",
    bank: "",
    card: "",
    currency: "COP",
    tags: "",
    attachments: [],
    transferFrom: "",
    transferTo: "",
  });
}

function movementLabel(movementType) {
  if (movementType === "income") {
    return "Ingreso";
  }
  if (movementType === "expense") {
    return "Gastos";
  }
  if (movementType === "saving") {
    return "Ahorro";
  }
  if (movementType === "investment") {
    return "Inversion";
  }
  return "Entre cuentas";
}

function paymentLabel(method) {
  if (method === "cash") {
    return "Efectivo";
  }
  if (method === "card") {
    return "Tarjeta";
  }
  if (method === "bank_transfer") {
    return "Transferencia";
  }
  return "Prestamo";
}

export default function ExpenseRegister() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createInitialForm);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [attachmentsOnly, setAttachmentsOnly] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customSubs, setCustomSubs] = useState({ Gastos: [], Ahorro: [], Ingresos: [] });
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newEdge, setNewEdge] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const totalAccountsBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    let aborted = false;
    async function load() {
      try {
        setLoading(true);
        const [expRes, accRes, cardRes] = await Promise.all([
          fetch("/api/expenses", { cache: "no-store" }),
          fetch("/api/accounts", { cache: "no-store" }),
          fetch("/api/cards", { cache: "no-store" }),
        ]);
        if (!expRes.ok || !accRes.ok || !cardRes.ok) throw new Error();
        const [expJson, accJson, cardJson] = await Promise.all([expRes.json(), accRes.json(), cardRes.json()]);
        if (aborted) return;
        setMovements(expJson.data || []);
        setAccounts(accJson.data || []);
        setCards(cardJson.data || []);
        setApiError("");
      } catch (error) {
        if (aborted) return;
        setApiError("No se pudo cargar el historial");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();

    async function loadCustomSubs() {
      try {
        const res = await fetch("/api/subcategories", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (aborted) return;
        const grouped = { Gastos: [], Ahorro: [], Ingresos: [] };
        (json.data || []).forEach((item) => {
          const key = item.categoryLabel;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });
        setCustomSubs(grouped);
      } catch (_e) {
        /* ignore */
      }
    }
    loadCustomSubs();

    async function loadAccounts() {
      try {
        const res = await fetch("/api/accounts", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (aborted) return;
        setAccounts(json.data || []);
      } catch (_e) {
        /* ignore */
      }
    }
    loadAccounts();

    async function loadTags() {
      try {
        const res = await fetch("/api/tags", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (aborted) return;
        setTagSuggestions(json.data || []);
      } catch (_e) {
        /* ignore */
      }
    }
    loadTags();
    return () => {
      aborted = true;
    };
  }, []);

  function openDrawer() {
    setFeedback(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setFeedback(null);
    setDrawerOpen(false);
  }

  function clearAdvancedFilters() {
    setDateFrom("");
    setDateTo("");
    setSubcategoryFilter("");
    setMethodFilter("");
    setBankFilter("");
    setAttachmentsOnly(false);
  }

  const subcategoryOptions = useMemo(() => {
    const base = getSubcategories(form.category);
    const custom = customSubs[form.category] || [];
    return [...base, ...custom.map((c) => c.name)];
  }, [customSubs, form.category]);

  const customEdges = useMemo(() => {
    const list = customSubs[form.category] || [];
    const hit = list.find((c) => c.name === form.subcategory);
    return hit?.edges || [];
  }, [customSubs, form.category, form.subcategory]);

  const allSubcategories = useMemo(() => {
    const options = new Set([
      ...getSubcategories("Gastos"),
      ...getSubcategories("Ahorro"),
      ...getSubcategories("Ingresos"),
    ]);
    ["Gastos", "Ahorro", "Ingresos"].forEach((cat) => {
      (customSubs[cat] || []).forEach((c) => options.add(c.name));
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b, "es"));
  }, [customSubs]);

  const edgeOptions = useMemo(() => {
    const base = getAristas(form.category, form.subcategory);
    return [...base, ...customEdges];
  }, [form.category, form.subcategory, customEdges]);

  const incomeAccountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      id: acc.id,
      label: `${acc.accountName}${acc.accountNumber ? " · " + acc.accountNumber : ""} · ${acc.currency}`,
    }));
  }, [accounts]);

  const transferAccountOptions = useMemo(
    () =>
      accounts.map((acc) => `${acc.accountName}${acc.accountNumber ? " · " + acc.accountNumber : ""}`),
    [accounts],
  );

  useEffect(() => {
    if (form.movementType === "transfer") return;
    if (!form.subcategory && subcategoryOptions.length > 0) {
      updateForm({ subcategory: subcategoryOptions[0] });
    }
  }, [form.movementType, subcategoryOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (form.movementType === "transfer") return;
    if (edgeOptions.length > 0 && !form.edge) {
      updateForm({ edge: edgeOptions[0] });
    }
  }, [form.movementType, edgeOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const bankOptions = useMemo(() => {
    const names = new Set([cashLabel]);
    accounts.forEach((a) => {
      if (a.bankName) names.add(a.bankName);
      else if (a.bankId) names.add(a.bankId);
      else if (a.accountName) names.add(a.accountName.split(" - ")[0]);
      if (a.accountType === "cash") names.add(cashLabel);
    });
    cards.forEach((c) => {
      if (c.bankName) names.add(c.bankName);
      else if (c.bankId) names.add(c.bankId);
    });
    return Array.from(names);
  }, [accounts, cards]);

  const cardOptionsByBank = useMemo(() => {
    const map = {};
    cards.forEach((c) => {
      const bankKey = c.bankName || c.bankId || c.cardName.split(" ")[0];
      if (!map[bankKey]) map[bankKey] = [];
      map[bankKey].push(c.cardName + (c.last4 ? ` ••••${c.last4}` : ""));
    });
    return map;
  }, [cards]);

  const availableCards = useMemo(() => {
    if (!form.bank) return [];
    return cardOptionsByBank[form.bank] || [];
  }, [cardOptionsByBank, form.bank]);

  const editing = useMemo(
    () => movements.find((m) => m.id === form.id) || null,
    [form.id, movements],
  );

  const filteredMovements = useMemo(() => {
    let items = movements;

    if (filter === "expense") {
      items = items.filter((item) => item.movementType === "expense");
    } else if (filter === "saving") {
      items = items.filter((item) => item.movementType === "saving" || item.movementType === "investment");
    } else if (filter === "transfer") {
      items = items.filter((item) => item.movementType === "transfer");
    }

    if (dateFrom) {
      items = items.filter((item) => item.date >= dateFrom);
    }

    if (dateTo) {
      items = items.filter((item) => item.date <= dateTo);
    }

    if (subcategoryFilter) {
      items = items.filter((item) => item.subcategory === subcategoryFilter);
    }

    if (methodFilter) {
      items = items.filter((item) => item.method === methodFilter);
    }

    if (bankFilter) {
      if (bankFilter === "__none__") {
        items = items.filter((item) => !item.bank);
      } else {
        items = items.filter((item) => item.bank === bankFilter);
      }
    }

    if (attachmentsOnly) {
      items = items.filter((item) => (item.attachments?.length || 0) > 0);
    }

    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [
        item.date,
        item.detail,
        item.notes,
        item.subcategory,
        item.edge,
        item.bank,
        item.card,
        item.currency,
        paymentLabel(item.method),
        movementLabel(item.movementType),
        Array.isArray(item.tags) ? item.tags.join(",") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [attachmentsOnly, bankFilter, dateFrom, dateTo, filter, methodFilter, movements, search, subcategoryFilter]);

  const totals = useMemo(() => {
    return movements.reduce(
      (acc, item) => {
        if (item.movementType === "income") {
          acc.income += item.amount;
        } else if (item.movementType === "expense") {
          acc.expenses += item.amount;
        } else if (item.movementType === "saving" || item.movementType === "investment") {
          acc.savings += item.amount;
        } else {
          acc.transfers += item.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0, savings: 0, transfers: 0 },
    );
  }, [movements]);

  const available = totalAccountsBalance + totals.income - totals.expenses - totals.savings;
  const showEdgeHelper = form.movementType !== "transfer" && edgeOptions.length === 0;
  const bankRequired = !!form.method && methodNeedsBank(form.method);
  const cardRequired = !!form.method && methodNeedsCard(form.method);

  function updateForm(patch) {
    setForm((current) => normalizeForm({ ...current, ...patch }));
  }

  function validateForm() {
    const issues = [];
    const amount = Number(form.amount);

    if (!form.date) {
      issues.push("Selecciona una fecha.");
    }

    if (!form.detail.trim()) {
      issues.push("Ingresa un detalle o compra.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      issues.push("Ingresa un valor mayor a 0.");
    }

    if (form.movementType !== "transfer") {
      if (!form.subcategory) {
        issues.push("Selecciona una subcategoria.");
      }
      if (edgeOptions.length > 0 && !form.edge) {
        issues.push("Selecciona una arista.");
      }
    }

    if (form.movementType !== "income" && !form.method) {
      issues.push("Selecciona un metodo de pago.");
    }

    if (bankRequired && !form.bank) {
      issues.push("Selecciona un banco para el metodo elegido.");
    }

    if (cardRequired && !form.card) {
      issues.push("Selecciona una tarjeta.");
    }

    if (!form.currency) {
      issues.push("Selecciona una moneda.");
    }

    if (form.movementType === "transfer") {
      if (!form.transferFrom || !form.transferTo) {
        issues.push("Selecciona cuenta origen y destino.");
      }
      if (form.transferFrom && form.transferTo && form.transferFrom === form.transferTo) {
        issues.push("La cuenta origen debe ser distinta a la cuenta destino.");
      }
    }

    return { issues, amount };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { issues, amount } = validateForm();

    if (issues.length > 0) {
      setFeedback({ type: "error", text: issues[0] });
      return;
    }

    const payload = {
      movementType: form.movementType,
      date: form.date,
      detail: form.detail.trim(),
      notes: form.notes.trim(),
      amount,
      category: form.category,
      subcategory: form.subcategory,
      edge: form.edge,
      method: form.method,
      bank: form.bank,
      card: form.card,
      currency: form.currency,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      attachments: form.attachments,
      transferFrom: form.transferFrom,
      transferTo: form.transferTo,
    };

    try {
      setSaving(true);
      const res = await fetch(editing ? `/api/expenses/${editing.id}` : "/api/expenses", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar");
      }

      const { data } = await res.json();
      setMovements((current) =>
        editing
          ? current.map((item) => (item.id === editing.id ? data : item))
          : [data, ...current],
      );
      setFeedback({
        type: "ok",
        text: editing
          ? "Movimiento actualizado."
          : payload.movementType === "transfer"
            ? "Movimiento entre cuentas guardado. No afecta el balance."
            : "Movimiento guardado correctamente.",
      });

      setForm((current) =>
        normalizeForm({
          ...createInitialForm(),
          movementType: current.movementType,
          currency: current.currency,
        }),
      );
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("¿Eliminar movimiento?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMovements((current) => current.filter((item) => item.id !== id));
    } catch (_error) {
      setFeedback({ type: "error", text: "No se pudo eliminar" });
    }
  }

  return (
    <>
      <section className="expense-workspace">
        <article className="panel expense-log">
        <div className="expense-summary-strip">
              <div className="expense-summary-card">
                <p>Ingresos</p>
                <strong className="pos">{formatCurrency(totals.income, "COP")}</strong>
              </div>
              <div className="expense-summary-card">
                <p>Total Gastos</p>
                <strong className="neg">{formatCurrency(totals.expenses, "COP")}</strong>
              </div>
              <div className="expense-summary-card">
                <p>Total Ahorro</p>
                <strong className="pos">{formatCurrency(totals.savings, "COP")}</strong>
              </div>
              <div className="expense-summary-card">
                <p>Movimientos</p>
                <strong>{movements.length}</strong>
              </div>
              <div className="expense-summary-card expense-summary-card-live">
                <p>Disponible</p>
                <strong>{formatCurrency(available, "COP")}</strong>
              </div>
            </div>

	        <div className="expense-toolbar">
	          <div className="expense-filter-row">
            <button
              type="button"
              className={`chip expense-filter-chip ${filter === "all" ? "expense-filter-chip-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`chip expense-filter-chip ${filter === "expense" ? "expense-filter-chip-active" : ""}`}
              onClick={() => setFilter("expense")}
            >
              💸 Gastos
            </button>
            <button
              type="button"
              className={`chip expense-filter-chip ${filter === "saving" ? "expense-filter-chip-active" : ""}`}
              onClick={() => setFilter("saving")}
            >
              🏦 Ahorro
            </button>
            <button
              type="button"
              className={`chip expense-filter-chip ${filter === "transfer" ? "expense-filter-chip-active" : ""}`}
              onClick={() => setFilter("transfer")}
            >
              ↔️ Entre cuentas
            </button>
	          </div>

	          <div className="expense-toolbar-row">
	            <input
	              className="input expense-search-input"
	              value={search}
	              onChange={(event) => setSearch(event.target.value)}
	              placeholder="Buscar: detalle, tags, banco, notas..."
	            />
              <div className="expense-toolbar-actions">
	              <button
	                type="button"
	                className="btn btn-secondary"
	                onClick={() => setFiltersOpen((current) => !current)}
	              >
	                {filtersOpen ? "Ocultar filtros" : "Filtros"}
	              </button>
	              <button type="button" className="btn btn-primary expense-open-drawer" onClick={openDrawer}>
	                + Nuevo movimiento
	              </button>
              </div>
	          </div>

            {filtersOpen ? (
              <div className="expense-advanced-filters" role="region" aria-label="Filtros de historial">
                <div className="form-field">
                  <label className="form-label">Desde</label>
                  <input
                    type="date"
                    className="input"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    max={dateTo || undefined}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Hasta</label>
                  <input
                    type="date"
                    className="input"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    min={dateFrom || undefined}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Subcategoria</label>
                  <select
                    className="input"
                    value={subcategoryFilter}
                    onChange={(event) => setSubcategoryFilter(event.target.value)}
                  >
                    <option value="">Todas</option>
                    {allSubcategories.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Metodo</label>
                  <select
                    className="input"
                    value={methodFilter}
                    onChange={(event) => setMethodFilter(event.target.value)}
                  >
                    <option value="">Todos</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Banco</label>
                  <select
                    className="input"
                    value={bankFilter}
                    onChange={(event) => setBankFilter(event.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="__none__">Sin banco</option>
                    {bankOptions.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div className="expense-advanced-actions">
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={attachmentsOnly}
                      onChange={(event) => setAttachmentsOnly(event.target.checked)}
                    />
                    <span>Solo con adjuntos</span>
                  </label>
                  <button type="button" className="btn btn-ghost expense-clear-filters" onClick={clearAdvancedFilters}>
                    Limpiar
                  </button>
                </div>
              </div>
            ) : null}
	        </div>

        <div className="expense-table-wrap">
          {loading ? (
            <div className="dashboard-empty">Cargando movimientos...</div>
          ) : apiError ? (
            <div className="message message-error">{apiError}</div>
          ) : null}
          <table className="expense-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Detalle / Compra</th>
                <th>Categoria › Subcategoria › Arista</th>
                <th>Metodo</th>
                <th className="amount-col">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="dashboard-empty">No hay movimientos para este filtro.</div>
                  </td>
                </tr>
              )}
              {filteredMovements.map((item) => {
                const isExpense = item.movementType === "expense";
                const isSaving = item.movementType === "saving" || item.movementType === "investment";
                const amountClass = isExpense ? "neg" : isSaving ? "pos" : "neutral";
                const amountPrefix = isExpense ? "-" : isSaving ? "+" : "";

                return (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>
                      <p className="expense-row-title">{item.detail}</p>
                      {item.tags.length > 0 && (
                        <p className="expense-row-meta">Tags: {item.tags.join(", ")}</p>
                      )}
                      {item.notes ? (
                        <p className="expense-row-meta">Nota: {item.notes}</p>
                      ) : null}
                      {item.attachments?.length ? (
                        <p className="expense-row-meta">Adjuntos: {item.attachments.length}</p>
                      ) : null}
                      {item.movementType === "transfer" && item.transferFrom && item.transferTo && (
                        <p className="expense-row-meta">
                          Origen: {item.transferFrom} · Destino: {item.transferTo}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={`expense-kind-pill expense-kind-${item.movementType}`}>
                        {movementLabel(item.movementType)}
                      </span>
                      {item.movementType !== "transfer" && (
                        <span className="expense-path">
                          {item.subcategory} › {item.edge || "Sin arista"}
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="expense-row-title">
                        {paymentLabel(item.method)}
                      </p>
                      <p className="expense-row-meta">
                        {item.bank || "Sin banco"}{item.card ? ` · ${item.card}` : ""} · {item.currency}
                      </p>
                    </td>
                    <td className={`amount-col ${amountClass}`}>
                      {amountPrefix}{formatCurrency(item.amount, item.currency)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setForm({ ...item, tags: (item.tags || []).join(",") });
                            setDrawerOpen(true);
                            setFeedback(null);
                          }}
                        >
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDelete(item.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </article>
      </section>

      {drawerOpen ? (
        <button
          type="button"
          className="expense-drawer-backdrop"
          onClick={closeDrawer}
          aria-label="Cerrar registro de movimiento"
        />
      ) : null}

      <aside
        className={`expense-drawer ${drawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal={drawerOpen ? "true" : "false"}
        aria-hidden={drawerOpen ? "false" : "true"}
      >
        <div className="expense-drawer-head">
          <div>
            <h2>Nuevo movimiento</h2>
            <p>Registro guiado de categoria, subcategoria y arista.</p>
          </div>
          <button type="button" className="expense-drawer-close" onClick={closeDrawer} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="expense-drawer-body">
          <form onSubmit={handleSubmit}>
          <div className="expense-type-grid">
            {movementTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`expense-type-btn ${form.movementType === item.id ? "active" : ""}`}
                onClick={() => updateForm({ movementType: item.id })}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <p className="expense-field-mini">Categoria › Subcategoria › Arista</p>
          <div className="expense-breadcrumb">
            <span className={`expense-breadcrumb-item ${form.category ? "done" : ""}`}>{form.category || "Categoria"}</span>
            <span>›</span>
            <span className={`expense-breadcrumb-item ${form.subcategory ? "active" : ""}`}>{form.subcategory || "Subcategoria"}</span>
            <span>›</span>
            <span className="expense-breadcrumb-item">{form.edge || "Arista"}</span>
          </div>
          <p className="expense-hint">
            Arista = rubro/subclasificacion dentro de la subcategoria.
          </p>

          {showEdgeHelper && (
            <p className="message">Esta subcategoria no tiene aristas base y se guarda con detalle libre.</p>
          )}

          <div className="form-field">
            <label className="form-label">Valor / Amount</label>
            <input
              type="number"
              className="input expense-amount-input"
              value={form.amount}
              onChange={(event) => updateForm({ amount: event.target.value })}
              min="0"
              step="0.01"
              placeholder="0"
            />
          </div>

          <div className="expense-form-grid">
            <div className="form-field">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(event) => updateForm({ date: event.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Moneda</label>
              <select
                className="input"
                value={form.currency}
                onChange={(event) => updateForm({ currency: event.target.value })}
              >
                {currencyOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {form.movementType !== "transfer" && (
            <>
          <div className="form-field">
            <label className="form-label">Categoria</label>
            <input type="text" className="input" value={form.category} readOnly />
          </div>

              <div className="expense-form-grid">
              <div className="form-field">
                <label className="form-label">Subcategoria</label>
                <select
                  className="input"
                  value={form.subcategory}
                  onChange={(event) => updateForm({ subcategory: event.target.value })}
                >
                  {subcategoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-ghost expense-clear-filters"
                  onClick={() => setNewSubOpen((v) => !v)}
                  style={{ marginTop: "8px" }}
                >
                  {newSubOpen ? "Cancelar" : "Nueva subcategoria"}
                </button>
              </div>

                <div className="form-field">
                  <label className="form-label">Arista / Rubro</label>
                  <select
                    className="input"
                    value={form.edge}
                    onChange={(event) => updateForm({ edge: event.target.value })}
                    disabled={edgeOptions.length === 0}
                  >
                    {edgeOptions.length === 0 && (
                      <option value="">Sin aristas base</option>
                    )}
                    {edgeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              {newSubOpen && (
                <div className="message">
                  <p style={{ margin: "0 0 8px" }}>Crear nueva subcategoria para {form.category}</p>
                  <div className="expense-form-grid">
                    <input
                      className="input"
                      placeholder="Nombre subcategoria"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Arista opcional"
                      value={newEdge}
                      onChange={(e) => setNewEdge(e.target.value)}
                    />
                  </div>
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        if (!newSubName.trim()) return;
                        try {
                          const res = await fetch("/api/subcategories", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              categoryLabel: form.category,
                              name: newSubName.trim(),
                              edge: newEdge.trim(),
                            }),
                          });
                          if (!res.ok) throw new Error();
                          const { data } = await res.json();
                          setCustomSubs((current) => {
                            const copy = { ...current };
                            const list = copy[form.category] ? [...copy[form.category]] : [];
                            list.push({
                              id: data.id,
                              categoryLabel: data.categoryLabel,
                              name: data.name,
                              edges: data.edges,
                            });
                            copy[form.category] = list;
                            return copy;
                          });
                          updateForm({ subcategory: newSubName.trim(), edge: newEdge.trim() || form.edge });
                          setNewSubName("");
                          setNewEdge("");
                          setNewSubOpen(false);
                          setFeedback({ type: "ok", text: "Subcategoria creada" });
                        } catch (_e) {
                          setFeedback({ type: "error", text: "No se pudo crear subcategoria" });
                        }
                      }}
                    >
                      Guardar subcategoria
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setNewSubOpen(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-field">
            <label className="form-label">Detalle / Compra</label>
            <input
              type="text"
              className="input"
              value={form.detail}
              onChange={(event) => updateForm({ detail: event.target.value })}
              placeholder="Ej: Mercado semanal"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={(event) => updateForm({ notes: event.target.value })}
              placeholder="Ej: pagado con promo, incluir propina, etc."
            />
          </div>

          <div className="form-field">
            <label className="form-label">{form.movementType === "income" ? "Destino ingreso (opcional)" : "Metodo de pago"}</label>
            {form.movementType === "income" ? (
              <div className="expense-form-grid">
                <select
                  className="input"
                  value={form.destinationAccountId || ""}
                  onChange={(e) => updateForm({ destinationAccountId: e.target.value || null })}
                >
                  <option value="">Efectivo</option>
                  {incomeAccountOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Nota destino (opcional)"
                  value={form.destinationNote || ""}
                  onChange={(e) => updateForm({ destinationNote: e.target.value })}
                />
              </div>
            ) : (
              <div className="expense-method-row">
                {paymentMethods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`expense-method-chip ${form.method === item.id ? "active" : ""}`}
                    onClick={() => {
                      if (item.id === "cash") {
                        updateForm({ method: item.id, bank: cashLabel, card: "" });
                      } else {
                        updateForm({ method: item.id });
                      }
                    }}
                    disabled={form.movementType === "transfer" && item.id !== "bank_transfer"}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {bankRequired && (
            <div className="expense-form-grid">
              <div className="form-field">
                <label className="form-label">Banco</label>
                <select
                  className="input"
                  value={form.bank}
                  onChange={(event) => updateForm({ bank: event.target.value })}
                >
                  <option value="">Seleccionar banco</option>
                  {bankOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost expense-clear-filters" onClick={() => setNewSubOpen((v) => !v)}>
                  {newSubOpen ? "Cancelar" : "Nueva subcategoria"}
                </button>
              </div>

              {cardRequired && (
                <div className="form-field">
                  <label className="form-label">Tarjeta</label>
                  <select
                    className="input"
                    value={form.card}
                    onChange={(event) => updateForm({ card: event.target.value })}
                    disabled={availableCards.length === 0}
                  >
                    <option value="">Seleccionar tarjeta</option>
                    {availableCards.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {form.movementType === "transfer" && (
            <div className="expense-form-grid">
              <div className="form-field">
                <label className="form-label">Cuenta origen</label>
                <select
                  className="input"
                  value={form.transferFrom}
                  onChange={(event) => updateForm({ transferFrom: event.target.value })}
                >
                  <option value="">Seleccionar origen</option>
                  {transferAccountOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Cuenta destino</label>
                <select
                  className="input"
                  value={form.transferTo}
                  onChange={(event) => updateForm({ transferTo: event.target.value })}
                >
                  <option value="">Seleccionar destino</option>
                  {transferAccountOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Tags (opcional)</label>
            <input
              type="text"
              className="input"
              list="tag-suggestions"
              value={form.tags}
              onChange={(event) => updateForm({ tags: event.target.value })}
              placeholder="Ej: comida, febrero"
            />
            <datalist id="tag-suggestions">
              {tagSuggestions.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>

          <div className="form-field">
            <label className="form-label">Adjuntos (opcional)</label>
            <input
              type="file"
              className="input"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                updateForm({ attachments: files.map((file) => file.name) });
              }}
            />
            {form.attachments.length > 0 ? (
              <p className="expense-hint">Adjuntos: {form.attachments.join(", ")}</p>
            ) : null}
          </div>

          {feedback && (
            <p className={`message ${feedback.type === "error" ? "message-error" : "message-ok"}`}>
              {feedback.text}
            </p>
          )}

          <button type="submit" className="btn btn-primary expense-submit-btn" disabled={saving}>
            {saving ? "Guardando..." : "Guardar movimiento"}
          </button>
          <p className="expense-xp-note">+10 monedas al registrar movimiento</p>
          </form>
        </div>
      </aside>
    </>
  );
}
