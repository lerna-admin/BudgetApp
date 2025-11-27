import crypto from "node:crypto";

import { readAlerts, persistAlerts } from "@/lib/db";

const VALID_TYPES = new Set(["budget_over", "transaction_large", "goal_at_risk"]);
const VALID_CHANNELS = new Set(["push", "email", "whatsapp"]);

function normalizeAlert(payload = {}) {
	if (!payload.type || !VALID_TYPES.has(payload.type)) {
		throw new Error("Tipo de alerta inválido");
	}
	const channels = Array.isArray(payload.channels) ? payload.channels.filter((channel) => VALID_CHANNELS.has(channel)) : [];
	if (channels.length === 0) {
		throw new Error("Debes definir al menos un canal válido");
	}
	return {
		id: crypto.randomUUID(),
		type: payload.type,
		threshold: typeof payload.threshold === "number" ? payload.threshold : null,
		channels,
		createdAt: new Date().toISOString(),
	};
}

export async function createAlert(payload) {
	const alerts = readAlerts();
	const alert = normalizeAlert(payload);
	alerts.push(alert);
	persistAlerts(alerts);
	return alert;
}
