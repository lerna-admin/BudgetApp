import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const COOKIE_NAME = "budgetapp_session";

export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const upstream = await fetch(`${BACKEND_BASE}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { message: payload.message || "No fue posible obtener perfil" },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ data: payload.data });
}
