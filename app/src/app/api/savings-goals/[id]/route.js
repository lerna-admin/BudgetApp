import { NextResponse } from "next/server";

import { deleteSavingsGoal, findSavingsGoal, updateSavingsGoal } from "../../../../lib/server/savings-goals-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await findSavingsGoal(params.id, { userId: user.id });
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/savings-goals/:id failed", error);
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
    const data = await updateSavingsGoal(
      params.id,
      {
        goalName: patch?.goalName,
        targetAmount: patch?.targetAmount,
        currentAmount: patch?.currentAmount,
        monthlyTarget: patch?.monthlyTarget,
        currency: patch?.currency,
        targetDate: patch?.targetDate,
        notes: patch?.notes,
        status: patch?.status,
      },
      { userId: user.id },
    );
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("PUT /api/savings-goals/:id failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para meta de ahorro" }, { status: 400 });
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

    const data = await deleteSavingsGoal(params.id, { userId: user.id });
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("DELETE /api/savings-goals/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
