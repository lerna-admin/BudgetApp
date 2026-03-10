import { NextResponse } from "next/server";

import { getSessionUser } from "../../../lib/server/session-user";
import { createSavingsGoal, listSavingsGoals } from "../../../lib/server/savings-goals-repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await listSavingsGoals({ userId: user.id, includeCompleted: false });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/savings-goals failed", error);
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
    const goalName = String(body?.goalName || "").trim();
    const targetAmount = Number(body?.targetAmount);
    if (!goalName) {
      return NextResponse.json({ error: "Nombre de meta requerido" }, { status: 400 });
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return NextResponse.json({ error: "Valor objetivo invalido" }, { status: 400 });
    }

    const data = await createSavingsGoal({
      userId: user.id,
      goalName,
      targetAmount,
      currentAmount: body?.currentAmount ?? 0,
      monthlyTarget: body?.monthlyTarget ?? null,
      currency: body?.currency || "COP",
      targetDate: body?.targetDate || null,
      notes: body?.notes || "",
      status: body?.status || "active",
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/savings-goals failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para meta de ahorro" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
