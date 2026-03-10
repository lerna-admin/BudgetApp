import { NextResponse } from "next/server";

import { createFriend, listFriends } from "../../../lib/server/friends-repository";
import { getSessionUser } from "../../../lib/server/session-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const data = await listFriends({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/friends failed", error);
    return NextResponse.json({ error: "No se pudo obtener" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const body = await request.json();
    const name = (body?.name || "").trim();
    const contact = (body?.contact || "").trim();
    if (!name || !contact) {
      return NextResponse.json(
        { error: "Nombre y correo o numero telefonico requeridos" },
        { status: 400 },
      );
    }

    const { friend, existed } = await createFriend({ userId: user.id, name, contact });
    return NextResponse.json({ data: friend, existed }, { status: existed ? 200 : 201 });
  } catch (error) {
    console.error("POST /api/friends failed", error);
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Ya existe un amigo con ese contacto" }, { status: 409 });
    }
    if (typeof error?.message === "string" && error.message.endsWith("_required")) {
      return NextResponse.json({ error: "Usuario requerido" }, { status: 401 });
    }
    if (error?.message === "contact_invalid") {
      return NextResponse.json(
        { error: "Correo o numero telefonico invalido" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
