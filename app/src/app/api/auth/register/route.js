import { NextResponse } from "next/server";

import { hasPool } from "../../../../lib/server/db";
import { hashPassword, signToken, TOKEN_TTL_SECONDS } from "../../../../lib/server/auth-server";
import { createUser, findUserByEmail } from "../../../../lib/server/users-repository";

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
  const name = body?.name?.trim();
  const email = body?.email?.trim();
  const password = body?.password;
  const countryCode = body?.countryCode || null;

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "name, email and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "password must be at least 8 characters" },
      { status: 400 },
    );
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const createdUser = await createUser({
      name,
      email,
      passwordHash: hashPassword(password),
      countryCode,
    });

    const user = sanitizeUser(createdUser);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ data: user }, { status: 201 });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    if (error?.code === "23505") {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 });
    }
    if (error?.code === "42P01") {
      return NextResponse.json(
        { message: "Tablas no creadas. Ejecuta migraciones antes de usar registro." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: error?.message || "No fue posible registrar usuario" },
      { status: 500 },
    );
  }
}
