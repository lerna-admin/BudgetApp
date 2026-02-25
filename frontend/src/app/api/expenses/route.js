import { NextResponse } from "next/server";
import { createExpense, listExpenses } from "../../../lib/server/expenses-repository";

export async function GET() {
  try {
    const data = await listExpenses();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/expenses failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Monto invalido" }, { status: 400 });
    }

    const movement = await createExpense({
      movementType: body.movementType || "expense",
      date: body.date || new Date().toISOString().slice(0, 10),
      detail: (body.detail || "").slice(0, 180),
      notes: (body.notes || "").slice(0, 300),
      amount,
      category: body.category || "",
      subcategory: body.subcategory || "",
      edge: body.edge || "",
      method: body.method || "cash",
      bank: body.bank || "",
      card: body.card || "",
      currency: body.currency || "COP",
      tags: Array.isArray(body.tags) ? body.tags : [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      transferFrom: body.transferFrom || "",
      transferTo: body.transferTo || "",
      destinationAccountId: body.destinationAccountId || null,
      destinationNote: body.destinationNote || "",
    });

    return NextResponse.json({ data: movement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses failed", error);
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
