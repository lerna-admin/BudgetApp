import { NextResponse } from "next/server";
import { deleteExpense, findExpense, updateExpense } from "../../../../lib/server/expenses-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

function toNullableId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
}

export async function GET(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const item = await findExpense(params.id, { userId: user.id });
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error("GET /api/expenses/:id failed", error);
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
    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
    }

    const normalizedPatch = { ...patch };
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, "sourceAccountId")) {
      normalizedPatch.sourceAccountId = toNullableId(normalizedPatch.sourceAccountId);
    }
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, "destinationAccountId")) {
      normalizedPatch.destinationAccountId = toNullableId(normalizedPatch.destinationAccountId);
    }
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, "debtId")) {
      normalizedPatch.debtId = toNullableId(normalizedPatch.debtId);
    }
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, "savingsGoalId")) {
      normalizedPatch.savingsGoalId = toNullableId(normalizedPatch.savingsGoalId);
    }

    const updated = await updateExpense(params.id, normalizedPatch, { userId: user.id });
    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/expenses/:id failed", error);
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
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const removed = await deleteExpense(params.id, { userId: user.id });
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/expenses/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
