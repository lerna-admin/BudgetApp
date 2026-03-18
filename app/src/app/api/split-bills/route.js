import { NextResponse } from "next/server";

import { getSessionUser } from "../../../lib/server/session-user";
import { createSplitBill, listSplitBills, splitBillTitleExists } from "../../../lib/server/split-bills-repository";

function normalizeAllocations(rawAllocations) {
  if (Array.isArray(rawAllocations)) {
    return rawAllocations
      .map((entry) => ({
        participantId: String(entry?.participantId || ""),
        amountCents: Number(entry?.amountCents) || 0,
      }))
      .filter((entry) => entry.participantId);
  }
  if (rawAllocations && typeof rawAllocations === "object") {
    return Object.entries(rawAllocations).map(([participantId, amountCents]) => ({
      participantId: String(participantId),
      amountCents: Number(amountCents) || 0,
    }));
  }
  return [];
}

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item) => ({
    id: item.id || null,
    description: String(item.description || ""),
    amount: item.amount ?? "",
    payerId: item.payerId ? String(item.payerId) : null,
    payerIds: Array.isArray(item.payerIds)
      ? item.payerIds.map((id) => String(id)).filter(Boolean)
      : item.payerId
        ? [String(item.payerId)]
        : [],
    payerMode: item.payerMode === "manual" ? "manual" : "equal",
    payerAllocations: normalizeAllocations(item.payerAllocations),
    participantIds: Array.isArray(item.participantIds)
      ? item.participantIds.map((id) => String(id))
      : [],
    allocations: normalizeAllocations(item.allocations),
  }));
}

function normalizeParticipantFriendIds(rawIds) {
  if (!Array.isArray(rawIds)) return [];
  return rawIds.map((id) => String(id));
}

function normalizeSettlements(rawSettlements) {
  if (!Array.isArray(rawSettlements)) return [];
  return rawSettlements
    .map((entry) => {
      if (entry?.id === "__owner_consumption__") {
        return {
          id: "__owner_consumption__",
          fromId: null,
          toId: null,
          amountCents: 0,
          createdAt: null,
          expenseIds: Array.isArray(entry?.expenseIds)
            ? entry.expenseIds.filter((id) => id && typeof id === "string")
            : [],
        };
      }
      return {
        id: entry?.id || null,
        fromId: entry?.fromId ? String(entry.fromId) : null,
        toId: entry?.toId ? String(entry.toId) : null,
        amountCents: Math.max(0, Math.round(Number(entry?.amountCents) || 0)),
        createdAt: entry?.createdAt ? String(entry.createdAt) : null,
        expenseIds: Array.isArray(entry?.expenseIds)
          ? entry.expenseIds.filter((id) => id && typeof id === "string")
          : [],
      };
    })
    .filter(
      (entry) =>
        entry.id === "__owner_consumption__" ||
        (entry.fromId && entry.toId && entry.amountCents > 0),
    );
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const data = await listSplitBills({ userId: user.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/split-bills failed", error);
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
    const title = (body?.title || "").trim();
    const currency = (body?.currency || "").trim() || "COP";
    const payerType = body?.payerType === "friend" ? "friend" : "user";
    const payerFriendId = payerType === "friend" ? String(body?.payerFriendId || "") : null;
    const participantFriendIds = normalizeParticipantFriendIds(body?.participantFriendIds);

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }
    const duplicate = await splitBillTitleExists({ userId: user.id, title });
    if (duplicate) {
      return NextResponse.json({ error: "Ya existe una división con ese título" }, { status: 409 });
    }
    if (payerType === "friend" && !payerFriendId) {
      return NextResponse.json({ error: "Selecciona quién pagó la cuenta" }, { status: 400 });
    }
    if (payerType === "friend" && !participantFriendIds.includes(payerFriendId)) {
      return NextResponse.json({ error: "El pagador debe estar en los participantes" }, { status: 400 });
    }

    const items = normalizeItems(body?.items);
    const settlements = normalizeSettlements(body?.settlements);

    const data = await createSplitBill({
      userId: user.id,
      title,
      currency,
      payerType,
      payerFriendId,
      participantFriendIds,
      items,
      settlements,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/split-bills failed", error);
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
