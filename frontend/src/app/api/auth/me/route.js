import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasPool } from "../../../../lib/server/db";
import { verifyToken } from "../../../../lib/server/auth-server";
import { findUserById } from "../../../../lib/server/users-repository";

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

export async function GET() {
  if (!hasPool()) {
    return NextResponse.json(
      { message: "DATABASE_URL no configurada en frontend/.env" },
      { status: 500 },
    );
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return NextResponse.json({ message: "Sesion invalida" }, { status: 401 });
  }

  try {
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: sanitizeUser(user) });
  } catch (error) {
    if (error?.code === "42P01") {
      return NextResponse.json(
        { message: "Tablas no creadas. Ejecuta migraciones antes de consultar perfil." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: error?.message || "No fue posible obtener perfil" },
      { status: 500 },
    );
  }
}
