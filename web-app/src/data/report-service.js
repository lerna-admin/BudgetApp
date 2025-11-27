import {
	ensureCountriesSeeded,
	ensureHouseholdsSeeded,
	ensureTicketsSeeded,
	ensureUsersSeeded,
	readBudgets,
	readCountries,
	readHouseholds,
	readTickets,
	readUsers,
} from "@/lib/db";

const STATUS_LABELS = {
	open: "Abiertos",
	in_progress: "En progreso",
	resolved: "Resueltos",
	closed: "Cerrados",
};

const PRIORITY_LABELS = {
	high: "Alta",
	medium: "Media",
	low: "Baja",
};

const PLAN_LABELS = {
	personal_free: "Personal Free",
	personal: "Personal",
	family: "Family",
};

function aggregateTicketsByStatus(tickets = []) {
	const statuses = Object.keys(STATUS_LABELS);
	return statuses.map((status) => ({
		status,
		label: STATUS_LABELS[status],
		value: tickets.filter((ticket) => ticket.status === status).length,
	}));
}

function aggregateTicketPriorities(tickets = []) {
	const priorities = Object.keys(PRIORITY_LABELS);
	return priorities.map((priority) => ({
		priority,
		label: PRIORITY_LABELS[priority],
		value: tickets.filter((ticket) => ticket.priority === priority).length,
	}));
}

function normalizePlanType(rawPlanType) {
	if (rawPlanType === "family_basic" || rawPlanType === "family_plus") {
		return "family";
	}
	return rawPlanType ?? "family";
}

function aggregateHouseholdsByPlan(households = []) {
	const map = new Map();
	for (const household of households) {
		const key = normalizePlanType(household.planType);
		const current = map.get(key) ?? 0;
		map.set(key, current + 1);
	}
	return [...map.entries()].map(([planType, count]) => ({
		planType,
		label: PLAN_LABELS[planType] ?? planType,
		count,
	}));
}

function aggregateBudgetScope(budgets = []) {
	const scopeCounts = budgets.reduce(
		(acc, budget) => {
			if (budget.ownerType === "household") {
				acc.household += 1;
			} else {
				acc.personal += 1;
			}
			return acc;
		},
		{ personal: 0, household: 0 },
	);
	return [
		{ scope: "personal", label: "Individual", count: scopeCounts.personal },
		{ scope: "household", label: "Familiar", count: scopeCounts.household },
	];
}

function aggregateBudgetTrend(budgets = []) {
	const map = new Map();
	for (const budget of budgets) {
		const period = budget.period ?? "N/A";
		const record = map.get(period) ?? { period, asignado: 0, gastado: 0 };
		const totals = budget.totals ?? { asignado: 0, gastado: 0 };
		record.asignado += totals.asignado ?? 0;
		record.gastado += totals.gastado ?? 0;
		map.set(period, record);
	}
	return [...map.values()]
		.sort((a, b) => a.period.localeCompare(b.period))
		.slice(-8);
}

function aggregateCountryAdoption(budgets = [], countries = []) {
	const dictionary = new Map();
	for (const budget of budgets) {
		const code = (budget.country ?? "ND").toUpperCase();
		const entry =
			dictionary.get(code) ??
			{
				code,
				name: countries.find((country) => country.code === code)?.name ?? code,
				budgets: 0,
				asignado: 0,
				gastado: 0,
				householdBudgets: 0,
			};
		entry.budgets += 1;
		entry.asignado += budget.totals?.asignado ?? 0;
		entry.gastado += budget.totals?.gastado ?? 0;
		if (budget.ownerType === "household") {
			entry.householdBudgets += 1;
		}
		dictionary.set(code, entry);
	}
	return [...dictionary.values()]
		.sort((a, b) => b.budgets - a.budgets)
		.slice(0, 5);
}

export async function getKpiSummary() {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	ensureTicketsSeeded();
	ensureCountriesSeeded();

	const users = readUsers();
	const households = readHouseholds();
	const tickets = readTickets();
	const budgets = readBudgets();
	const countries = readCountries();

	const clients = users.filter((user) => user.role === "client").length;
	const agents = users.filter((user) => user.role === "cs_agent").length;
	const householdBudgets = budgets.filter((budget) => budget.ownerType === "household");
	const averageHouseholdAssignation =
		householdBudgets.reduce((sum, budget) => sum + (budget.totals?.asignado ?? 0), 0) / (householdBudgets.length || 1);
	const ticketsByStatus = aggregateTicketsByStatus(tickets);
	const priorityMix = aggregateTicketPriorities(tickets);
	const householdsByPlan = aggregateHouseholdsByPlan(households);
	const budgetScopeSplit = aggregateBudgetScope(budgets);
	const monthlyBudgetTrend = aggregateBudgetTrend(budgets);
	const countryAdoption = aggregateCountryAdoption(budgets, countries);
	const activeTickets = tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress");
	const ticketsPerAgent = agents > 0 ? Number((activeTickets.length / agents).toFixed(1)) : activeTickets.length;
	const backlogRatio = tickets.length > 0 ? Math.round((activeTickets.length / tickets.length) * 100) : 0;

	return {
		totalUsers: users.length,
		totalClients: clients,
		totalAgents: agents,
		activeHouseholds: households.length,
		openTickets: activeTickets.length,
		averageHouseholdBudget: Math.round(averageHouseholdAssignation),
		ticketsByStatus,
		householdsByPlan,
		budgetScopeSplit,
		monthlyBudgetTrend,
		countryAdoption,
		supportLoad: {
			ticketsPerAgent,
			backlogRatio,
			activeTickets: activeTickets.length,
			priorityMix,
		},
	};
}
