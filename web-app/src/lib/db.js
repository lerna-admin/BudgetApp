import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import Database from "better-sqlite3";

import { countryCatalog } from "../config/countries";

const ADMIN_EMAIL = "admin@budgetapp.test";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Administrador";
const DATA_DIR = path.join(process.cwd(), "var", "data");
const DB_PATH = path.join(DATA_DIR, "budgetapp.sqlite");

let db;

function getDb() {
	if (db) {
		return db;
	}
	fs.mkdirSync(DATA_DIR, { recursive: true });
	db = new Database(DB_PATH);
	db.pragma("journal_mode = WAL");
	runMigrations(db);
	return db;
}

function runMigrations(instance) {
	const migrations = [
		`CREATE TABLE IF NOT EXISTS countries (
			code TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			currency TEXT NOT NULL,
			locale TEXT,
			timezone TEXT,
			provider TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			role TEXT NOT NULL,
			created_at TEXT NOT NULL,
			household_memberships TEXT NOT NULL,
			start_here_configured INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			token TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS households (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			plan_type TEXT NOT NULL,
			billing_user_id TEXT,
			members_json TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS budgets (
			id TEXT PRIMARY KEY,
			owner_type TEXT NOT NULL,
			owner_id TEXT,
			period TEXT NOT NULL,
			country TEXT NOT NULL,
			currency TEXT NOT NULL,
			frequency TEXT NOT NULL,
			start_balance REAL NOT NULL DEFAULT 0,
			start_with_money INTEGER NOT NULL DEFAULT 0,
			categories_json TEXT NOT NULL,
			totals_json TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			country TEXT NOT NULL,
			date TEXT NOT NULL,
			amount REAL NOT NULL,
			category_id TEXT NOT NULL,
			method TEXT,
			status TEXT,
			source TEXT,
			notes TEXT,
			attachments_json TEXT NOT NULL,
			household_id TEXT,
			owner_type TEXT NOT NULL DEFAULT 'personal',
			owner_id TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS alerts (
			id TEXT PRIMARY KEY,
			payload_json TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS onboarding (
			id TEXT PRIMARY KEY,
			user_id TEXT,
			payload_json TEXT NOT NULL,
			result_json TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS tickets (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			status TEXT NOT NULL,
			priority TEXT NOT NULL,
			created_by TEXT,
			assigned_to TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			comments_json TEXT NOT NULL
		)`,
	];
	instance.pragma("foreign_keys = ON");
	for (const statement of migrations) {
		instance.prepare(statement).run();
	}
	ensureColumn(instance, "users", "start_here_configured", "INTEGER NOT NULL DEFAULT 0");
	ensureColumn(instance, "budgets", "start_balance", "REAL NOT NULL DEFAULT 0");
	ensureColumn(instance, "budgets", "start_with_money", "INTEGER NOT NULL DEFAULT 0");
	ensureColumn(instance, "transactions", "owner_type", "TEXT NOT NULL DEFAULT 'personal'");
	ensureColumn(instance, "transactions", "owner_id", "TEXT");
}

function ensureColumn(instance, table, column, definition) {
	const columns = instance.prepare(`PRAGMA table_info(${table})`).all();
	const exists = columns.some((field) => field.name === column);
	if (!exists) {
		instance.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
	}
}

function toObjectJson(value) {
	return JSON.stringify(value ?? {});
}

function parseJson(text, fallback) {
	if (!text) {
		return fallback;
	}
	try {
		return JSON.parse(text);
	} catch {
		return fallback;
	}
}

function nowIso() {
	return new Date().toISOString();
}

export function readCountries() {
	return getDb()
		.prepare("SELECT code, name, currency, locale, timezone, provider FROM countries ORDER BY code ASC")
		.all();
}

export function persistCountries(countries = []) {
	const database = getDb();
	const insert = database.prepare(
		`INSERT INTO countries (code, name, currency, locale, timezone, provider)
		 VALUES (@code, @name, @currency, @locale, @timezone, @provider)`,
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM countries").run();
		for (const country of list) {
			insert.run({
				code: country.code,
				name: country.name,
				currency: country.currency,
				locale: country.locale ?? "es-CO",
				timezone: country.timezone ?? "America/Bogota",
				provider: country.provider ?? "",
			});
		}
	});
	tx(countries);
}

export function readUsers() {
	return getDb()
		.prepare(
			`SELECT id, name, email, password, role, created_at AS createdAt, household_memberships AS memberships,
			 start_here_configured AS startHereConfigured
			 FROM users ORDER BY created_at ASC`,
		)
		.all()
		.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			password: row.password,
			role: row.role,
			createdAt: row.createdAt,
			householdMemberships: parseJson(row.memberships, []),
			startHereConfigured: Boolean(row.startHereConfigured),
		}));
}

export function persistUsers(users = []) {
	const database = getDb();
	const insert = database.prepare(
		`INSERT INTO users (id, name, email, password, role, created_at, household_memberships, start_here_configured)
		 VALUES (@id, @name, @email, @password, @role, @created_at, @household_memberships, @start_here_configured)`,
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM users").run();
		for (const user of list) {
			insert.run({
				id: user.id,
				name: user.name,
				email: user.email,
				password: user.password,
				role: user.role,
				created_at: user.createdAt ?? nowIso(),
				household_memberships: JSON.stringify(user.householdMemberships ?? []),
				start_here_configured: user.startHereConfigured ? 1 : 0,
			});
		}
	});
	tx(users);
}

export function readSessions() {
	return getDb().prepare("SELECT token, user_id AS userId, expires_at AS expiresAt FROM sessions").all();
}

export function persistSessions(sessions = []) {
	const database = getDb();
	const insert = database.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (@token, @user_id, @expires_at)");
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM sessions").run();
		for (const session of list) {
			insert.run({
				token: session.token,
				user_id: session.userId,
				expires_at: session.expiresAt,
			});
		}
	});
	tx(sessions);
}

export function readBudgets() {
	return getDb()
		.prepare(
			`SELECT id, owner_type AS ownerType, owner_id AS ownerId, period, country, currency, frequency,
			 start_balance AS startBalance, start_with_money AS startWithMoney,
			 categories_json AS categoriesJson, totals_json AS totalsJson, created_at AS createdAt, updated_at AS updatedAt
			 FROM budgets`,
		)
		.all()
		.map((row) => ({
			id: row.id,
			ownerType: row.ownerType,
			ownerId: row.ownerId ?? null,
			period: row.period,
			country: row.country,
			currency: row.currency,
			frequency: row.frequency,
			startBalance: Number(row.startBalance) || 0,
			startWithMoney: Boolean(row.startWithMoney),
			categories: parseJson(row.categoriesJson, []),
			totals: parseJson(row.totalsJson, { asignado: 0, gastado: 0 }),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));
}

export function persistBudgets(budgets = []) {
	const database = getDb();
	const insert = database.prepare(
		`INSERT INTO budgets (id, owner_type, owner_id, period, country, currency, frequency, start_balance, start_with_money, categories_json, totals_json, created_at, updated_at)
		 VALUES (@id, @owner_type, @owner_id, @period, @country, @currency, @frequency, @start_balance, @start_with_money, @categories_json, @totals_json, @created_at, @updated_at)`,
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM budgets").run();
		for (const budget of list) {
			insert.run({
				id: budget.id,
				owner_type: budget.ownerType ?? "personal",
				owner_id: budget.ownerId ?? null,
				period: budget.period,
				country: budget.country,
				currency: budget.currency,
				frequency: budget.frequency ?? "monthly",
				start_balance: Number(budget.startBalance) || 0,
				start_with_money: budget.startWithMoney ? 1 : 0,
				categories_json: JSON.stringify(budget.categories ?? []),
				totals_json: JSON.stringify(budget.totals ?? { asignado: 0, gastado: 0 }),
				created_at: budget.createdAt ?? nowIso(),
				updated_at: budget.updatedAt ?? nowIso(),
			});
		}
	});
	tx(budgets);
}

export function readTransactions() {
	return getDb()
		.prepare(
			`SELECT id, country, date, amount, category_id AS categoryId, method, status, source, notes, attachments_json AS attachmentsJson, household_id AS householdId, owner_type AS ownerType, owner_id AS ownerId
			 FROM transactions
			 ORDER BY date DESC`,
		)
		.all()
		.map((row) => ({
			id: row.id,
			country: row.country,
			date: row.date,
			amount: row.amount,
			categoryId: row.categoryId,
			method: row.method,
			status: row.status,
			source: row.source,
			notes: row.notes ?? "",
			attachments: parseJson(row.attachmentsJson, []),
			householdId: row.householdId ?? null,
			ownerType: row.ownerType ?? "personal",
			ownerId: row.ownerId ?? null,
		}));
}

export function persistTransactions(transactions = []) {
	const database = getDb();
	const insert = database.prepare(
		`INSERT INTO transactions (id, country, date, amount, category_id, method, status, source, notes, attachments_json, household_id, owner_type, owner_id)
		 VALUES (@id, @country, @date, @amount, @category_id, @method, @status, @source, @notes, @attachments_json, @household_id, @owner_type, @owner_id)`,
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM transactions").run();
		for (const transaction of list) {
			insert.run({
				id: transaction.id,
				country: transaction.country,
				date: transaction.date,
				amount: transaction.amount,
				category_id: transaction.categoryId,
				method: transaction.method,
				status: transaction.status,
				source: transaction.source,
				notes: transaction.notes ?? "",
				attachments_json: JSON.stringify(transaction.attachments ?? []),
				household_id: transaction.householdId ?? null,
				owner_type: transaction.ownerType ?? "personal",
				owner_id: transaction.ownerId ?? null,
			});
		}
	});
	tx(transactions);
}

export function readAlerts() {
	return getDb()
		.prepare("SELECT id, payload_json AS payloadJson FROM alerts")
		.all()
		.map((row) => parseJson(row.payloadJson, {}));
}

export function persistAlerts(alerts = []) {
	const database = getDb();
	const insert = database.prepare("INSERT INTO alerts (id, payload_json) VALUES (@id, @payload_json)");
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM alerts").run();
		for (const alert of list) {
			insert.run({
				id: alert.id,
				payload_json: toObjectJson(alert),
			});
		}
	});
	tx(alerts);
}

export function readOnboardingRecords() {
	return getDb()
		.prepare("SELECT id, user_id AS userId, payload_json AS payloadJson, result_json AS resultJson, created_at AS createdAt FROM onboarding")
		.all()
		.map((row) => ({
			id: row.id,
			userId: row.userId ?? null,
			payload: parseJson(row.payloadJson, {}),
			result: parseJson(row.resultJson, {}),
			createdAt: row.createdAt,
		}));
}

export function persistOnboardingRecords(records = []) {
	const database = getDb();
	const insert = database.prepare(
		"INSERT INTO onboarding (id, user_id, payload_json, result_json, created_at) VALUES (@id, @user_id, @payload_json, @result_json, @created_at)",
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM onboarding").run();
		for (const record of list) {
			insert.run({
				id: record.id,
				user_id: record.userId ?? null,
				payload_json: toObjectJson(record.payload),
				result_json: toObjectJson(record.result),
				created_at: record.createdAt ?? nowIso(),
			});
		}
	});
	tx(records);
}

export function readHouseholds() {
	return getDb()
		.prepare(
			`SELECT id, name, plan_type AS planType, billing_user_id AS billingUserId, members_json AS membersJson, created_at AS createdAt, updated_at AS updatedAt FROM households`,
		)
		.all()
		.map((row) => ({
			id: row.id,
			name: row.name,
			planType: row.planType,
			billingUserId: row.billingUserId ?? null,
			members: parseJson(row.membersJson, []),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));
}

export function persistHouseholds(households = []) {
	const database = getDb();
	const insert = database.prepare(
		`INSERT INTO households (id, name, plan_type, billing_user_id, members_json, created_at, updated_at)
		 VALUES (@id, @name, @plan_type, @billing_user_id, @members_json, @created_at, @updated_at)`,
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM households").run();
		for (const household of list) {
			insert.run({
				id: household.id,
				name: household.name,
				plan_type: household.planType ?? "family",
				billing_user_id: household.billingUserId ?? null,
				members_json: JSON.stringify(household.members ?? []),
				created_at: household.createdAt ?? nowIso(),
				updated_at: household.updatedAt ?? nowIso(),
			});
		}
	});
	tx(households);
}

export function readTickets() {
	return getDb()
		.prepare(
			`SELECT id, title, description, status, priority, created_by AS createdBy, assigned_to AS assignedTo, created_at AS createdAt, updated_at AS updatedAt, comments_json AS commentsJson FROM tickets ORDER BY created_at DESC`,
		)
		.all()
		.map((row) => ({
			id: row.id,
			title: row.title,
			description: row.description,
			status: row.status,
			priority: row.priority,
			createdBy: row.createdBy ?? null,
			assignedTo: row.assignedTo ?? null,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			comments: parseJson(row.commentsJson, []),
		}));
}

export function persistTickets(tickets = []) {
	const database = getDb();
	const insert = database.prepare(
		`INSERT INTO tickets (id, title, description, status, priority, created_by, assigned_to, created_at, updated_at, comments_json)
		 VALUES (@id, @title, @description, @status, @priority, @created_by, @assigned_to, @created_at, @updated_at, @comments_json)`,
	);
	const tx = database.transaction((list) => {
		database.prepare("DELETE FROM tickets").run();
		for (const ticket of list) {
			insert.run({
				id: ticket.id,
				title: ticket.title,
				description: ticket.description,
				status: ticket.status,
				priority: ticket.priority,
				created_by: ticket.createdBy ?? null,
				assigned_to: ticket.assignedTo ?? null,
				created_at: ticket.createdAt ?? nowIso(),
				updated_at: ticket.updatedAt ?? nowIso(),
				comments_json: JSON.stringify(ticket.comments ?? []),
			});
		}
	});
	tx(tickets);
}

function buildSeedUser({ email, name, role, password = ADMIN_PASSWORD }) {
	return {
		id: crypto.randomUUID(),
		name,
		email,
		password: bcrypt.hashSync(password, 10),
		role,
		createdAt: nowIso(),
		householdMemberships: [],
	};
}

export function ensureCountriesSeeded(defaults = countryCatalog) {
	const existing = readCountries();
	if (existing.length === 0) {
		persistCountries(defaults);
	}
}

export function ensureUsersSeeded() {
	const users = readUsers();
	let changed = false;

	function ensureUser(seed) {
		const existing = users.find((user) => user.email === seed.email);
		if (existing) {
			return existing;
		}
		const user = buildSeedUser(seed);
		users.push(user);
		changed = true;
		return user;
	}

	ensureUser({ email: ADMIN_EMAIL, name: ADMIN_NAME, role: "admin", password: ADMIN_PASSWORD });
	ensureUser({ email: "agent@budgetapp.test", name: "CS Agent BudgetApp", role: "cs_agent", password: "Agent123!" });

	if (changed) {
		persistUsers(users);
	}
}

export function ensureHouseholdsSeeded() {
	ensureUsersSeeded();
}

export function ensureBudgetsSeeded() {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
}

export function ensureTicketsSeeded() {
	ensureUsersSeeded();
}
