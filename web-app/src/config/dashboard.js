import { paths } from "@/paths";

export const dashboardConfig = {
	layout: "vertical",
	navColor: "evident",
	navItems: [
		{
			key: "budgetapp",
			title: "BudgetApp",
			items: [
				{ key: "overview", title: "Resumen", href: paths.dashboard.overview, icon: "house", roles: ["admin", "cs_agent", "client"] },
				{ key: "settings", title: "Configuración", href: paths.dashboard.settings.account, icon: "gear", roles: ["admin"] },
				{ key: "chat", title: "Chat", href: paths.dashboard.chat.base, icon: "chats-circle", roles: ["admin", "cs_agent"] },
				{ key: "calendar", title: "Calendario", href: paths.dashboard.calendar, icon: "calendar-check", roles: ["admin", "cs_agent"] },
				{
					key: "tasks",
					title: "Tasks",
					href: paths.dashboard.support.tickets,
					icon: "kanban",
					roles: ["admin"],
				},
				{ key: "budgets", title: "Presupuestos", href: paths.dashboard.budgets, icon: "chart-pie", roles: ["cs_agent", "client"] },
				{
					key: "transactions:list",
					title: "Movimientos",
					href: paths.dashboard.transactions.list,
					icon: "currency-circle-dollar",
					roles: ["cs_agent", "client"],
				},
				{
					key: "transactions:create",
					title: "Registrar transacción",
					href: paths.dashboard.transactions.create,
					icon: "credit-card",
					roles: ["cs_agent", "client"],
				},
				{
					key: "integrations",
					title: "Integraciones bancarias",
					href: paths.dashboard.integrations.banks,
					icon: "link",
					roles: ["admin", "cs_agent"],
				},
				{
					key: "customers",
					title: "Clientes",
					href: paths.dashboard.customers.list,
					icon: "users",
					roles: ["admin", "cs_agent"],
				},
				{
					key: "family",
					title: "Mi familia",
					href: paths.dashboard.family,
					icon: "users",
					roles: ["client"],
				},
				{
					key: "tickets",
					title: "Tickets",
					href: paths.dashboard.support.tickets,
					icon: "chats-circle",
					roles: ["admin", "cs_agent", "client"],
				},
				{ key: "onboarding", title: "Onboarding financiero", href: paths.dashboard.onboarding, icon: "calendar-check", roles: ["client"] },
				{ key: "admin:countries", title: "Admin países", href: paths.dashboard.admin.countries, icon: "translate", roles: ["admin"] },
				{ key: "admin:overview", title: "Panel admin", href: paths.dashboard.admin.overview, icon: "chart-pie", roles: ["admin"] },
			],
		},
	],
};
