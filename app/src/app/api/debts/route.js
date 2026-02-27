import { NextResponse } from "next/server";

import { createDebt, listDebts } from "../../../lib/server/debts-repository";

function toNullableId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
}

export async function GET() {
  try {
    const data = await listDebts();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/debts failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const debtName = (body?.debtName || "").trim();
    const debtType = (body?.debtType || "").trim();
    const principal = Number(body?.principal);
    const interestRateEa = Number(body?.interestRateEa);

    if (!debtName) return NextResponse.json({ error: "Nombre de deuda requerido" }, { status: 400 });
    if (!debtType) return NextResponse.json({ error: "Tipo de deuda requerido" }, { status: 400 });
    if (!Number.isFinite(principal) || principal <= 0) {
      return NextResponse.json({ error: "Principal invalido" }, { status: 400 });
    }
    if (!Number.isFinite(interestRateEa) || interestRateEa < 0) {
      return NextResponse.json({ error: "Interes EA invalido" }, { status: 400 });
    }

    const data = await createDebt({
      debtName,
      debtType,
      principal,
      interestRateEa,
      minimumPayment:
        body?.minimumPayment === undefined || body?.minimumPayment === null || body?.minimumPayment === ""
          ? null
          : Number(body.minimumPayment),
      currency: body?.currency || "COP",
      status: body?.status || "open",
      dueDate: body?.dueDate || null,
      notes: body?.notes || "",
      bankId: toNullableId(body?.bankId),
      accountId: toNullableId(body?.accountId),
      cardId: toNullableId(body?.cardId),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/debts failed", error);
    if (typeof error?.message === "string" && error.message.endsWith("_invalid")) {
      return NextResponse.json({ error: "Datos invalidos para crear deuda" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
