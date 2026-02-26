import { NextResponse } from "next/server";
import { listCategoriesWithSubcategories } from "../../../lib/server/expense-categories-repository";

export async function GET() {
  try {
    const data = await listCategoriesWithSubcategories();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/expense-categories failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}
