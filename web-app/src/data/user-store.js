import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { ensureUsersSeeded, readUsers, persistUsers, readSessions, persistSessions } from "@/lib/db";

const SESSION_DAYS = 7;

function mapUser(row) {
	if (!row) {
		return null;
	}
	const { id, name, email, role, createdAt, householdMemberships = [], startHereConfigured = false } = row;
	return { id, name, email, role, createdAt, householdMemberships, startHereConfigured: Boolean(startHereConfigured) };
}

export async function createUser({ name, email, password, role = "client", householdMemberships = [] }) {
	await ensureUsersSeeded();
	const users = readUsers();
	const hashed = await bcrypt.hash(password, 10);
	const user = {
		id: crypto.randomUUID(),
		name,
		email: email.toLowerCase(),
		password: hashed,
		role,
		createdAt: new Date().toISOString(),
		householdMemberships,
		startHereConfigured: false,
	};
	users.push(user);
	persistUsers(users);
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		createdAt: user.createdAt,
		householdMemberships: user.householdMemberships,
		startHereConfigured: user.startHereConfigured,
	};
}

export async function findUserByEmail(email) {
	if (!email) return null;
	await ensureUsersSeeded();
	const users = readUsers();
	return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function verifyUserCredentials(email, password) {
	const user = await findUserByEmail(email);
	if (!user) {
		return null;
	}
	const match = await bcrypt.compare(password, user.password);
	if (!match) {
		return null;
	}
	return mapUser(user);
}

export async function getUserById(id) {
	if (!id) {
		return null;
	}
	await ensureUsersSeeded();
	const users = readUsers();
	return mapUser(users.find((user) => user.id === id) ?? null);
}

export async function findUserById(id) {
	if (!id) {
		return null;
	}
	await ensureUsersSeeded();
	const users = readUsers();
	return users.find((user) => user.id === id) ?? null;
}

export async function listUsers() {
	await ensureUsersSeeded();
	return readUsers().map((user) => mapUser(user));
}

export async function markStartHereConfigured(userId) {
	if (!userId) {
		return;
	}
	await ensureUsersSeeded();
	const users = readUsers();
	const index = users.findIndex((user) => user.id === userId);
	if (index === -1) {
		return;
	}
	if (users[index].startHereConfigured) {
		return;
	}
	users[index] = { ...users[index], startHereConfigured: true };
	persistUsers(users);
}

export async function createSession(userId) {
	await ensureUsersSeeded();
	const sessions = readSessions();
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
	sessions.push({ token, userId, expiresAt });
	persistSessions(sessions);
	return { token, expiresAt };
}

export async function deleteSession(token) {
	if (!token) {
		return;
	}
	await ensureUsersSeeded();
	const sessions = readSessions().filter((session) => session.token !== token);
	persistSessions(sessions);
}

export async function getUserBySession(token) {
	if (!token) {
		return null;
	}
	await ensureUsersSeeded();
	const session = readSessions().find((item) => item.token === token);
	if (!session) {
		return null;
	}
	if (new Date(session.expiresAt) < new Date()) {
		await deleteSession(token);
		return null;
	}
	return mapUser(readUsers().find((user) => user.id === session.userId) ?? null);
}
