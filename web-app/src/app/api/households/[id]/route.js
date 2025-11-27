import { NextResponse } from "next/server";

import { deleteHousehold, getHouseholdById, updateHousehold } from "@/data/household-store";
import { getCurrentUser } from "@/lib/auth";

function ensureAgent(user) {
	if (user.role === "admin" || user.role === "cs_agent") {
		return;
	}
	throw new Error("No tienes permisos para modificar hogares.");
}

export async function PUT(request, { params }) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		ensureAgent(user);
		const payload = await request.json();
		const household = await updateHousehold(params.id, payload);
		return NextResponse.json(household);
	} catch (error) {
		console.error("[HOUSEHOLDS] PUT error", error);
		const status = error.message?.includes("permisos") ? 403 : 400;
		return NextResponse.json({ message: error.message || "No se pudo actualizar el hogar." }, { status });
	}
}

export async function DELETE(request, { params }) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		ensureAgent(user);
		const existing = await getHouseholdById(params.id);
		if (!existing) {
			return NextResponse.json({ message: "No encontrado." }, { status: 404 });
		}
		await deleteHousehold(params.id);
		return NextResponse.json(null, { status: 204 });
	} catch (error) {
		console.error("[HOUSEHOLDS] DELETE error", error);
		const status = error.message?.includes("permisos") ? 403 : 400;
		return NextResponse.json({ message: error.message || "No se pudo eliminar el hogar." }, { status });
	}
}
