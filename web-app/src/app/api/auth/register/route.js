import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";
import { createSession, createUser, findUserByEmail } from "@/data/user-store";

export async function POST(request) {
	try {
		const { name, email, password } = await request.json();
		console.debug("[AUTH] register request", { email, name });
		if (!name || !email || !password) {
			return NextResponse.json({ message: "Completa todos los campos." }, { status: 400 });
		}
		const existing = await findUserByEmail(email);
		if (existing) {
			return NextResponse.json({ message: "Ya existe un usuario con ese correo." }, { status: 409 });
		}
		const user = await createUser({ name, email, password });
		const session = await createSession(user.id);
		const response = NextResponse.json({ user });
		console.info("[AUTH] register success", { email, userId: user.id });
		response.cookies.set(SESSION_COOKIE, session.token, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		});
		return response;
	} catch (error) {
		console.error("[AUTH] register error", error);
		return NextResponse.json({ message: error.message || "Error al registrar usuario." }, { status: 400 });
	}
}
