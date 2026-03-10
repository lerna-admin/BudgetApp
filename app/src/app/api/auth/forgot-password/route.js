import { NextResponse } from "next/server";

import { hasPool } from "../../../../lib/server/db";
import { sendPasswordResetEmail, isMailerConfigured } from "../../../../lib/server/mailer";
import { createPasswordResetToken } from "../../../../lib/server/password-reset-repository";
import { findUserByEmail } from "../../../../lib/server/users-repository";

export const runtime = "nodejs";

function getRequestOrigin(request) {
  const envUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const headers = request.headers;
  const proto = headers.get("x-forwarded-proto") || "http";
  const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
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
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  try {
    const mailConfigured = isMailerConfigured();
    const devMode = process.env.NODE_ENV !== "production";
    let debugResetUrl = null;

    const user = await findUserByEmail(email);
    if (user) {
      const { rawToken } = await createPasswordResetToken(user.id);
      const baseUrl = getRequestOrigin(request);
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
      if (mailConfigured) {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
      } else if (devMode) {
        debugResetUrl = resetUrl;
      }
    }

    return NextResponse.json({
      data: {
        message: "Si el correo existe, enviamos un enlace para recuperar acceso.",
        debugResetUrl,
      },
    });
  } catch (error) {
    if (error?.code === "42P01") {
      return NextResponse.json(
        { message: "Tablas no creadas. Ejecuta migraciones antes de usar recuperacion." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: error?.message || "No fue posible procesar la recuperacion" }, { status: 500 });
  }
}
