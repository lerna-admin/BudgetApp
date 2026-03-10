import { NextResponse } from "next/server";

import {
  getBudgetPerformanceForPeriod,
  getCurrentBudgetPerformance,
  upsertUserBudget,
} from "../../../lib/server/budgets-repository";
import { getSessionUser } from "../../../lib/server/session-user";

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    const data = period
      ? await getBudgetPerformanceForPeriod({ userId: user.id, period })
      : await getCurrentBudgetPerformance({ userId: user.id });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/budgets failed", error);
    return NextResponse.json({ error: "No se pudo obtener presupuesto" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    const budget = await upsertUserBudget({
      userId: user.id,
      payload,
      status: body?.status || "draft",
    });

    const data = await getBudgetPerformanceForPeriod({
      userId: user.id,
      period: budget.period,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets failed", error);
    if (error?.message === "period_required") {
      return NextResponse.json({ error: "Periodo invalido o faltante" }, { status: 400 });
    }
    if (error?.message === "unauthorized") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "No se pudo guardar presupuesto" }, { status: 500 });
  }
}
