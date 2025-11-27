import { NextResponse } from "next/server";

import { createAlert } from "@/data/alert-store";

export async function POST(request) {
	try {
		const payload = await request.json();
		const alert = await createAlert(payload);
		return NextResponse.json(alert, { status: 201 });
	} catch (error) {
		console.error("[ALERTS] POST error", error);
		return NextResponse.json({ message: error.message || "No se pudo crear la alerta" }, { status: 400 });
	}
}
