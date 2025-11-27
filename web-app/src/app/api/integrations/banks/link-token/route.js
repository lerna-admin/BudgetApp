import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request) {
	try {
		const payload = await request.json();
		if (!payload?.institutionId) {
			return NextResponse.json({ message: "institutionId es obligatorio" }, { status: 400 });
		}
		if (!payload?.country) {
			return NextResponse.json({ message: "country es obligatorio" }, { status: 400 });
		}
		const linkToken = crypto.randomBytes(24).toString("hex");
		const expiresIn = 15 * 60; // 15 minutos
		console.info("[BANK LINK TOKEN] generated", { institutionId: payload.institutionId, country: payload.country });
		return NextResponse.json({ linkToken, expiresIn });
	} catch (error) {
		console.error("[BANK LINK TOKEN] error", error);
		return NextResponse.json({ message: error.message || "No se pudo generar el link token" }, { status: 400 });
	}
}
