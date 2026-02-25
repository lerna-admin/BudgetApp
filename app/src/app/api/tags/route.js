import { NextResponse } from "next/server";
import { listTags } from "../../../lib/server/expenses-repository";

export async function GET() {
  try {
    const data = await listTags();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/tags failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}
