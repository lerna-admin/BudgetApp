import { NextResponse } from "next/server";

import {
	createHousehold,
	listHouseholds,
} from "@/data/household-store";
import { getCurrentUser } from "@/lib/auth";

function filterHouseholdsForUser(households, user) {
	if (!user) {
		return [];
	}
	if (user.role === "admin" || user.role === "cs_agent") {
		return households;
	}
	return households.filter((household) => household.members.some((member) => member.userId === user.id));
}

function requireAgent(user) {
	if (user.role === "admin" || user.role === "cs_agent") {
		return;
	}
	throw new Error("No tienes permisos para ejecutar esta acción.");
}

export async function GET() {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		const households = await listHouseholds();
		return NextResponse.json(filterHouseholdsForUser(households, user));
	} catch (error) {
		console.error("[HOUSEHOLDS] GET error", error);
		return NextResponse.json({ message: error.message || "No se pudieron listar los hogares." }, { status: 400 });
	}
}

export async function POST(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		requireAgent(user);
		const payload = await request.json();
		const household = await createHousehold(payload);
		return NextResponse.json(household, { status: 201 });
	} catch (error) {
		console.error("[HOUSEHOLDS] POST error", error);
		const status = error.message?.includes("permiso") ? 403 : 400;
		return NextResponse.json({ message: error.message || "No se pudo crear el hogar." }, { status });
	}
}
