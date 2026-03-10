import { NextResponse } from "next/server";

import { deleteAccount, findAccount, updateAccount } from "../../../../lib/server/accounts-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const found = await findAccount(params.id, { userId: user.id });
    if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: found });
  } catch (error) {
    console.error("GET /api/accounts/:id failed", error);
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
    const data = await updateAccount(
      params.id,
      {
        accountName: patch?.accountName,
        accountType: patch?.accountType,
        currency: patch?.currency,
        balance: patch?.balance,
        bankId: patch?.bankId,
        bankName: patch?.bankName,
        accountNumber: patch?.accountNumber,
      },
      { userId: user.id },
    );
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("PUT /api/accounts/:id failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para actualizar cuenta" }, { status: 400 });
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

    const removed = await deleteAccount(params.id, { userId: user.id });
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/accounts/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
