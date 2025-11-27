import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";
import { createSession, verifyUserCredentials } from "@/data/user-store";

export async function POST(request) {
	try {
		const body = await request.json();
		console.debug("[AUTH] login request", { body });
		const { email, password } = body;
		if (!email || !password) {
			return NextResponse.json({ message: "Correo y contraseña son obligatorios." }, { status: 400 });
		}
		const user = await verifyUserCredentials(email, password);
		if (!user) {
			console.warn("[AUTH] login failed credentials", { email });
			return NextResponse.json({ message: "Credenciales inválidas." }, { status: 401 });
		}
		const session = await createSession(user.id);
		const response = NextResponse.json({ user });
		console.info("[AUTH] login success", { email, userId: user.id });
		response.cookies.set(SESSION_COOKIE, session.token, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		});
		return response;
	} catch (error) {
		console.error("[AUTH] login error", error);
		return NextResponse.json({ message: error.message || "Error al iniciar sesión." }, { status: 400 });
	}
}
