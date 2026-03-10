import { NextResponse } from "next/server";
import { createExpense, listExpenses } from "../../../lib/server/expenses-repository";
import { getSessionUser } from "../../../lib/server/session-user";

function toNullableId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await listExpenses({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/expenses failed", error);
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
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Monto invalido" }, { status: 400 });
    }

    const movementType = body.movementType || "expense";
    const sourceAccountId = toNullableId(body.sourceAccountId);
    const destinationAccountId = toNullableId(body.destinationAccountId);
    const debtId = toNullableId(body.debtId);
    const savingsGoalId = toNullableId(body.savingsGoalId);

    if (movementType === "transfer") {
      if (!sourceAccountId || !destinationAccountId) {
        return NextResponse.json({ error: "Transferencia requiere cuenta origen y destino" }, { status: 400 });
      }
      if (sourceAccountId === destinationAccountId) {
        return NextResponse.json({ error: "Origen y destino deben ser distintos" }, { status: 400 });
      }
    }

    if (movementType !== "income" && movementType !== "transfer" && body.method === "bank_transfer" && !sourceAccountId) {
      return NextResponse.json({ error: "Debes seleccionar cuenta origen para movimiento bancario" }, { status: 400 });
    }

    if (debtId && movementType !== "expense") {
      return NextResponse.json({ error: "Solo los gastos pueden vincular deuda" }, { status: 400 });
    }

    if (savingsGoalId && movementType !== "saving" && movementType !== "investment") {
      return NextResponse.json({ error: "Solo ahorro/inversion puede vincular metas" }, { status: 400 });
    }

    const movement = await createExpense({
      userId: user.id,
      movementType,
      date: body.date || new Date().toISOString().slice(0, 10),
      detail: (body.detail || "").slice(0, 180),
      notes: (body.notes || "").slice(0, 300),
      amount,
      category: body.category || "",
      subcategory: body.subcategory || "",
      edge: body.edge || "",
      method: body.method || "cash",
      bank: body.bank || "",
      card: body.card || "",
      currency: body.currency || "COP",
      tags: Array.isArray(body.tags) ? body.tags : [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      transferFrom: body.transferFrom || "",
      transferTo: body.transferTo || "",
      sourceAccountId,
      destinationAccountId,
      debtId,
      savingsGoalId,
      destinationNote: body.destinationNote || "",
    });

    return NextResponse.json({ data: movement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses failed", error);
    if (typeof error?.message === "string") {
      const known = new Set([
        "movement_type_invalid",
        "movement_method_invalid",
        "movement_amount_invalid",
        "transfer_accounts_required",
        "transfer_accounts_equal",
        "source_account_required",
        "source_account_not_found",
        "movement_debt_not_found",
        "movement_goal_not_found",
      ]);
      if (known.has(error.message) || error.message.endsWith("_invalid")) {
        return NextResponse.json({ error: "Datos invalidos para el movimiento" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
