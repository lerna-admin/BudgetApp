import { NextResponse } from "next/server";

import { deleteRecurringBill, findRecurringBill, updateRecurringBill } from "../../../../lib/server/recurring-bills-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await findRecurringBill(params.id, { userId: user.id });
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/recurring-bills/:id failed", error);
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
    const data = await updateRecurringBill(
      params.id,
      {
        billName: patch?.billName,
        category: patch?.category,
        amount: patch?.amount,
        currency: patch?.currency,
        frequency: patch?.frequency,
        dueDay: patch?.dueDay,
        notes: patch?.notes,
        isActive: patch?.isActive,
      },
      { userId: user.id },
    );

    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("PUT /api/recurring-bills/:id failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para bill recurrente" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await deleteRecurringBill(params.id, { userId: user.id });
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("DELETE /api/recurring-bills/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
