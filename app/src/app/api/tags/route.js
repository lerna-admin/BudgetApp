import { NextResponse } from "next/server";
import { listTags } from "../../../lib/server/expenses-repository";
import { getSessionUser } from "../../../lib/server/session-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await listTags({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/tags failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}
