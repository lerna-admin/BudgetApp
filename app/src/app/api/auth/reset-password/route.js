import { NextResponse } from "next/server";

import { hashPassword } from "../../../../lib/server/auth-server";
import { hasPool } from "../../../../lib/server/db";
import { consumePasswordResetToken, invalidateUserResetTokens } from "../../../../lib/server/password-reset-repository";
import { updateUserPassword } from "../../../../lib/server/users-repository";

export const runtime = "nodejs";

export async function POST(request) {
  if (!hasPool()) {
    return NextResponse.json(
      { message: "DATABASE_URL no configurada en app/.env" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const token = body?.token?.trim();
  const password = body?.password;

  if (!token || !password) {
    return NextResponse.json(
      { message: "token and password are required" },
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
    const consumed = await consumePasswordResetToken(token);
    if (!consumed?.userId) {
      return NextResponse.json(
        { message: "Enlace invalido o vencido" },
        { status: 400 },
      );
    }

    const updated = await updateUserPassword(consumed.userId, hashPassword(password));
    if (!updated?.id) {
      return NextResponse.json(
        { message: "No fue posible actualizar la contrasena" },
        { status: 500 },
      );
    }

    await invalidateUserResetTokens(consumed.userId);

    return NextResponse.json({
      data: {
        message: "Contrasena actualizada. Ya puedes iniciar sesion.",
      },
    });
  } catch (error) {
    if (error?.code === "42P01") {
      return NextResponse.json(
        { message: "Tablas no creadas. Ejecuta migraciones antes de usar recuperacion." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: error?.message || "No fue posible restablecer la contrasena" },
      { status: 500 },
    );
  }
}
