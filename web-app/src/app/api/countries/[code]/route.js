import { NextResponse } from "next/server";

import { getCountry, removeCountry, upsertCountry } from "@/data/country-store";

export async function PUT(request, { params }) {
	try {
		console.debug("[COUNTRIES] PUT", { code: params.code });
		const body = await request.json();
		const country = await upsertCountry({ ...body, code: params.code });
		console.info("[COUNTRIES] updated", { code: country.code });
		return NextResponse.json(country);
	} catch (error) {
		console.error("[COUNTRIES] PUT error", error);
		return NextResponse.json({ message: error.message || "No se pudo actualizar el país" }, { status: 400 });
	}
}

export async function DELETE(request, { params }) {
	console.debug("[COUNTRIES] DELETE", { code: params.code });
	const existing = await getCountry(params.code);
	if (!existing) {
		console.warn("[COUNTRIES] DELETE missing", { code: params.code });
		return NextResponse.json({ message: "País no encontrado" }, { status: 404 });
	}
	await removeCountry(params.code);
	console.info("[COUNTRIES] deleted", { code: params.code });
	return NextResponse.json(null, { status: 204 });
}
