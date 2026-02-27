import { NextResponse } from "next/server";

import { deleteDebt, findDebt, updateDebt } from "../../../../lib/server/debts-repository";

function toNullableId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
}

export async function GET(_request, { params }) {
  try {
    const data = await findDebt(params.id);
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/debts/:id failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const patch = await request.json();
    const data = await updateDebt(params.id, {
      debtName: patch?.debtName,
      debtType: patch?.debtType,
      principal: patch?.principal,
      interestRateEa: patch?.interestRateEa,
      minimumPayment: patch?.minimumPayment,
      currency: patch?.currency,
      status: patch?.status,
      dueDate: patch?.dueDate,
      notes: patch?.notes,
      bankId: toNullableId(patch?.bankId),
      accountId: toNullableId(patch?.accountId),
      cardId: toNullableId(patch?.cardId),
    });
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("PUT /api/debts/:id failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para actualizar deuda" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const data = await deleteDebt(params.id);
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("DELETE /api/debts/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
