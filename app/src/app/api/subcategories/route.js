import { NextResponse } from "next/server";
import { createCustomSubcategory, listCustomSubcategories, listCustomSubcategoriesByCategory } from "../../../lib/server/custom-subcategories-repository";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const data = category
      ? await listCustomSubcategoriesByCategory(category)
      : await listCustomSubcategories();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/subcategories failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const categoryLabel = (body?.categoryLabel || "").trim();
    const name = (body?.name || "").trim();
    const edge = (body?.edge || "").trim();

    if (!categoryLabel || !name) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const created = await createCustomSubcategory({ categoryLabel, name, edge });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subcategories failed", error);
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
