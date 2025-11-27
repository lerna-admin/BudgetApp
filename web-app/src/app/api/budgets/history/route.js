import { NextResponse } from "next/server";

import { readBudgets } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function formatTotals(budget) {
	return {
		asignado: budget.totals?.asignado ?? 0,
		gastado: budget.totals?.gastado ?? 0,
	};
}

export async function GET(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	const url = new URL(request.url);
	const scope = url.searchParams.get("scope") ?? "personal";
	const isAgent = user.role === "admin" || user.role === "cs_agent";
	const budgets = readBudgets();
	let filtered = [];

	if (scope === "household") {
		const memberships = user.householdMemberships ?? [];
		const targetHousehold = url.searchParams.get("householdId");
		const allowedHouseholds = new Set(memberships.map((item) => item.householdId));
		if (isAgent && targetHousehold) {
			filtered = budgets.filter(
				(item) => item.ownerType === "household" && (item.ownerId ?? null) === targetHousehold,
			);
		} else if (allowedHouseholds.size > 0) {
			filtered = budgets.filter(
				(item) => item.ownerType === "household" && allowedHouseholds.has(item.ownerId ?? ""),
			);
		} else {
			return NextResponse.json({ data: [] });
		}
	} else {
		const requestedUserId = isAgent ? url.searchParams.get("userId") : null;
		const targetUserId = requestedUserId || user.id;
		filtered = budgets.filter(
			(item) => item.ownerType === "personal" && (item.ownerId ?? null) === targetUserId,
		);
	}

	const data = filtered
		.sort((a, b) => {
			if (a.period === b.period) {
				return 0;
			}
			return a.period > b.period ? -1 : 1;
		})
		.map((item) => ({
			id: item.id,
			period: item.period,
			country: item.country,
			currency: item.currency,
			ownerType: item.ownerType,
			ownerId: item.ownerId,
			frequency: item.frequency,
			totals: formatTotals(item),
		}));

	return NextResponse.json({ data });
}
