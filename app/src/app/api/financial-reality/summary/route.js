import { NextResponse } from "next/server";

import { getFinancialRealitySnapshot } from "../../../../lib/server/financial-reality-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getFinancialRealitySnapshot({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/financial-reality/summary failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}
