/* Propuesta 10.0 - Gastos: UI interactiva (filtros + drawer overlay) */

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

const expenseCatalog = {
  Ingresos: {
    'Salario fijo': ['Nómina', 'Bonos', 'Horas extra'],
    'Freelance / Side hustle': ['Servicios', 'Productos', 'Propinas'],
    'Ingresos pasivos': ['Dividendos', 'Intereses', 'Regalías', 'Renta'],
    'Otros ingresos': ['Reembolsos', 'Venta de activos', 'Regalos'],
  },
  Gastos: {
    "Necesidades Basicas": [
      "Arriendo",
      "Telefono/Celular",
      "Servicios publicos",
      "Gas",
      "Cable/Internet",
      "Mercado",
      "Gasolina",
      "Transporte diario",
    ],
    Deudas: [
      "Deuda Carro",
      "Deuda tarjeta 1",
      "Deuda familiar",
      "Deuda Estudio",
      "Carro",
    ],
    Casa: ["Limpieza", "Mantenimiento", "Muebles", "Impuestos"],
    Alimentacion: ["Restaurantes", "Domicilios"],
    Salud: ["Medicinas", "Tratamientos", "Deporte"],
    Entretenimiento: [
      "Vacaciones",
      "Citas",
      "Cine",
      "Plataformas de series 1",
      "Plataformas de musica 1",
    ],
    Mascota: ["Comida", "Veterinario", "Juguetes", "Medicinas"],
    "Regalos/Caridad": ["Regalos Navidad", "Regalos cumpleanos", "Caridad"],
    Transporte: ["App taxis/taxi", "Estacionamiento", "Mantenimiento", "Impuestos", "Colpass/Peaje"],
    Seguros: ["Carro", "Vida", "Casa", "Salud"],
    "Cuidado Personal": ["Ropa", "Belleza", "Peluqueria", "Sastre", "Tintoreria"],
    Hijos: ["Ropa", "Estudio", "Utiles Escolares", "Ninera"],
    Otros: [],
  },
  Ahorro: {
    Ahorros: [
      "Fondo de Emergencia",
      "Fondo de Pension",
      "Fondo de Educacion",
      "Cuota Inicial Casa",
      "Aporte a Capital",
    ],
  },
};

function getSubcategories(category) {
  if (!category || !expenseCatalog[category]) {
    return [];
  }
  return Object.keys(expenseCatalog[category]);
}

function getAristas(category, subcategory) {
  if (!category || !subcategory || !expenseCatalog[category]) {
    return [];
  }
  return expenseCatalog[category][subcategory] || [];
}

function movementLabel(movementType) {
  if (movementType === "income") return "Ingreso";
  if (movementType === "expense") return "Gastos";
  if (movementType === "saving") return "Ahorro";
  if (movementType === "investment") return "Inversion";
  if (movementType === "transfer") return "Entre cuentas";
  return movementType;
}

function paymentLabel(method) {
  if (method === "cash") return "Efectivo";
  if (method === "card") return "Tarjeta";
  if (method === "bank_transfer") return "Transferencia";
  return "Prestamo";
}

function typeToCategory(movementType) {
  if (movementType === "income") return "Ingresos";
  if (movementType === "expense") return "Gastos";
  if (movementType === "saving" || movementType === "investment") return "Ahorro";
  return "";
}

function methodNeedsBank(method) {
  return method === "card" || method === "bank_transfer";
}

function methodNeedsCard(method) {
  return method === "card";
}

const startingBalance = 0;
const incomeId = 'income';
const bankOptions = ["Bancolombia", "Davivienda", "Lulo", "Nequi"];
const cardOptionsByBank = {
  Bancolombia: ["Visa Clasica", "Mastercard Debito"],
  Davivienda: ["Debito Dinamica", "Mastercard Gold"],
  Lulo: ["Tarjeta Lulo Debito"],
  Nequi: ["Tarjeta Nequi"],
};
const accountOptions = [
  "Bancolombia - Cuenta Ahorros",
  "Lulo - Cuenta Digital",
  "Bolsillo Diario",
  "Nequi Principal",
];

const initialMovements = [
  {
    id: "seed-income-1",
    movementType: "income",
    date: "2026-02-01",
    detail: "Salario",
    notes: "",
    amount: 3200000,
    category: "Ingresos",
    subcategory: "Salario fijo",
    edge: "Nómina",
    method: "bank_transfer",
    bank: "Bancolombia",
    card: "",
    currency: "COP",
    tags: ["nomina"],
    attachments: [],
  },
  {
    id: "seed-1",
    movementType: "expense",
    date: "2026-02-21",
    detail: "Papa John's - pizza familiar",
    notes: "Promo 2x1 · pedido por app",
    amount: 42000,
    category: "Gastos",
    subcategory: "Alimentacion",
    edge: "Domicilios",
    method: "card",
    bank: "Bancolombia",
    card: "Visa Clasica",
    currency: "COP",
    tags: ["comida"],
    attachments: ["recibo-pizza.jpg"],
  },
  {
    id: "seed-2",
    movementType: "expense",
    date: "2026-02-20",
    detail: "Gasolina Terpel",
    notes: "",
    amount: 95000,
    category: "Gastos",
    subcategory: "Necesidades Basicas",
    edge: "Gasolina",
    method: "cash",
    bank: "",
    card: "",
    currency: "COP",
    tags: [],
    attachments: [],
  },
  {
    id: "seed-3",
    movementType: "saving",
    date: "2026-02-21",
    detail: "Fondo de Emergencia",
    notes: "Aporte mensual",
    amount: 200000,
    category: "Ahorro",
    subcategory: "Ahorros",
    edge: "Fondo de Emergencia",
    method: "bank_transfer",
    bank: "Bancolombia",
    card: "",
    currency: "COP",
    tags: ["meta"],
    attachments: [],
  },
  {
    id: "seed-4",
    movementType: "transfer",
    date: "2026-02-18",
    detail: "Mover dinero a Nequi",
    notes: "",
    amount: 350000,
    category: "",
    subcategory: "",
    edge: "",
    method: "bank_transfer",
    bank: "Bancolombia",
    card: "",
    currency: "COP",
    tags: [],
    attachments: [],
    transferFrom: "Bancolombia - Cuenta Ahorros",
    transferTo: "Nequi Principal",
  },
];

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

function normalizeForm(nextForm) {
  const next = { ...nextForm };

  if (next.movementType === "transfer") {
    next.category = "";
    next.subcategory = "";
    next.edge = "";
    next.method = "bank_transfer";
  } else {
    next.category = typeToCategory(next.movementType);
    const subcategories = getSubcategories(next.category);
    if (!subcategories.includes(next.subcategory)) {
      next.subcategory = subcategories[0] || "";
    }
    const aristas = getAristas(next.category, next.subcategory);
    if (!aristas.includes(next.edge)) {
      next.edge = aristas[0] || "";
    }
  }

  if (!methodNeedsBank(next.method)) {
    next.bank = "";
  }

  if (!methodNeedsCard(next.method)) {
    next.card = "";
  }

  const availableCards = cardOptionsByBank[next.bank] || [];
  if (next.card && !availableCards.includes(next.card)) {
    next.card = "";
  }

  return next;
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof text === "string") el.textContent = text;
  return el;
}

function parseTags(raw) {
  return String(raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = {
    sumIncome: document.getElementById("sum-income"),
    sumExpenses: document.getElementById("sum-expenses"),
    sumSavings: document.getElementById("sum-savings"),
    sumCount: document.getElementById("sum-count"),
    sumAvailable: document.getElementById("sum-available"),
    tableBody: document.getElementById("movements-body"),
    filterChips: document.getElementById("filter-chips"),
    searchInput: document.getElementById("expense-search"),
    toggleFilters: document.getElementById("toggle-filters"),
    advancedFilters: document.getElementById("advanced-filters"),
    filterDateFrom: document.getElementById("filter-date-from"),
    filterDateTo: document.getElementById("filter-date-to"),
    filterSubcategory: document.getElementById("filter-subcategory"),
    filterMethod: document.getElementById("filter-method"),
    filterBank: document.getElementById("filter-bank"),
    filterAttachmentsOnly: document.getElementById("filter-attachments-only"),
    filterClear: document.getElementById("filter-clear"),
    openDrawer: document.getElementById("open-drawer"),
    drawer: document.getElementById("drawer"),
    drawerBackdrop: document.getElementById("drawer-backdrop"),
    drawerClose: document.getElementById("drawer-close"),
    form: document.getElementById("movement-form"),
    movementTypes: document.getElementById("movement-types"),
    crumbCategory: document.getElementById("crumb-category"),
    crumbSubcategory: document.getElementById("crumb-subcategory"),
    crumbEdge: document.getElementById("crumb-edge"),
    edgeHelper: document.getElementById("edge-helper"),
    formAmount: document.getElementById("form-amount"),
    formDate: document.getElementById("form-date"),
    formCurrency: document.getElementById("form-currency"),
    categoryBlock: document.getElementById("category-block"),
    transferBlock: document.getElementById("transfer-block"),
    formCategory: document.getElementById("form-category"),
    formSubcategory: document.getElementById("form-subcategory"),
    formEdge: document.getElementById("form-edge"),
    formTransferFrom: document.getElementById("form-transfer-from"),
    formTransferTo: document.getElementById("form-transfer-to"),
    formDetail: document.getElementById("form-detail"),
    formNotes: document.getElementById("form-notes"),
    paymentMethods: document.getElementById("payment-methods"),
    bankCardBlock: document.getElementById("bank-card-block"),
    cardBlock: document.getElementById("card-block"),
    formBank: document.getElementById("form-bank"),
    formCard: document.getElementById("form-card"),
    formTags: document.getElementById("form-tags"),
    formAttachments: document.getElementById("form-attachments"),
    attachmentsHint: document.getElementById("attachments-hint"),
    feedback: document.getElementById("form-feedback"),
  };

  const state = {
    movements: [...initialMovements],
    filter: "all",
    search: "",
    filtersOpen: false,
    advanced: {
      dateFrom: "",
      dateTo: "",
      subcategory: "",
      method: "",
      bank: "",
      attachmentsOnly: false,
    },
    drawerOpen: false,
    form: createInitialForm(),
  };

  function setFeedback(type, text) {
    ui.feedback.hidden = !text;
    ui.feedback.className = `message ${type === "error" ? "message-error" : "message-ok"}`;
    ui.feedback.textContent = text || "";
  }

  function computeTotals() {
    return state.movements.reduce(
      (acc, item) => {
        if (item.movementType === "income") acc.income += item.amount;
        else if (item.movementType === "expense") acc.expenses += item.amount;
        else if (item.movementType === "saving" || item.movementType === "investment") acc.savings += item.amount;
        else acc.transfers += item.amount;
        return acc;
      },
      { income: 0, expenses: 0, savings: 0, transfers: 0 },
    );
  }

  function filteredMovements() {
    let items = state.movements.slice();

    if (state.filter === "income") items = items.filter((m) => m.movementType === "income");
    else if (state.filter === "expense") items = items.filter((m) => m.movementType === "expense");
    else if (state.filter === "saving") items = items.filter((m) => m.movementType === "saving" || m.movementType === "investment");
    else if (state.filter === "transfer") items = items.filter((m) => m.movementType === "transfer");

    const adv = state.advanced;
    if (adv.dateFrom) items = items.filter((m) => m.date >= adv.dateFrom);
    if (adv.dateTo) items = items.filter((m) => m.date <= adv.dateTo);
    if (adv.subcategory) items = items.filter((m) => m.subcategory === adv.subcategory);
    if (adv.method) items = items.filter((m) => m.method === adv.method);
    if (adv.bank) {
      if (adv.bank === "__none__") items = items.filter((m) => !m.bank);
      else items = items.filter((m) => m.bank === adv.bank);
    }
    if (adv.attachmentsOnly) items = items.filter((m) => (m.attachments?.length || 0) > 0);

    const query = String(state.search || "").trim().toLowerCase();
    if (!query) return items;

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
  }

  function renderSummary() {
    const totals = computeTotals();
    const available = startingBalance + totals.income - totals.expenses - totals.savings;

    ui.sumIncome.textContent = formatCurrency(totals.income, "COP");
    ui.sumExpenses.textContent = formatCurrency(totals.expenses, "COP");
    ui.sumSavings.textContent = formatCurrency(totals.savings, "COP");
    ui.sumCount.textContent = String(state.movements.length);
    ui.sumAvailable.textContent = formatCurrency(available, "COP");
  }

  function renderTable() {
    const items = filteredMovements();
    ui.tableBody.innerHTML = "";

    if (items.length === 0) {
      const tr = document.createElement("tr");
      tr.dataset.id = item.id;
      const td = document.createElement("td");
      td.colSpan = 6;
      const empty = createEl("div", "dashboard-empty", "No hay movimientos para este filtro.");
      td.appendChild(empty);
      tr.appendChild(td);
      ui.tableBody.appendChild(tr);
      return;
    }

    for (const item of items) {
      const isExpense = item.movementType === "expense";
      const isSaving = item.movementType === "saving" || item.movementType === "investment";
      const amountClass = isExpense ? "neg" : isSaving ? "pos" : "neutral";
      const amountPrefix = isExpense ? "-" : isSaving ? "+" : "";

      const tr = document.createElement("tr");

      const tdDate = createEl("td", null, item.date);

      const tdDetail = document.createElement("td");
      tdDetail.appendChild(createEl("p", "expense-row-title", item.detail));
      if (item.tags && item.tags.length) {
        tdDetail.appendChild(createEl("p", "expense-row-meta", `Tags: ${item.tags.join(", ")}`));
      }
      if (item.notes) {
        tdDetail.appendChild(createEl("p", "expense-row-meta", `Nota: ${item.notes}`));
      }
      if (item.attachments?.length) {
        tdDetail.appendChild(createEl("p", "expense-row-meta", `Adjuntos: ${item.attachments.length}`));
      }
      if (item.movementType === "transfer" && item.transferFrom && item.transferTo) {
        tdDetail.appendChild(
          createEl("p", "expense-row-meta", `Origen: ${item.transferFrom} · Destino: ${item.transferTo}`),
        );
      }

      const tdCat = document.createElement("td");
      const pill = createEl("span", `expense-kind-pill expense-kind-${item.movementType}`, movementLabel(item.movementType));
      tdCat.appendChild(pill);
      if (item.movementType !== "transfer") {
        tdCat.appendChild(createEl("span", "expense-path", `${item.subcategory} › ${item.edge || "Sin arista"}`));
      }

      const tdMethod = document.createElement("td");
      tdMethod.appendChild(createEl("p", "expense-row-title", paymentLabel(item.method)));
      tdMethod.appendChild(
        createEl(
          "p",
          "expense-row-meta",
          `${item.bank || "Sin banco"}${item.card ? ` · ${item.card}` : ""} · ${item.currency}`,
        ),
      );

      const tdAmount = createEl("td", `amount-col ${amountClass}`, `${amountPrefix}${formatCurrency(item.amount, item.currency)}`);

      tr.appendChild(tdDate);
      tr.appendChild(tdDetail);
      tr.appendChild(tdCat);
      tr.appendChild(tdMethod);
      tr.appendChild(tdAmount);

      const tdActions = document.createElement("td");
      const editBtn = createEl("button", "btn btn-ghost", "Editar");
      editBtn.type = "button";
      editBtn.addEventListener("click", () => {
        state.editingId = item.id;
        state.form = { ...item, tags: item.tags?.join(",") || "" };
        openDrawer();
      });
      const delBtn = createEl("button", "btn btn-ghost", "Eliminar");
      delBtn.type = "button";
      delBtn.addEventListener("click", () => deleteMovement(item.id));
      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);

      ui.tableBody.appendChild(tr);
    }
  }

  function updateChipActive() {
    const chips = ui.filterChips.querySelectorAll("[data-filter]");
    for (const chip of chips) {
      chip.classList.toggle("expense-filter-chip-active", chip.dataset.filter === state.filter);
    }
  }

  function deleteMovement(id) {
    state.movements = state.movements.filter((m) => m.id !== id);
    renderTable();
  }

  function clearAdvancedFilters() {
    state.advanced = {
      dateFrom: "",
      dateTo: "",
      subcategory: "",
      method: "",
      bank: "",
      attachmentsOnly: false,
    };

    ui.filterDateFrom.value = "";
    ui.filterDateTo.value = "";
    ui.filterSubcategory.value = "";
    ui.filterMethod.value = "";
    ui.filterBank.value = "";
    ui.filterAttachmentsOnly.checked = false;

    renderTable();
  }

  function toggleAdvancedFilters(force) {
    state.filtersOpen = typeof force === "boolean" ? force : !state.filtersOpen;
    ui.advancedFilters.hidden = !state.filtersOpen;
    ui.toggleFilters.textContent = state.filtersOpen ? "Ocultar filtros" : "Filtros";
  }

  function openDrawer() {
    setFeedback(null, "");
    state.drawerOpen = true;
    ui.drawer.classList.add("open");
    ui.drawer.setAttribute("aria-hidden", "false");
    ui.drawerBackdrop.hidden = false;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      ui.formAmount.focus();
    }, 10);
  }

  function closeDrawer() {
    setFeedback(null, "");
    state.drawerOpen = false;
    ui.drawer.classList.remove("open");
    ui.drawer.setAttribute("aria-hidden", "true");
    ui.drawerBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function renderForm() {
    const form = state.form;

    ui.formDate.value = form.date || todayIso();
    ui.formCurrency.value = form.currency || "COP";
    ui.formAmount.value = form.amount;
    ui.formDetail.value = form.detail;
    ui.formNotes.value = form.notes;
    ui.formTags.value = form.tags;

    ui.formCategory.value = form.category || "";

    const isTransfer = form.movementType === "transfer";
    ui.categoryBlock.hidden = isTransfer;
    ui.transferBlock.hidden = !isTransfer;

    if (isTransfer) {
      ui.edgeHelper.hidden = true;
      ui.crumbCategory.textContent = "Transfer";
      ui.crumbSubcategory.textContent = "Origen";
      ui.crumbEdge.textContent = "Destino";
    } else {
      ui.crumbCategory.textContent = form.category || "Categoria";
      ui.crumbSubcategory.textContent = form.subcategory || "Subcategoria";
      ui.crumbEdge.textContent = form.edge || "Arista";
    }

    const subcategories = getSubcategories(form.category);
    ui.formSubcategory.innerHTML = "";
    for (const option of subcategories) {
      const el = document.createElement("option");
      el.value = option;
      el.textContent = option;
      if (option === form.subcategory) el.selected = true;
      ui.formSubcategory.appendChild(el);
    }

    const aristas = getAristas(form.category, form.subcategory);
    ui.formEdge.innerHTML = "";
    if (aristas.length === 0) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "Sin aristas base";
      ui.formEdge.appendChild(empty);
      ui.formEdge.disabled = true;
      ui.edgeHelper.hidden = false;
    } else {
      ui.formEdge.disabled = false;
      ui.edgeHelper.hidden = true;
      for (const option of aristas) {
        const el = document.createElement("option");
        el.value = option;
        el.textContent = option;
        if (option === form.edge) el.selected = true;
        ui.formEdge.appendChild(el);
      }
    }

    // Movement type buttons
    const typeBtns = ui.movementTypes.querySelectorAll("[data-type]");
    for (const btn of typeBtns) {
      btn.classList.toggle("active", btn.dataset.type === form.movementType);
    }

    // Payment method buttons
    const methodBtns = ui.paymentMethods.querySelectorAll("[data-method]");
    for (const btn of methodBtns) {
      const isActive = btn.dataset.method === form.method;
      btn.classList.toggle("active", isActive);
      btn.disabled = isTransfer && btn.dataset.method !== "bank_transfer";
    }

    const bankRequired = !!form.method && methodNeedsBank(form.method);
    const cardRequired = !!form.method && methodNeedsCard(form.method);

    ui.bankCardBlock.hidden = !bankRequired;
    ui.cardBlock.hidden = !cardRequired;

    ui.formBank.value = form.bank || "";

    const cards = cardOptionsByBank[form.bank] || [];
    ui.formCard.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccionar tarjeta";
    ui.formCard.appendChild(placeholder);

    for (const card of cards) {
      const el = document.createElement("option");
      el.value = card;
      el.textContent = card;
      if (card === form.card) el.selected = true;
      ui.formCard.appendChild(el);
    }

    ui.formCard.disabled = !cardRequired || cards.length === 0;
    ui.formCard.value = form.card || "";

    // Transfer accounts
    if (isTransfer) {
      if (ui.formTransferFrom.options.length <= 1) {
        for (const option of accountOptions) {
          const el = document.createElement("option");
          el.value = option;
          el.textContent = option;
          ui.formTransferFrom.appendChild(el);
        }
      }
      if (ui.formTransferTo.options.length <= 1) {
        for (const option of accountOptions) {
          const el = document.createElement("option");
          el.value = option;
          el.textContent = option;
          ui.formTransferTo.appendChild(el);
        }
      }

      ui.formTransferFrom.value = form.transferFrom || "";
      ui.formTransferTo.value = form.transferTo || "";
    }

    // Attachments hint
    if (form.attachments && form.attachments.length) {
      ui.attachmentsHint.hidden = false;
      ui.attachmentsHint.textContent = `Adjuntos: ${form.attachments.join(", ")}`;
    } else {
      ui.attachmentsHint.hidden = true;
      ui.attachmentsHint.textContent = "";
    }
  }

  function updateForm(patch) {
    state.form = normalizeForm({ ...state.form, ...patch });
    renderForm();
  }

  function validateForm() {
    const issues = [];
    const form = state.form;
    const amount = Number(form.amount);

    if (!form.date) issues.push("Selecciona una fecha.");
    if (!String(form.detail || "").trim()) issues.push("Ingresa un detalle o compra.");
    if (!Number.isFinite(amount) || amount <= 0) issues.push("Ingresa un valor mayor a 0.");

    const isTransfer = form.movementType === "transfer";
    if (!isTransfer) {
      if (!form.subcategory) issues.push("Selecciona una subcategoria.");
      const aristas = getAristas(form.category, form.subcategory);
      if (aristas.length > 0 && !form.edge) issues.push("Selecciona una arista.");
    }

    if (form.movementType !== "income" && !form.method) issues.push("Selecciona un metodo de pago.");

    const bankRequired = !!form.method && methodNeedsBank(form.method);
    const cardRequired = !!form.method && methodNeedsCard(form.method);
    if (bankRequired && !form.bank) issues.push("Selecciona un banco para el metodo elegido.");
    if (cardRequired && !form.card) issues.push("Selecciona una tarjeta.");

    if (!form.currency) issues.push("Selecciona una moneda.");

    if (isTransfer) {
      if (!form.transferFrom || !form.transferTo) issues.push("Selecciona cuenta origen y destino.");
      if (form.transferFrom && form.transferTo && form.transferFrom === form.transferTo) {
        issues.push("La cuenta origen debe ser distinta a la cuenta destino.");
      }
    }

    return { issues, amount };
  }

  // ---------- Events ----------

  ui.filterChips.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    updateChipActive();
    renderTable();
  });

  ui.searchInput.addEventListener("input", () => {
    state.search = ui.searchInput.value;
    renderTable();
  });

  ui.toggleFilters.addEventListener("click", () => {
    toggleAdvancedFilters();
  });

  ui.filterDateFrom.addEventListener("change", () => {
    state.advanced.dateFrom = ui.filterDateFrom.value;
    ui.filterDateTo.min = ui.filterDateFrom.value || "";
    renderTable();
  });

  ui.filterDateTo.addEventListener("change", () => {
    state.advanced.dateTo = ui.filterDateTo.value;
    ui.filterDateFrom.max = ui.filterDateTo.value || "";
    renderTable();
  });

  ui.filterSubcategory.addEventListener("change", () => {
    state.advanced.subcategory = ui.filterSubcategory.value;
    renderTable();
  });

  ui.filterMethod.addEventListener("change", () => {
    state.advanced.method = ui.filterMethod.value;
    renderTable();
  });

  ui.filterBank.addEventListener("change", () => {
    state.advanced.bank = ui.filterBank.value;
    renderTable();
  });

  ui.filterAttachmentsOnly.addEventListener("change", () => {
    state.advanced.attachmentsOnly = ui.filterAttachmentsOnly.checked;
    renderTable();
  });

  ui.filterClear.addEventListener("click", clearAdvancedFilters);

  ui.openDrawer.addEventListener("click", () => { state.editingId = null; openDrawer(); });
  ui.drawerBackdrop.addEventListener("click", closeDrawer);
  ui.drawerClose.addEventListener("click", closeDrawer);

  window.addEventListener("keydown", (event) => {
    if (!state.drawerOpen) return;
    if (event.key === "Escape") {
      state.editingId = null;
    closeDrawer();
    }
  });

  ui.movementTypes.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-type]");
    if (!btn) return;
    updateForm({ movementType: btn.dataset.type });
  });

  ui.paymentMethods.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-method]");
    if (!btn) return;
    if (btn.disabled) return;
    updateForm({ method: btn.dataset.method });
  });

  ui.formSubcategory.addEventListener("change", () => {
    updateForm({ subcategory: ui.formSubcategory.value });
  });

  ui.formEdge.addEventListener("change", () => {
    updateForm({ edge: ui.formEdge.value });
  });

  ui.formBank.addEventListener("change", () => {
    updateForm({ bank: ui.formBank.value });
  });

  ui.formCard.addEventListener("change", () => {
    updateForm({ card: ui.formCard.value });
  });

  ui.formTransferFrom.addEventListener("change", () => {
    updateForm({ transferFrom: ui.formTransferFrom.value });
  });

  ui.formTransferTo.addEventListener("change", () => {
    updateForm({ transferTo: ui.formTransferTo.value });
  });

  ui.formAttachments.addEventListener("change", () => {
    const files = Array.from(ui.formAttachments.files || []);
    updateForm({ attachments: files.map((f) => f.name) });
  });

  ui.form.addEventListener("input", (event) => {
    if (event.target === ui.formAmount) updateForm({ amount: ui.formAmount.value });
    else if (event.target === ui.formDate) updateForm({ date: ui.formDate.value });
    else if (event.target === ui.formCurrency) updateForm({ currency: ui.formCurrency.value });
    else if (event.target === ui.formDetail) updateForm({ detail: ui.formDetail.value });
    else if (event.target === ui.formNotes) updateForm({ notes: ui.formNotes.value });
    else if (event.target === ui.formTags) updateForm({ tags: ui.formTags.value });
  });

  ui.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { issues, amount } = validateForm();

    if (issues.length > 0) {
      setFeedback("error", issues[0]);
      return;
    }

    const form = state.form;
    const movement = {
      id: state.editingId || `local-${Date.now()}`,
      movementType: form.movementType,
      date: form.date,
      detail: String(form.detail || "").trim(),
      notes: String(form.notes || "").trim(),
      amount,
      category: form.category,
      subcategory: form.subcategory,
      edge: form.edge,
      method: form.method,
      bank: form.bank,
      card: form.card,
      currency: form.currency,
      tags: parseTags(form.tags),
      attachments: form.attachments || [],
      transferFrom: form.transferFrom,
      transferTo: form.transferTo,
    };

    if (state.editingId) {
      state.movements = state.movements.map((m) => (m.id === state.editingId ? movement : m));
    } else {
      state.movements.unshift(movement);
    }
    renderSummary();
    renderTable();

    setFeedback(
      "ok",
      movement.movementType === "transfer"
        ? "Movimiento entre cuentas guardado. No afecta el balance."
        : "Movimiento guardado correctamente.",
    );

    const keepType = state.form.movementType;
    const keepCurrency = state.form.currency;
    state.form = normalizeForm({ ...createInitialForm(), movementType: keepType, currency: keepCurrency });
    ui.formAttachments.value = "";
    renderForm();
  });

  // Populate subcategory filter options
  const allSubcategories = uniqueSorted([
    ...getSubcategories("Gastos"),
    ...getSubcategories("Ahorro"),
  ]);
  for (const option of allSubcategories) {
    const el = document.createElement("option");
    el.value = option;
    el.textContent = option;
    ui.filterSubcategory.appendChild(el);
  }

  // Init transfer account selects
  for (const option of accountOptions) {
    const el1 = document.createElement("option");
    el1.value = option;
    el1.textContent = option;
    ui.formTransferFrom.appendChild(el1);

    const el2 = document.createElement("option");
    el2.value = option;
    el2.textContent = option;
    ui.formTransferTo.appendChild(el2);
  }

  // Initial render
  renderSummary();
  updateChipActive();
  toggleAdvancedFilters(false);
  renderTable();
  renderForm();
});
