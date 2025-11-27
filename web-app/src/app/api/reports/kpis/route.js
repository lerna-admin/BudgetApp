import { NextResponse } from "next/server";

import { getKpiSummary } from "@/data/report-service";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ message: "No autenticado." }, { status: 401 });
	}
	if (user.role !== "admin") {
		return NextResponse.json({ message: "Sin permisos para ver estos indicadores." }, { status: 403 });
	}
	try {
		const data = await getKpiSummary();
		return NextResponse.json(data);
	} catch (error) {
		console.error("[REPORTS] KPIs error", error);
		return NextResponse.json({ message: error.message || "No se pudieron calcular los KPIs." }, { status: 400 });
	}
}
