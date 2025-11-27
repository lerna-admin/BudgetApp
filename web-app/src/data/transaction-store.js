import crypto from "node:crypto";

import { readTransactions, persistTransactions } from "@/lib/db";

const SAMPLE_TRANSACTIONS = [
	{ categoryId: "vivienda", amount: 1_200_000, method: "transfer", status: "posted", source: "bank", notes: "Arriendo" },
	{ categoryId: "alimentacion", amount: 320_000, method: "debit_card", status: "posted", source: "manual", notes: "Mercado" },
	{ categoryId: "transporte", amount: 180_000, method: "cash", status: "posted", source: "manual", notes: "Transporte público" },
	{ categoryId: "ocio", amount: 250_000, method: "credit_card", status: "pending", source: "bank", notes: "Streaming" },
	{ categoryId: "salud", amount: 95_000, method: "debit_card", status: "posted", source: "manual", notes: "Medicamentos" },
];

function seedTransactions() {
	const now = Date.now();
	return SAMPLE_TRANSACTIONS.map((item, index) => ({
		...item,
		id: crypto.randomUUID(),
		country: "CO",
		date: new Date(now - index * 24 * 60 * 60 * 1000).toISOString(),
		attachments: [],
		ownerType: "demo",
		ownerId: "seed",
		householdId: null,
	}));
}

function normalizeTransaction(payload = {}) {
	if (!payload.country) throw new Error("El país es obligatorio");
	if (!payload.date) throw new Error("La fecha es obligatoria");
	if (payload.amount === undefined) throw new Error("El monto es obligatorio");
	if (!payload.categoryId) throw new Error("La categoría es obligatoria");
	if (!payload.ownerType) throw new Error("El ámbito de la transacción es obligatorio.");
	if (payload.ownerType === "personal" && !payload.ownerId) throw new Error("Debes indicar el propietario de la transacción.");
	if (payload.ownerType === "household" && !payload.ownerId) throw new Error("Debes indicar el hogar de la transacción.");

	return {
		id: crypto.randomUUID(),
		country: payload.country.toUpperCase(),
		date: new Date(payload.date).toISOString(),
		amount: Number(payload.amount) || 0,
		categoryId: payload.categoryId,
		method: payload.method ?? "cash",
		status: payload.status ?? "posted",
		source: payload.source ?? "manual",
		notes: payload.notes ?? "",
		attachments: payload.attachments ?? [],
		ownerType: payload.ownerType,
		ownerId: payload.ownerId ?? null,
		householdId: payload.householdId ?? null,
	};
}

export async function listTransactions(filters = {}, options = {}) {
	const limit = Math.min(Number(filters.limit) || 50, 200);
	const includeSeed = options.includeSeed ?? false;
	let records = readTransactions();
	if (records.length === 0 && includeSeed) {
		records = seedTransactions();
	}
	let filtered = records;
	if (filters.ownerType) {
		filtered = filtered.filter((tx) => tx.ownerType === filters.ownerType);
	}
	if (filters.ownerId !== undefined) {
		filtered = filtered.filter((tx) => (tx.ownerId ?? null) === (filters.ownerId ?? null));
	}
	if (filters.source) {
		filtered = filtered.filter((tx) => tx.source === filters.source);
	}
	if (filters.status) {
		filtered = filtered.filter((tx) => tx.status === filters.status);
	}
	if (filters.householdId !== undefined) {
		const expected = filters.householdId ?? null;
		filtered = filtered.filter((tx) => (tx.householdId ?? null) === expected);
	}
	return {
		data: filtered.slice(0, limit),
		nextCursor: null,
	};
}

export async function createTransaction(payload) {
	const transactions = readTransactions();
	const transaction = normalizeTransaction(payload);
	transactions.unshift(transaction);
	persistTransactions(transactions);
	return transaction;
}
