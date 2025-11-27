import { NextResponse } from "next/server";

import { listCountries, upsertCountry } from "@/data/country-store";

export async function GET() {
	console.debug("[COUNTRIES] GET");
	const items = await listCountries();
	return NextResponse.json(items);
}

export async function POST(request) {
	try {
		const body = await request.json();
		console.debug("[COUNTRIES] POST", { body });
		const country = await upsertCountry(body);
		console.info("[COUNTRIES] created", { code: country.code });
		return NextResponse.json(country, { status: 201 });
	} catch (error) {
		console.error("[COUNTRIES] POST error", error);
		return NextResponse.json(
			{
				message: error.message || "No se pudo registrar el país",
			},
			{ status: 400 },
		);
	}
}
