import crypto from "node:crypto";

import { getCountry } from "@/data/country-store";
import { readBudgets, persistBudgets } from "@/lib/db";

const DEFAULT_CATEGORY_TEMPLATE = [
	{ categoryId: "vivienda", weight: 0.28, execution: 0.65 },
	{ categoryId: "alimentacion", weight: 0.22, execution: 0.7 },
	{ categoryId: "transporte", weight: 0.12, execution: 0.55 },
	{ categoryId: "salud", weight: 0.08, execution: 0.4 },
	{ categoryId: "educacion", weight: 0.15, execution: 0.5 },
	{ categoryId: "ocio", weight: 0.15, execution: 0.8 },
];

function slugify(value) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replaceAll(/[\u0300-\u036F]/g, "")
		.replaceAll(/[^a-z0-9]+/g, "-")
		.replaceAll(/^-+|-+$/g, "") || `subcategory-${crypto.randomUUID().slice(0, 8)}`;
}

function calculateTotals(categories = []) {
	const asignado = categories.reduce((sum, category) => sum + (Number(category.asignado) || 0), 0);
	const gastado = categories.reduce((sum, category) => sum + (Number(category.gastado) || 0), 0);
	return { asignado, gastado };
}

function sanitizeSubcategories(items = []) {
	return items
		.filter((item) => Boolean(item?.id || item?.label || item?.name))
		.map((item) => {
			const label = item.label || item.name || item.categoryId || "Sin nombre";
			return {
				id: item.id || slugify(label),
				label,
				asignado: Math.max(Number(item.asignado) || 0, 0),
				gastado: Math.max(Number(item.gastado) || 0, 0),
				startWithMoney: Boolean(item.startWithMoney),
			};
		});
}

function sanitizeCategories(rawCategories = []) {
	return rawCategories
		.filter((category) => Boolean(category?.categoryId || category?.id))
		.map((category) => {
			const subcategories = sanitizeSubcategories(category.subcategories || []);
			const sanitized = {
				categoryId: category.categoryId || category.id,
				asignado: Math.max(Number(category.asignado) || 0, 0),
				gastado: Math.max(Number(category.gastado) || 0, 0),
				subcategories,
			};
			if (subcategories.length > 0) {
				sanitized.asignado = subcategories.reduce((sum, item) => sum + item.asignado, 0);
				sanitized.gastado = subcategories.reduce((sum, item) => sum + (Number(item.gastado) || 0), 0);
			}
			return sanitized;
		});
}

async function createDefaultBudget({ period, countryCode, ownerType, ownerId, frequency }) {
	const normalizedCode = (countryCode ?? "CO").toUpperCase();
	const country = await getCountry(normalizedCode);
	const currency = country?.currency ?? "COP";
	const baseAmount = 5_000_000;
	const categories = DEFAULT_CATEGORY_TEMPLATE.map((item) => {
		const asignado = Math.round(baseAmount * item.weight);
		const gastado = Math.round(asignado * item.execution);
		return { categoryId: item.categoryId, asignado, gastado };
	});
	const totals = calculateTotals(categories);
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		period,
		country: normalizedCode,
		currency,
		startBalance: 0,
		startWithMoney: false,
		categories,
		totals,
		ownerType,
		ownerId,
		frequency,
		createdAt: now,
		updatedAt: now,
	};
}

async function buildEmptyBudget({ period, countryCode, ownerType, ownerId, frequency }) {
	const normalizedCode = (countryCode ?? "CO").toUpperCase();
	const country = await getCountry(normalizedCode);
	return {
		id: null,
		period,
		country: normalizedCode,
		currency: country?.currency ?? "COP",
		startBalance: 0,
		startWithMoney: false,
		categories: [],
		totals: { asignado: 0, gastado: 0 },
		ownerType,
		ownerId: ownerId ?? null,
		frequency,
		isPlaceholder: true,
	};
}

function findBudgetIndex(budgets, { period, country, ownerType, ownerId, frequency }) {
	return budgets.findIndex((item) => {
		const sameOwner =
			item.ownerType === ownerType && (item.ownerId ?? null) === (ownerId ?? null);
		return (
			item.period === period &&
			item.country === country &&
			item.frequency === frequency &&
			sameOwner
		);
	});
}

export async function getBudget({ period, countryCode, ownerType, ownerId, frequency }, options = {}) {
	if (!period) {
		throw new Error("El periodo es obligatorio");
	}
	if (!ownerType) {
		throw new Error("Debes definir el propietario del presupuesto.");
	}
	const normalizedCode = (countryCode ?? "CO").toUpperCase();
	const budgets = readBudgets();
	const index = findBudgetIndex(budgets, {
		period,
		country: normalizedCode,
		ownerType,
		ownerId,
		frequency,
	});
	if (index !== -1) {
		const budget = budgets[index];
		const totals = calculateTotals(budget.categories);
		if (!budget.totals || budget.totals.asignado !== totals.asignado || budget.totals.gastado !== totals.gastado) {
			budgets[index] = { ...budget, totals };
			persistBudgets(budgets);
			return budgets[index];
		}
		return budget;
	}
	const autoCreate = options.autoCreate ?? true;
	if (!autoCreate) {
		return buildEmptyBudget({
			period,
			countryCode: normalizedCode,
			ownerType,
			ownerId,
			frequency,
		});
	}
	const fallback = await createDefaultBudget({
		period,
		countryCode: normalizedCode,
		ownerType,
		ownerId,
		frequency,
	});
	budgets.push(fallback);
	persistBudgets(budgets);
	return fallback;
}

export async function upsertBudget(payload, { ownerType, ownerId, frequency, periodOverride } = {}) {
	if (!payload?.period) {
		throw new Error("El periodo es obligatorio");
	}
	if (!payload.categories || payload.categories.length === 0) {
		throw new Error("Debes incluir al menos una categoría");
	}
	const normalizedCode = (payload.country ?? "CO").toUpperCase();
	const normalizedFrequency = frequency ?? payload.frequency ?? "monthly";
	const budgets = readBudgets();
	const index = findBudgetIndex(budgets, {
		period: periodOverride ?? payload.period,
		country: normalizedCode,
		ownerType,
		ownerId,
		frequency: normalizedFrequency,
	});
	const categories = sanitizeCategories(payload.categories);
	const totals = calculateTotals(categories);
	const country = await getCountry(normalizedCode);
	const currency = payload.currency || country?.currency || "COP";
	const startBalance = Number(payload.startBalance) || 0;
	const startWithMoney = Boolean(payload.startWithMoney);
	const now = new Date().toISOString();
	const previous = index >= 0 ? budgets[index] : null;
	const budget = {
		id: previous?.id ?? crypto.randomUUID(),
		period: periodOverride ?? payload.period,
		country: normalizedCode,
		currency,
		startBalance,
		startWithMoney,
		categories,
		totals,
		ownerType: ownerType ?? previous?.ownerType ?? "personal",
		ownerId: ownerId ?? previous?.ownerId ?? null,
		frequency: normalizedFrequency,
		createdAt: previous?.createdAt ?? now,
		updatedAt: now,
	};
	if (index === -1) {
		budgets.push(budget);
	} else {
		budgets[index] = budget;
	}
	persistBudgets(budgets);
	return budget;
}
