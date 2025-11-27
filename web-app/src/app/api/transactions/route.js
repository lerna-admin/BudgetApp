import { NextResponse } from "next/server";

import { createTransaction, listTransactions } from "@/data/transaction-store";
import { getCurrentUser } from "@/lib/auth";
import { findUserByEmail, findUserById } from "@/data/user-store";

export async function GET(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	const url = new URL(request.url);
	const source = url.searchParams.get("source");
	const status = url.searchParams.get("status");
	const limit = url.searchParams.get("limit");
	const scope = url.searchParams.get("scope") ?? "personal";
	const householdIdParam = url.searchParams.get("householdId");
	const requestedUserId = url.searchParams.get("userId");
	const requestedUserEmail = url.searchParams.get("userEmail");
	const isAgent = user.role === "admin" || user.role === "cs_agent";

	try {
		let ownerType = scope === "household" ? "household" : "personal";
		let ownerId = null;

		if (ownerType === "household") {
			if (isAgent && householdIdParam) {
				ownerId = householdIdParam;
			} else {
				ownerId = user.householdMemberships?.[0]?.householdId ?? null;
			}
			if (!ownerId) {
				return NextResponse.json({ message: "Debes indicar un hogar válido." }, { status: 400 });
			}
			const isMember = user.householdMemberships?.some((membership) => membership.householdId === ownerId);
			if (!isAgent && !isMember) {
				return NextResponse.json({ message: "No perteneces a este hogar." }, { status: 403 });
			}
		} else {
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

		const response = await listTransactions(
			{ source, status, limit, ownerType, ownerId },
			{ includeSeed: isAgent },
		);
		return NextResponse.json(response);
	} catch (error) {
		console.error("[TRANSACTIONS] GET error", error);
		return NextResponse.json({ message: error.message || "No se pudieron obtener las transacciones" }, { status: 400 });
	}
}

export async function POST(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		const payload = await request.json();
		const scope = payload.scope ?? "personal";
		const isAgent = user.role === "admin" || user.role === "cs_agent";
		const requestedUserId = payload.userId;
		const requestedHouseholdId = payload.householdId;
		let ownerType = scope === "household" ? "household" : "personal";
		let ownerId = null;

		if (ownerType === "household") {
			if (isAgent && requestedHouseholdId) {
				ownerId = requestedHouseholdId;
			} else {
				ownerId = user.householdMemberships?.[0]?.householdId ?? null;
			}
			if (!ownerId) {
				return NextResponse.json({ message: "Debes indicar un hogar válido." }, { status: 400 });
			}
			const isMember = user.householdMemberships?.some((membership) => membership.householdId === ownerId);
			if (!isAgent && !isMember) {
				return NextResponse.json({ message: "No perteneces a este hogar." }, { status: 403 });
			}
		} else {
			if (isAgent && requestedUserId) {
				const target = await findUserById(requestedUserId);
				if (!target) {
					return NextResponse.json({ message: "Usuario objetivo no encontrado." }, { status: 404 });
				}
				ownerId = target.id;
			} else {
				ownerId = user.id;
			}
		}

		const transaction = await createTransaction({
			...payload,
			ownerType,
			ownerId,
			householdId: ownerType === "household" ? ownerId : null,
		});
		return NextResponse.json(transaction, { status: 201 });
	} catch (error) {
		console.error("[TRANSACTIONS] POST error", error);
		return NextResponse.json({ message: error.message || "No se pudo crear la transacción" }, { status: 400 });
	}
}
