import { NextResponse } from "next/server";

import { createAccount, listAccounts } from "../../../lib/server/accounts-repository";
import { getSessionUser } from "../../../lib/server/session-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await listAccounts({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/accounts failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const accountName = (body?.accountName || "").trim();
    if (!accountName) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const account = await createAccount({
      userId: user.id,
      accountName,
      accountType: body.accountType || "checking",
      currency: body.currency || "COP",
      bankId: body.bankId || null,
      balance: Number(body.balance) || 0,
    });
    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    console.error("POST /api/accounts failed", error);
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
