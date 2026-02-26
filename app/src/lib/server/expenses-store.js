const { randomUUID } = require("node:crypto");

// Simple in-memory store. In real usage, replace with DB.
const store = {
  movements: [
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
  ],
};

function list() {
  return store.movements.slice().sort((a, b) => b.date.localeCompare(a.date));
}

function create(data) {
  const movement = { ...data, id: data.id || randomUUID() };
  store.movements.unshift(movement);
  return movement;
}

function update(id, patch) {
  const idx = store.movements.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.movements[idx] = { ...store.movements[idx], ...patch, id };
  return store.movements[idx];
}

function remove(id) {
  const idx = store.movements.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const [removed] = store.movements.splice(idx, 1);
  return removed;
}

module.exports = { list, create, update, remove };
