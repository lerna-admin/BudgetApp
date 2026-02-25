import { NextResponse } from "next/server";
import { deleteCard, listCards } from "../../../../lib/server/cards-repository";

export async function GET(_req, { params }) {
  const all = await listCards();
  const found = all.find((c) => c.id === params.id);
  if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ data: found });
}

export async function DELETE(_req, { params }) {
  try {
    const removed = await deleteCard(params.id);
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/cards/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
