import { NextResponse } from "next/server";

import { hasPool } from "../../../../lib/server/db";
import { signToken, TOKEN_TTL_SECONDS, verifyPassword } from "../../../../lib/server/auth-server";
import { findUserByEmail } from "../../../../lib/server/users-repository";

export const runtime = "nodejs";

const COOKIE_NAME = "budgetapp_session";

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    countryCode: user.countryCode,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function POST(request) {
  if (!hasPool()) {
    return NextResponse.json(
      { message: "DATABASE_URL no configurada en app/.env" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { message: "email and password are required" },
      { status: 400 },
    );
  }

  try {
    const userRow = await findUserByEmail(email);
    if (!userRow || !verifyPassword(password, userRow.passwordHash)) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const user = sanitizeUser(userRow);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ data: user });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    if (error?.code === "42P01") {
      return NextResponse.json(
        { message: "Tablas no creadas. Ejecuta migraciones antes de usar login." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: error?.message || "No fue posible iniciar sesion" },
      { status: 500 },
    );
  }
}
