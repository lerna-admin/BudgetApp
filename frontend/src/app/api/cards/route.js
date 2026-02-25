import { NextResponse } from "next/server";
import { createCard, listCards } from "../../../lib/server/cards-repository";

export async function GET() {
  try {
    const data = await listCards();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/cards failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const cardName = (body?.cardName || "").trim();
    if (!cardName) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const card = await createCard({
      cardName,
      cardType: body.cardType || "debit",
      currency: body.currency || "COP",
      bankId: body.bankId || null,
      creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
      availableCredit: body.availableCredit ? Number(body.availableCredit) : null,
      expiration: body.expiration || null,
    });
    return NextResponse.json({ data: card }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cards failed", error);
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
