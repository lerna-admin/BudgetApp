import { NextResponse } from "next/server";

import { createOnboardingRecord } from "@/data/onboarding-service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request) {
	try {
		const payload = await request.json();
		const user = await getCurrentUser();
		const result = await createOnboardingRecord(payload, user);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		console.error("[ONBOARDING] POST error", error);
		return NextResponse.json({ message: error.message || "No se pudo procesar el onboarding" }, { status: 400 });
	}
}
