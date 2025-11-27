import { NextResponse } from "next/server";

import { getBudget, upsertBudget } from "@/data/budget-store";
import { getCurrentUser } from "@/lib/auth";
import { findUserByEmail, findUserById, markStartHereConfigured } from "@/data/user-store";

export async function GET(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	const url = new URL(request.url);
	const period = url.searchParams.get("period");
	const country = url.searchParams.get("country") ?? "CO";
	const householdIdParam = url.searchParams.get("householdId");
	const scope = url.searchParams.get("scope") ?? "personal";
	const frequency = url.searchParams.get("frequency") ?? "monthly";
	const requestedUserId = url.searchParams.get("userId");
	const requestedUserEmail = url.searchParams.get("userEmail");
	try {
		if (!period) {
			return NextResponse.json({ message: "El periodo (YYYY-MM) es obligatorio" }, { status: 400 });
		}
		let ownerType = scope === "household" ? "household" : "personal";
		let ownerId = null;

		if (ownerType === "household") {
			const householdId = householdIdParam ?? user.householdMemberships?.[0]?.householdId ?? null;
			if (!householdId) {
				return NextResponse.json({ message: "Debes indicar un hogar válido." }, { status: 400 });
			}
			const isAgent = user.role === "admin" || user.role === "cs_agent";
			const isMember = user.householdMemberships?.some((membership) => membership.householdId === householdId);
			if (!isAgent && !isMember) {
				return NextResponse.json({ message: "No perteneces a este hogar." }, { status: 403 });
			}
			ownerId = householdId;
		} else {
			const isAgent = user.role === "admin" || user.role === "cs_agent";
			if (isAgent && (requestedUserId || requestedUserEmail)) {
				let targetUser = null;
				if (requestedUserId) {
					targetUser = await findUserById(requestedUserId);
				}
				if (!targetUser && requestedUserEmail) {
					targetUser = await findUserByEmail(requestedUserEmail);
				}
				if (!targetUser) {
					return NextResponse.json({ message: "Usuario objetivo no encontrado." }, { status: 404 });
				}
				ownerId = targetUser.id;
			} else {
				ownerId = user.id;
			}
		}

		const budget = await getBudget(
			{
				period,
				countryCode: country,
				ownerType,
				ownerId,
				frequency,
			},
			{ autoCreate: false },
		);
		return NextResponse.json(budget);
	} catch (error) {
		console.error("[BUDGETS] GET error", error);
		return NextResponse.json({ message: error.message || "No se pudo obtener el presupuesto" }, { status: 400 });
	}
}

export async function POST(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		const payload = await request.json();
		const frequency = payload.frequency ?? "monthly";
		const scope = payload.scope ?? "personal";
		const requestedHouseholdId = payload.householdId;
		const requestedUserId = payload.userId;
		const requestedUserEmail = payload.userEmail;
		let ownerType = scope === "household" ? "household" : "personal";
		let ownerId = null;

		if (ownerType === "household") {
			const isAgent = user.role === "admin" || user.role === "cs_agent";
			ownerId = isAgent && requestedHouseholdId ? requestedHouseholdId : user.householdMemberships?.[0]?.householdId ?? null;
			if (!ownerId) {
				return NextResponse.json({ message: "Debes indicar un hogar válido." }, { status: 400 });
			}
			const isMember = user.householdMemberships?.some((membership) => membership.householdId === ownerId);
			if (!isAgent && !isMember) {
				return NextResponse.json({ message: "No perteneces a este hogar." }, { status: 403 });
			}
		} else {
			const isAgent = user.role === "admin" || user.role === "cs_agent";
			if (isAgent && (requestedUserId || requestedUserEmail)) {
				let target = null;
				if (requestedUserId) {
					target = await findUserById(requestedUserId);
				}
				if (!target && requestedUserEmail) {
					target = await findUserByEmail(requestedUserEmail);
				}
				if (!target) {
					return NextResponse.json({ message: "Usuario objetivo no encontrado." }, { status: 404 });
				}
				ownerId = target.id;
			} else {
				ownerId = user.id;
			}
		}

		const budget = await upsertBudget(payload, {
			ownerType,
			ownerId,
			frequency,
		});
		if (ownerType === "personal" && ownerId) {
			await markStartHereConfigured(ownerId);
		}
		return NextResponse.json(budget, { status: 201 });
	} catch (error) {
		console.error("[BUDGETS] POST error", error);
		return NextResponse.json({ message: error.message || "No se pudo guardar el presupuesto" }, { status: 400 });
	}
}
