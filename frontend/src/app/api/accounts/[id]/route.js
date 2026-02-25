import { NextResponse } from "next/server";
import { deleteAccount, listAccounts } from "../../../../lib/server/accounts-repository";

export async function GET(_req, { params }) {
  const all = await listAccounts();
  const found = all.find((a) => a.id === params.id);
  if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ data: found });
}

export async function DELETE(_req, { params }) {
  try {
    const removed = await deleteAccount(params.id);
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/accounts/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
