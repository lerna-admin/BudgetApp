import { NextResponse } from "next/server";

import { createTicket, listTickets } from "@/data/ticket-store";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	if (user.role === "admin") {
		return NextResponse.json({ message: "Los administradores no gestionan tickets." }, { status: 403 });
	}
	try {
		const url = new URL(request.url);
		const status = url.searchParams.get("status");
		const filters = { status: status ?? undefined };
		if (user.role === "client") {
			filters.createdBy = user.id;
		} else if (user.role === "cs_agent") {
			filters.assignedTo = user.id;
		}
		const tickets = await listTickets(filters);
		return NextResponse.json(tickets);
	} catch (error) {
		console.error("[TICKETS] GET error", error);
		return NextResponse.json({ message: error.message || "No se pudieron listar los tickets." }, { status: 400 });
	}
}

export async function POST(request) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	try {
		const payload = await request.json();
		const ticket = await createTicket(payload, user);
		return NextResponse.json(ticket, { status: 201 });
	} catch (error) {
		console.error("[TICKETS] POST error", error);
		return NextResponse.json({ message: error.message || "No se pudo crear el ticket." }, { status: 400 });
	}
}
