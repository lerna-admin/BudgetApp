import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { redirect } from "next/navigation";

import { appConfig } from "@/config/app";
import { planCatalog } from "@/config/plans";
import { CustomersFilters } from "@/components/dashboard/customer/customers-filters";
import { CustomersPagination } from "@/components/dashboard/customer/customers-pagination";
import { CustomersSelectionProvider } from "@/components/dashboard/customer/customers-selection-context";
import { CustomersTable } from "@/components/dashboard/customer/customers-table";
import { getCurrentUser } from "@/lib/auth";
import { readHouseholds, readUsers } from "@/lib/db";

export const metadata = { title: `Customers | Dashboard | ${appConfig.name}` };

export default async function Page({ searchParams }) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "cs_agent" && user.role !== "admin") {
		redirect("/dashboard");
	}

	const email = typeof searchParams?.email === "string" ? searchParams.email : "";
	const phone = typeof searchParams?.phone === "string" ? searchParams.phone : "";
	const plan = typeof searchParams?.plan === "string" ? searchParams.plan : "";
	const sortDir = searchParams?.sortDir === "asc" ? "asc" : "desc";

	const { customers, tabs } = buildCustomerDataset({ email, phone, plan, sortDir });

	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={4}>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Clientes por licencia</Typography>
						<Typography color="text.secondary" variant="body2">
							Identifica rápidamente qué plan utilizan tus clientes y cuántos están listos para un upgrade familiar.
						</Typography>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
						<Button startIcon={<PlusIcon />} variant="contained">
							Nuevo cliente
						</Button>
					</Box>
				</Stack>
				<CustomersSelectionProvider customers={customers}>
					<Card>
						<CustomersFilters filters={{ email, phone, plan }} sortDir={sortDir} tabs={tabs} />
						<Divider />
						<Box sx={{ overflowX: "auto" }}>
							<CustomersTable rows={customers} />
						</Box>
						<Divider />
						<CustomersPagination count={customers.length} page={0} />
					</Card>
				</CustomersSelectionProvider>
			</Stack>
		</Box>
	);
}

function normalizeHouseholdPlan(planType) {
	if (planType === "family_basic" || planType === "family_plus") {
		return "family";
	}
	return planType ?? "family";
}

const QUOTA_BY_PLAN = {
	personal_free: 20,
	personal: 35,
	family: 90,
};

function buildCustomerDataset(filters) {
	const users = readUsers().filter((user) => user.role === "client");
	const households = readHouseholds();

	const enriched = users.map((user) => {
		const membership = user.householdMemberships?.[0];
		const userPlanType = planCatalog.some((plan) => plan.id === user.planType) ? user.planType : "personal_free";
		let planType = userPlanType;
		let householdName = null;
		let planLabel = planCatalog.find((plan) => plan.id === planType)?.name ?? "Personal Free";

		if (membership) {
			const household = households.find((item) => item.id === membership.householdId);
			if (household) {
				planType = normalizeHouseholdPlan(household.planType);
				planLabel = planCatalog.find((plan) => plan.id === planType)?.name ?? "Family";
				householdName = household.name;
			}
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			phone: householdName ?? "—",
			createdAt: new Date(user.createdAt ?? Date.now()),
			status: "active",
			planType,
			planLabel,
			quota: QUOTA_BY_PLAN[planType] ?? 35,
		};
	});

	const tabs = buildPlanTabs(enriched);
	const filtered = applyCustomerFilters(enriched, filters);
	const sorted = applyCustomerSort(filtered, filters.sortDir);

	return { customers: sorted, tabs };
}

function applyCustomerFilters(rows, { email, phone, plan }) {
	return rows.filter((row) => {
		if (plan && row.planType !== plan) {
			return false;
		}
		if (email && !row.email.toLowerCase().includes(email.toLowerCase())) {
		 return false;
		}
		if (phone && !(row.phone ?? "").toLowerCase().includes(phone.toLowerCase())) {
			return false;
		}
		return true;
	});
}

function applyCustomerSort(rows, sortDir) {
	return [...rows].sort((a, b) =>
		sortDir === "asc"
			? a.createdAt.getTime() - b.createdAt.getTime()
			: b.createdAt.getTime() - a.createdAt.getTime(),
	);
}

function buildPlanTabs(rows) {
	const total = rows.length;
	const counts = planCatalog.map((plan) => ({
		label: plan.name,
		value: plan.id,
		count: rows.filter((row) => row.planType === plan.id).length,
	}));

	return [{ label: "Todos", value: "", count: total }, ...counts];
}
