import { NextResponse } from "next/server";

import { getCurrentBudgetPerformance } from "../../../../lib/server/budgets-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getCurrentBudgetPerformance({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/budgets/current failed", error);
    return NextResponse.json({ error: "No se pudo obtener presupuesto actual" }, { status: 500 });
  }
}
