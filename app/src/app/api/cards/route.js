import { NextResponse } from "next/server";

import { createCard, listCards } from "../../../lib/server/cards-repository";
import { getSessionUser } from "../../../lib/server/session-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await listCards({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/cards failed", error);
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
    const cardName = (body?.cardName || "").trim();
    if (!cardName) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const card = await createCard({
      userId: user.id,
      cardName,
      cardType: body.cardType || "debit",
      currency: body.currency || "COP",
      bankId: body.bankId || null,
      creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
      availableCredit: body.availableCredit ? Number(body.availableCredit) : null,
      expiration: body.expiration || null,
      bankName: body.bankName || "",
      last4: body.last4 || "",
    });
    return NextResponse.json({ data: card }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cards failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para crear tarjeta" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
