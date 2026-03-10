import { NextResponse } from "next/server";

import { getSessionUser } from "../../../lib/server/session-user";
import { createRecurringBill, listRecurringBills } from "../../../lib/server/recurring-bills-repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await listRecurringBills({ userId: user.id, includeInactive: false });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/recurring-bills failed", error);
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
    const billName = String(body?.billName || "").trim();
    const amount = Number(body?.amount);
    if (!billName) {
      return NextResponse.json({ error: "Nombre de bill requerido" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Monto invalido" }, { status: 400 });
    }

    const data = await createRecurringBill({
      userId: user.id,
      billName,
      category: body?.category || "general",
      amount,
      currency: body?.currency || "COP",
      frequency: body?.frequency || "monthly",
      dueDay: body?.dueDay ?? null,
      notes: body?.notes || "",
      isActive: body?.isActive ?? true,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recurring-bills failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para bill recurrente" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
