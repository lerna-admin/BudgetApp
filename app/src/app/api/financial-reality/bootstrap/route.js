import { NextResponse } from "next/server";

import { bootstrapFinancialReality } from "../../../../lib/server/financial-reality-repository";
import { getSessionUser } from "../../../../lib/server/session-user";

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const payload = await request.json();
    const data = await bootstrapFinancialReality({
      userId: user.id,
      payload,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/financial-reality/bootstrap failed", error);
    if (error?.message === "unauthorized") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para realidad financiera" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo guardar la realidad financiera" }, { status: 500 });
  }
}
