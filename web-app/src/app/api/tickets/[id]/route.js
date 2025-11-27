import { NextResponse } from "next/server";

import { updateTicket } from "@/data/ticket-store";
import { getCurrentUser } from "@/lib/auth";

function canManageTickets(user) {
	return user.role === "cs_agent";
}

export async function PUT(request, { params }) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		const payload = await request.json();
		if (!canManageTickets(user)) {
			if (!payload.comment) {
				return NextResponse.json({ message: "Solo puedes agregar comentarios en tus propios tickets." }, { status: 403 });
			}
			const ticket = await updateTicket(params.id, { comment: payload.comment }, user);
			return NextResponse.json(ticket);
		}
		const ticket = await updateTicket(params.id, payload, user);
		return NextResponse.json(ticket);
	} catch (error) {
		console.error("[TICKETS] PUT error", error);
		return NextResponse.json({ message: error.message || "No se pudo actualizar el ticket." }, { status: 400 });
	}
}
