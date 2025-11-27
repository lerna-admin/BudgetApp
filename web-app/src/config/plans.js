export const planCatalog = [
	{
		id: "personal_free",
		name: "Personal Free",
		description: "Prueba BudgetApp registrando un presupuesto activo con historial de hasta 30 días.",
		maxMembers: 1,
		features: ["1 presupuesto activo", "Historial de 30 días", "Registro manual de transacciones"],
	},
	{
		id: "personal",
		name: "Personal",
		description: "Control total para usuarios individuales: historial ilimitado y sincronización bancaria opcional.",
		maxMembers: 1,
		features: ["Presupuestos ilimitados", "Alertas esenciales + email", "Integración bancaria para cuentas personales"],
	},
	{
		id: "family",
		name: "Family",
		description: "Plan único para hogares de hasta 5 personas con presupuestos compartidos, soporte prioritario y alertas avanzadas.",
		maxMembers: 5,
		features: ["Hasta 5 miembros", "Prueba gratuita de 5 días", "Alertas predictivas en tiempo real", "Integración bancaria familiar"],
	},
];

const legacyPlanMap = {
	personal: "personal",
	family_basic: "family",
	family_plus: "family",
};

export function getPlanById(planId) {
	const normalizedId = legacyPlanMap[planId] ?? planId;
	return planCatalog.find((plan) => plan.id === normalizedId) ?? planCatalog[0];
}
