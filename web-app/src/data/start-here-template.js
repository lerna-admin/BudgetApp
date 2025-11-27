// Plantilla base basada en la pestaña Start Here del Excel de presupuesto.
export const startHereTemplate = {
	currency: "COP",
	startBalance: 0,
	startWithMoney: false,
	groups: [
	{
		id: "income",
		label: "Income",
		type: "income",
		description: "Salarios y otras fuentes de ingreso reportadas en Start Here.",
		accentColor: "#dfe0fb",
		subcategories: [
			{ id: "salario", label: "Salario" },
			{ id: "freelance", label: "Freelance" },
		],
	},
	{
		id: "savings",
		label: "Savings",
		type: "savings",
		description: "Metas de ahorro etiquetadas manualmente.",
		accentColor: "#eedff5",
		subcategories: [{ id: "moto", label: "Moto" }],
	},
	{
		id: "bills",
		label: "Bills",
		type: "expenses",
		description: "Servicios y obligaciones mensuales (internet, administración, celular).",
		accentColor: "#f2d8e5",
		subcategories: [
			{ id: "internet", label: "Internet" },
			{ id: "administracion", label: "Administración" },
			{ id: "celular", label: "Celular" },
		],
	},
	{
		id: "expenses",
		label: "Expenses",
		type: "expenses",
		description: "Gastos cotidianos con mayor variabilidad.",
		accentColor: "#f5dfd4",
		subcategories: [
			{ id: "comida", label: "Comida" },
			{ id: "discresionales", label: "Discresionales" },
			{ id: "culitos", label: "Culitos" },
			{ id: "salidas", label: "Salidas" },
		],
	},
	{
		id: "debt",
		label: "Debt",
		type: "debt",
		description: "Préstamos y tarjetas que deben monitorearse.",
		accentColor: "#dff1f5",
		subcategories: [
			{ id: "carro-facil", label: "Carro Facil" },
			{ id: "cuota-apartamento", label: "Cuota Apartamento" },
			{ id: "mama", label: "Mama" },
			{ id: "marcela", label: "Marcela" },
			{ id: "nestor", label: "Nestor" },
			{ id: "prestamos", label: "Prestamos" },
		],
	},
	],
};

export function hydrateStartHereTemplate(overrides = {}) {
	const template = structuredClone(startHereTemplate);
	template.currency = overrides.currency || template.currency;
	template.startBalance = Number.isFinite(overrides.startBalance) ? overrides.startBalance : template.startBalance;
	template.startWithMoney = Boolean(overrides.startWithMoney ?? template.startWithMoney);
	template.groups = template.groups.map((group) => ({
		...group,
		subcategories: group.subcategories.map((subcategory) => ({
			...subcategory,
			asignado: 0,
		})),
	}));
	return template;
}
