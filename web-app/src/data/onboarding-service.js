import crypto from "node:crypto";

import { readOnboardingRecords, persistOnboardingRecords } from "@/lib/db";

function clampScore(value) {
	return Math.max(0, Math.min(100, Math.round(value)));
}

function buildRecommendations(payload, disposableIncome, ratio) {
	const recomendaciones = [];
	if (disposableIncome <= 0) {
		recomendaciones.push("Tus gastos fijos superan a los ingresos. Revisa suscripciones o deudas que puedas renegociar.");
	} else if (ratio < 0.2) {
		recomendaciones.push("Ajusta tu presupuesto mensual para que al menos el 20% de tus ingresos vaya a metas o ahorros.");
	}

	const totalDebt = (payload.deudas ?? []).reduce((sum, debt) => sum + (Number(debt.balance) || 0), 0);
	if (totalDebt > 0) {
		recomendaciones.push("Prioriza el pago de deudas con intereses altos y arma un fondo de emergencias de 3 meses.");
	}

	if ((payload.metas ?? []).length === 0) {
		recomendaciones.push("Define metas SMART para avanzar hacia compras grandes o ahorro patrimonial.");
	}

	return recomendaciones;
}

export async function createOnboardingRecord(payload, user) {
	const ingresos = Number(payload.ingresosMensuales) || 0;
	const gastos = Number(payload.gastosFijos) || 0;
	const disposableIncome = ingresos - gastos;
	const ratio = ingresos > 0 ? disposableIncome / ingresos : 0;
	const scoreSalud = clampScore(ratio * 100);
	const recomendaciones = buildRecommendations(payload, disposableIncome, ratio);

	const records = readOnboardingRecords();
	records.push({
		id: crypto.randomUUID(),
		userId: user?.id ?? null,
		payload,
		result: { scoreSalud, recomendaciones },
		createdAt: new Date().toISOString(),
	});
	persistOnboardingRecords(records);

	return { scoreSalud, recomendaciones };
}
