import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";
import { deleteSession } from "@/data/user-store";

export async function POST(request) {
	const token = request.cookies.get(SESSION_COOKIE)?.value;
	console.debug("[AUTH] logout request", { token });
	if (token) {
		await deleteSession(token);
	}
	const response = NextResponse.json({ ok: true });
	response.cookies.set(SESSION_COOKIE, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: new Date(0),
		path: "/",
	});
	return response;
}
