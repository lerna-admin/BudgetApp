import { NextResponse } from "next/server";

import { addHouseholdMember, removeHouseholdMember } from "@/data/household-store";
import { getCurrentUser } from "@/lib/auth";

function ensureAgent(user) {
	if (user.role === "admin" || user.role === "cs_agent") {
		return;
	}
	throw new Error("No tienes permisos para modificar miembros.");
}

export async function POST(request, { params }) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		ensureAgent(user);
		const payload = await request.json();
		const household = await addHouseholdMember(params.id, payload);
		return NextResponse.json(household);
	} catch (error) {
		console.error("[HOUSEHOLD MEMBERS] POST error", error);
		const status = error.message?.includes("permisos") ? 403 : 400;
		return NextResponse.json({ message: error.message || "No se pudo actualizar el hogar." }, { status });
	}
}

export async function PUT(request, { params }) {
	return POST(request, { params });
}

export async function DELETE(request, { params }) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		ensureAgent(user);
		const payload = await request.json();
		if (!payload?.userId) {
			return NextResponse.json({ message: "userId es obligatorio." }, { status: 400 });
		}
		const household = await removeHouseholdMember(params.id, payload.userId);
		return NextResponse.json(household);
	} catch (error) {
		console.error("[HOUSEHOLD MEMBERS] DELETE error", error);
		const status = error.message?.includes("permisos") ? 403 : 400;
		return NextResponse.json({ message: error.message || "No se pudo actualizar el hogar." }, { status });
	}
}
