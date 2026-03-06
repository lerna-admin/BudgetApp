import { NextResponse } from "next/server";

import { deleteAccount, listAccounts } from "../../../../lib/server/accounts-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const all = await listAccounts({ userId: user.id });
    const found = all.find((a) => a.id === params.id);
    if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: found });
  } catch (error) {
    console.error("GET /api/accounts/:id failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const removed = await deleteAccount(params.id, { userId: user.id });
    if (!removed) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ data: removed });
  } catch (error) {
    console.error("DELETE /api/accounts/:id failed", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
