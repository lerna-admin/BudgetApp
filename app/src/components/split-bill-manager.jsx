"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "budgetapp_split_history_v1";
const CURRENCIES = ["COP", "USD", "EUR"];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function amountToCents(value) {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = String(value).replace(",", ".");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 100);
}

function splitEvenly(totalCents, count) {
  if (!Number.isFinite(totalCents) || totalCents <= 0 || count <= 0) return [];
  const base = Math.floor(totalCents / count);
  let remainder = totalCents - base * count;
  return Array.from({ length: count }, () => {
    if (remainder > 0) {
      remainder -= 1;
      return base + 1;
    }
    return base;
  });
}

function formatCurrencyFromCents(cents, currency = "COP") {
  const value = Number(cents || 0) / 100;
  const decimals = currency === "COP" ? 0 : 2;
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (_error) {
    return `${currency} ${value}`;
  }
}

function createParticipant(name) {
  return { id: createId("person"), name: String(name || "").trim() || "Participante" };
}

function createItem(defaultParticipantIds = []) {
  return {
    id: createId("item"),
    description: "",
    amount: "",
    participantIds: [...defaultParticipantIds],
  };
}

function createInitialSplit(defaultPayerName) {
  const owner = createParticipant(defaultPayerName || "Tu");
  const guest = createParticipant("Amigo/a");
  const participantIds = [owner.id, guest.id];
  return {
    title: "",
    currency: "COP",
    payerId: owner.id,
    participants: [owner, guest],
    items: [createItem(participantIds)],
  };
}

function buildSettlements(balances) {
  const debtors = balances
    .filter((item) => item.balanceCents < 0)
    .map((item) => ({ id: item.id, name: item.name, remaining: -item.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((item) => item.balanceCents > 0)
    .map((item) => ({ id: item.id, name: item.name, remaining: item.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.remaining, creditor.remaining);

    if (amountCents > 0) {
      settlements.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amountCents,
      });
    }

    debtor.remaining -= amountCents;
    creditor.remaining -= amountCents;

    if (debtor.remaining <= 0) debtorIndex += 1;
    if (creditor.remaining <= 0) creditorIndex += 1;
  }

  return settlements;
}

function calculateSummary({ participants, items, payerId }) {
  const participantIds = new Set(participants.map((item) => item.id));
  const paidByParticipant = {};
  const owedByParticipant = {};

  participants.forEach((item) => {
    paidByParticipant[item.id] = 0;
    owedByParticipant[item.id] = 0;
  });

  let totalCents = 0;
  let validItems = 0;
  let invalidItems = 0;

  items.forEach((item) => {
    const amountCents = amountToCents(item.amount);
    if (amountCents <= 0) return;

    const selected = (item.participantIds || []).filter((id) => participantIds.has(id));
    if (selected.length === 0) {
      invalidItems += 1;
      return;
    }

    const shares = splitEvenly(amountCents, selected.length);
    selected.forEach((id, index) => {
      owedByParticipant[id] += shares[index] || 0;
    });

    totalCents += amountCents;
    validItems += 1;
  });

  if (payerId && participantIds.has(payerId)) {
    paidByParticipant[payerId] += totalCents;
  }

  const balances = participants.map((item) => {
    const paidCents = paidByParticipant[item.id] || 0;
    const owedCents = owedByParticipant[item.id] || 0;
    return {
      id: item.id,
      name: item.name,
      paidCents,
      owedCents,
      balanceCents: paidCents - owedCents,
    };
  });

  return {
    totalCents,
    validItems,
    invalidItems,
    balances,
    settlements: buildSettlements(balances),
  };
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object" && item.id && item.currency)
    .slice(0, 20);
}

export default function SplitBillManager({ defaultPayerName }) {
  const initial = useMemo(() => createInitialSplit(defaultPayerName), [defaultPayerName]);

  const [title, setTitle] = useState(initial.title);
  const [currency, setCurrency] = useState(initial.currency);
  const [payerId, setPayerId] = useState(initial.payerId);
  const [participants, setParticipants] = useState(initial.participants);
  const [items, setItems] = useState(initial.items);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [history, setHistory] = useState([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHistory([]);
      } else {
        const parsed = JSON.parse(raw);
        setHistory(normalizeHistory(parsed));
      }
    } catch (_error) {
      setHistory([]);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    } catch (_error) {
      // noop
    }
  }, [history, historyReady]);

  const summary = useMemo(
    () => calculateSummary({ participants, items, payerId }),
    [participants, items, payerId],
  );

  function resetSplit({ clearFeedback = true } = {}) {
    const next = createInitialSplit(defaultPayerName);
    setTitle(next.title);
    setCurrency(next.currency);
    setPayerId(next.payerId);
    setParticipants(next.participants);
    setItems(next.items);
    setNewParticipantName("");
    setReceiptFileName("");
    if (clearFeedback) {
      setFeedback(null);
    }
  }

  function addParticipant() {
    const name = newParticipantName.trim();
    if (!name) {
      setFeedback({ type: "error", text: "Escribe el nombre del participante." });
      return;
    }

    const person = createParticipant(name);
    setParticipants((current) => [...current, person]);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        participantIds: [...new Set([...(item.participantIds || []), person.id])],
      })),
    );
    setNewParticipantName("");
    setFeedback(null);
  }

  function removeParticipant(participantId) {
    if (participants.length <= 2) {
      setFeedback({ type: "error", text: "Debes mantener al menos 2 participantes." });
      return;
    }

    const nextParticipants = participants.filter((item) => item.id !== participantId);
    if (!nextParticipants.length) return;

    setParticipants(nextParticipants);
    setItems((current) =>
      current.map((item) => {
        const nextParticipantIds = (item.participantIds || []).filter((id) => id !== participantId);
        return {
          ...item,
          participantIds: nextParticipantIds.length ? nextParticipantIds : nextParticipants.map((p) => p.id),
        };
      }),
    );

    if (payerId === participantId) {
      setPayerId(nextParticipants[0].id);
    }
    setFeedback(null);
  }

  function addItem() {
    const participantIds = participants.map((item) => item.id);
    setItems((current) => [...current, createItem(participantIds)]);
    setFeedback(null);
  }

  function updateItem(itemId, patch) {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(itemId) {
    if (items.length <= 1) {
      setFeedback({ type: "error", text: "Debe quedar al menos un item en la cuenta." });
      return;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
    setFeedback(null);
  }

  function toggleItemParticipant(itemId, participantId) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        const exists = (item.participantIds || []).includes(participantId);
        if (exists) {
          return { ...item, participantIds: item.participantIds.filter((id) => id !== participantId) };
        }
        return { ...item, participantIds: [...(item.participantIds || []), participantId] };
      }),
    );
  }

  function assignAllParticipants(itemId) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, participantIds: participants.map((person) => person.id) } : item,
      ),
    );
  }

  function handleReceiptChange(event) {
    const file = event.target.files?.[0];
    setReceiptFileName(file?.name || "");
  }

  function saveSplit() {
    if (participants.length < 2) {
      setFeedback({ type: "error", text: "Agrega al menos 2 participantes." });
      return;
    }
    if (!payerId || !participants.some((item) => item.id === payerId)) {
      setFeedback({ type: "error", text: "Selecciona quien pago la cuenta." });
      return;
    }
    if (summary.validItems === 0 || summary.totalCents <= 0) {
      setFeedback({ type: "error", text: "Agrega al menos un item con valor mayor a 0." });
      return;
    }
    if (summary.invalidItems > 0) {
      setFeedback({
        type: "error",
        text: "Hay items sin participantes asignados. Ajustalos para guardar la division.",
      });
      return;
    }

    const payer = participants.find((item) => item.id === payerId);
    const record = {
      id: createId("split"),
      title: title.trim() || "Division sin titulo",
      currency,
      totalCents: summary.totalCents,
      validItems: summary.validItems,
      receiptFileName: receiptFileName || null,
      payerName: payer?.name || "Participante",
      balances: summary.balances.map((item) => ({
        name: item.name,
        paidCents: item.paidCents,
        owedCents: item.owedCents,
        balanceCents: item.balanceCents,
      })),
      settlements: summary.settlements.map((item) => ({
        fromName: item.fromName,
        toName: item.toName,
        amountCents: item.amountCents,
      })),
      createdAt: new Date().toISOString(),
    };

    setHistory((current) => [record, ...current].slice(0, 20));
    resetSplit({ clearFeedback: false });
    setFeedback({ type: "ok", text: "Division guardada en historial local." });
  }

  return (
    <section className="expense-workspace">
      <article className="panel expense-log">
        <section className="dashboard-grid">
          <article className="panel dashboard-card">
            <div className="dashboard-card-head">
              <h2>Nueva division</h2>
              <button className="btn btn-secondary" type="button" onClick={() => resetSplit()}>
                Limpiar
              </button>
            </div>

            <div className="expense-form-grid" style={{ marginBottom: 10 }}>
              <input
                className="input"
                placeholder="Titulo (ej: Cena viernes)"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <select
                className="input"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <p className="expense-hint" style={{ marginBottom: 6 }}>Quien pago la cuenta</p>
            <select
              className="input"
              value={payerId}
              onChange={(event) => setPayerId(event.target.value)}
              style={{ marginBottom: 12 }}
            >
              {participants.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <div className="expense-form-grid" style={{ marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Nuevo participante"
                value={newParticipantName}
                onChange={(event) => setNewParticipantName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addParticipant();
                  }
                }}
              />
              <button className="btn btn-primary" type="button" onClick={addParticipant}>
                + Agregar participante
              </button>
            </div>

            <div className="chip-row" style={{ marginBottom: 12 }}>
              {participants.map((item) => (
                <div
                  key={item.id}
                  className={`chip ${payerId === item.id ? "chip-live" : ""}`}
                  style={{ gap: 6 }}
                >
                  <span>{item.name}</span>
                  {participants.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeParticipant(item.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "inherit",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                        fontWeight: 800,
                      }}
                      aria-label={`Quitar ${item.name}`}
                    >
                      x
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="dashboard-empty" style={{ marginBottom: 10 }}>
              <p className="expense-row-title" style={{ margin: 0 }}>Factura por foto (proximamente)</p>
              <p className="expense-row-meta" style={{ margin: "4px 0 8px" }}>
                Base lista para fase 2: OCR de factura y creacion automatica de items.
              </p>
              <input className="input" type="file" accept="image/*,.pdf" onChange={handleReceiptChange} />
              {receiptFileName ? (
                <p className="expense-row-meta" style={{ margin: "8px 0 0" }}>
                  Archivo seleccionado: {receiptFileName}
                </p>
              ) : null}
            </div>

            {feedback ? (
              <p className={`message ${feedback.type === "error" ? "message-error" : "message-ok"}`}>
                {feedback.text}
              </p>
            ) : null}
          </article>

          <aside className="panel dashboard-card">
            <div className="dashboard-card-head">
              <h2>Resumen rapido</h2>
            </div>
            <div className="expense-summary-strip">
              <div className="expense-summary-card">
                <p>Total cuenta</p>
                <strong>{formatCurrencyFromCents(summary.totalCents, currency)}</strong>
              </div>
              <div className="expense-summary-card">
                <p>Items validos</p>
                <strong>{summary.validItems}</strong>
              </div>
              <div className="expense-summary-card">
                <p>Items sin reparto</p>
                <strong>{summary.invalidItems}</strong>
              </div>
              <div className="expense-summary-card expense-summary-card-live">
                <p>Pagos sugeridos</p>
                <strong>{summary.settlements.length}</strong>
              </div>
            </div>

            <button className="btn btn-primary" type="button" onClick={saveSplit} style={{ marginTop: 10 }}>
              Guardar division
            </button>
          </aside>
        </section>

        <section className="dashboard-grid">
          <article className="panel dashboard-card">
            <div className="dashboard-card-head">
              <h2>Items de la cuenta</h2>
              <button className="btn btn-secondary" type="button" onClick={addItem}>
                + Agregar item
              </button>
            </div>

            <div className="movement-list">
              {items.map((item) => {
                const amountCents = amountToCents(item.amount);
                const selectedParticipants = participants.filter((person) =>
                  (item.participantIds || []).includes(person.id),
                );
                const shares = splitEvenly(amountCents, selectedParticipants.length);
                return (
                  <article key={item.id} className="movement-item" style={{ display: "grid", gap: 8 }}>
                    <div className="expense-form-grid">
                      <input
                        className="input"
                        placeholder="Descripcion item"
                        value={item.description}
                        onChange={(event) => updateItem(item.id, { description: event.target.value })}
                      />
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor"
                        value={item.amount}
                        onChange={(event) => updateItem(item.id, { amount: event.target.value })}
                      />
                    </div>

                    <div>
                      <p className="expense-hint" style={{ marginBottom: 6 }}>
                        Participantes del item
                      </p>
                      <div className="expense-method-row" style={{ marginBottom: 8 }}>
                        {participants.map((person) => {
                          const active = (item.participantIds || []).includes(person.id);
                          return (
                            <button
                              key={person.id}
                              type="button"
                              className={`expense-method-chip ${active ? "active" : ""}`}
                              onClick={() => toggleItemParticipant(item.id, person.id)}
                            >
                              {person.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <p className="movement-meta" style={{ margin: 0 }}>
                        {selectedParticipants.length > 0 && amountCents > 0
                          ? `Cada uno: ${formatCurrencyFromCents(shares[0], currency)}`
                          : "Selecciona participantes y valor para calcular el reparto."}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost" type="button" onClick={() => assignAllParticipants(item.id)}>
                          Todos
                        </button>
                        <button className="btn btn-ghost" type="button" onClick={() => removeItem(item.id)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <aside className="panel dashboard-card">
            <div className="dashboard-card-head">
              <h2>Balances</h2>
            </div>
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Pago</th>
                  <th>Consumo</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.balances.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{formatCurrencyFromCents(item.paidCents, currency)}</td>
                    <td>{formatCurrencyFromCents(item.owedCents, currency)}</td>
                    <td className={`amount-col ${item.balanceCents >= 0 ? "pos" : "neg"}`}>
                      {item.balanceCents >= 0 ? "+" : "-"}
                      {formatCurrencyFromCents(Math.abs(item.balanceCents), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="dashboard-card-head" style={{ marginTop: 12 }}>
              <h2>Liquidacion sugerida</h2>
            </div>
            {summary.settlements.length === 0 ? (
              <div className="dashboard-empty">
                No hay pagos pendientes por sugerir.
              </div>
            ) : (
              <div className="bar-listing">
                {summary.settlements.map((item) => (
                  <div key={`${item.fromId}-${item.toId}`} className="info-item">
                    <span>{item.fromName} le paga a {item.toName}</span>
                    <strong>{formatCurrencyFromCents(item.amountCents, currency)}</strong>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </section>

        <article className="panel dashboard-card">
          <div className="dashboard-card-head">
            <h2>Divisiones recientes (local)</h2>
            <button className="btn btn-ghost" type="button" onClick={() => setHistory([])}>
              Limpiar historial
            </button>
          </div>

          {history.length === 0 ? (
            <div className="dashboard-empty">
              Aun no hay divisiones guardadas.
            </div>
          ) : (
            <div className="movement-list">
              {history.map((item) => (
                <article key={item.id} className="movement-item" style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <p className="movement-name" style={{ margin: 0 }}>
                      {item.title}
                    </p>
                    <p className="movement-amount pos" style={{ margin: 0 }}>
                      {formatCurrencyFromCents(item.totalCents, item.currency)}
                    </p>
                  </div>
                  <p className="movement-meta">
                    Pago: {item.payerName} · Items: {item.validItems} · {new Date(item.createdAt).toLocaleString("es-CO")}
                  </p>
                  {item.receiptFileName ? (
                    <p className="movement-meta">Factura adjunta: {item.receiptFileName}</p>
                  ) : null}
                  {Array.isArray(item.settlements) && item.settlements.length > 0 ? (
                    <div className="chip-row">
                      {item.settlements.map((transfer, index) => (
                        <span key={`${item.id}-${index}`} className="chip">
                          {transfer.fromName} {" -> "} {transfer.toName}: {formatCurrencyFromCents(transfer.amountCents, item.currency)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </article>
      </article>
    </section>
  );
}
