import crypto from "node:crypto";

import { ensureTicketsSeeded, ensureUsersSeeded, readTickets, persistTickets, readUsers } from "@/lib/db";

const VALID_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

export async function listTickets(filters = {}) {
	ensureUsersSeeded();
	ensureTicketsSeeded();
	const tickets = readTickets();
	let data = tickets;
	if (filters.status) {
		data = data.filter((ticket) => ticket.status === filters.status);
	}
	if (filters.assignedTo) {
		data = data.filter((ticket) => ticket.assignedTo === filters.assignedTo);
	}
	if (filters.createdBy) {
		data = data.filter((ticket) => ticket.createdBy === filters.createdBy);
	}
	return data;
}

function resolveDefaultAgent() {
	const users = readUsers();
	return users.find((user) => user.role === "cs_agent") ?? null;
}

export async function createTicket(payload, currentUser) {
	ensureUsersSeeded();
	ensureTicketsSeeded();
	if (!payload?.title) {
		throw new Error("El título del ticket es obligatorio.");
	}
	if (!payload?.description) {
		throw new Error("La descripción es obligatoria.");
	}
	const tickets = readTickets();
	const defaultAgent = resolveDefaultAgent();
	const now = new Date().toISOString();
	const ticket = {
		id: crypto.randomUUID(),
		title: payload.title,
		description: payload.description,
		priority: VALID_PRIORITIES.has(payload.priority) ? payload.priority : "medium",
		status: "open",
		createdBy: currentUser?.id ?? null,
		assignedTo: payload.assignedTo ?? defaultAgent?.id ?? null,
		createdAt: now,
		updatedAt: now,
		comments: [],
	};
	tickets.unshift(ticket);
	persistTickets(tickets);
	return ticket;
}

export async function updateTicket(id, updates, currentUser) {
	ensureUsersSeeded();
	ensureTicketsSeeded();
	const tickets = readTickets();
	const index = tickets.findIndex((ticket) => ticket.id === id);
	if (index === -1) {
		throw new Error("El ticket no existe.");
	}
	const ticket = { ...tickets[index] };
	const isAgent = currentUser?.role === "cs_agent";
	const isCreator = currentUser?.id && ticket.createdBy === currentUser.id;

	if (!isAgent && !isCreator) {
		throw new Error("No tienes permisos para actualizar este ticket.");
	}

	if (isAgent) {
		if (ticket.assignedTo && ticket.assignedTo !== currentUser.id) {
			throw new Error("Este ticket está asignado a otro agente.");
		}
		if (updates.assignedTo && updates.assignedTo !== currentUser.id) {
			throw new Error("Solo puedes asignarte a ti mismo.");
		}
		if (!ticket.assignedTo) {
			ticket.assignedTo = currentUser.id;
		}
	} else if (!updates.comment) {
		throw new Error("Solo puedes agregar comentarios en tus tickets.");
	}

	if (updates.status && VALID_STATUSES.has(updates.status)) {
		ticket.status = updates.status;
	}
	if (updates.assignedTo && isAgent) {
		ticket.assignedTo = currentUser.id;
	}
	if (updates.priority && VALID_PRIORITIES.has(updates.priority)) {
		ticket.priority = updates.priority;
	}
	if (updates.comment) {
		ticket.comments = Array.isArray(ticket.comments) ? [...ticket.comments] : [];
		ticket.comments.push({
			id: crypto.randomUUID(),
			authorId: currentUser?.id ?? null,
			message: updates.comment,
			createdAt: new Date().toISOString(),
		});
	}
	ticket.updatedAt = new Date().toISOString();
	tickets[index] = ticket;
	persistTickets(tickets);
	return ticket;
}
