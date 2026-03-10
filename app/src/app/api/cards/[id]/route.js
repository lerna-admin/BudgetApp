import { NextResponse } from "next/server";

import { deleteCard, findCard, updateCard } from "../../../../lib/server/cards-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const found = await findCard(params.id, { userId: user.id });
    if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: found });
  } catch (error) {
    console.error("GET /api/cards/:id failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const patch = await request.json();
    const data = await updateCard(
      params.id,
      {
        cardName: patch?.cardName,
        cardType: patch?.cardType,
        currency: patch?.currency,
        creditLimit: patch?.creditLimit,
        availableCredit: patch?.availableCredit,
        expiration: patch?.expiration,
        bankId: patch?.bankId,
        bankName: patch?.bankName,
        last4: patch?.last4,
      },
      { userId: user.id },
    );

    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("PUT /api/cards/:id failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para actualizar tarjeta" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const removed = await deleteCard(params.id, { userId: user.id });
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/cards/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
