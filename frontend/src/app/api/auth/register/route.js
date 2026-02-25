import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const COOKIE_NAME = "budgetapp_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const upstream = await fetch(`${BACKEND_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { message: payload.message || "No fue posible registrar usuario" },
      { status: upstream.status },
    );
  }

  const token = payload?.data?.token;
  const user = payload?.data?.user;

  if (!token || !user) {
    return NextResponse.json({ message: "Respuesta invalida del backend" }, { status: 502 });
  }

  const response = NextResponse.json({ data: user }, { status: 201 });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  return response;
}
