import { NextResponse } from "next/server";
import { deleteExpense, findExpense, updateExpense } from "../../../../lib/server/expenses-repository";

export async function GET(_request, { params }) {
  try {
    const item = await findExpense(params.id);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error("GET /api/expenses/:id failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const patch = await request.json();
    const updated = await updateExpense(params.id, patch);
    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/expenses/:id failed", error);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const removed = await deleteExpense(params.id);
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/expenses/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
