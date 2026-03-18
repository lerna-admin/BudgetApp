"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const CURRENCIES = ["COP", "USD", "EUR"];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeNumericInput(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().replace(/\s/g, "").replace(/[^\d.,]/g, "");
}

function parseFlexibleNumber(value, decimalsLimit = 2) {
  const raw = sanitizeNumericInput(value);
  if (!raw) return 0;
  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");
  const lastSepIndex = Math.max(lastDot, lastComma);
  if (lastSepIndex === -1) {
    const numeric = Number(raw.replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  const intPart = raw.slice(0, lastSepIndex).replace(/[^\d]/g, "");
  const fracPart = raw.slice(lastSepIndex + 1).replace(/[^\d]/g, "");
  if (decimalsLimit > 0 && fracPart.length > 0 && fracPart.length <= decimalsLimit) {
    const numeric = Number(`${intPart}.${fracPart}`);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  const numeric = Number((intPart + fracPart).replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function amountToCents(value, _currency = "COP") {
  const numeric = parseFlexibleNumber(value, 2);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 100);
}

function parseNumericInput(value) {
  return parseFlexibleNumber(value, 2);
}

function normalizePositiveDecimalInput(value) {
  const raw = sanitizeNumericInput(value);
  if (!raw) return "";
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const hasComma = lastComma !== -1;
  const hasDot = lastDot !== -1;
  if (!hasComma && !hasDot) {
    return raw.replace(/[^\d]/g, "");
  }
  const separator = hasComma && lastComma > lastDot ? "," : ".";
  const lastSepIndex = separator === "," ? lastComma : lastDot;
  const intRaw = raw.slice(0, lastSepIndex);
  const fracRaw = raw.slice(lastSepIndex + 1);
  const intPart = separator === "," ? intRaw.replace(/[^\d.]/g, "") : intRaw.replace(/[^\d,]/g, "");
  const fracPart = fracRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (fracPart) {
    return `${intPart}${separator}${fracPart}`;
  }
  return `${intPart}${separator}`;
}

function clampValue(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function formatAmountInputFromCents(cents, _currency = "COP") {
  const decimals = 2;
  const formatter = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
  return formatter.format(Number(cents || 0) / 100);
}

function formatAmountInputValue(rawValue, currency = "COP") {
  if (rawValue === null || rawValue === undefined) return "";
  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";
  const cents = amountToCents(trimmed, currency);
  return formatAmountInputFromCents(cents, currency);
}

function formatPercentInput(value) {
  if (!Number.isFinite(value)) return "0";
  const formatter = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
  return formatter.format(Number(value));
}

function getItemParticipantsLabel(item, participants) {
  const participantIds = Array.isArray(item?.participantIds) ? item.participantIds : [];
  if (participantIds.length === 0) return "Sin participantes";
  const participantSet = new Set(participantIds);
  if (participants.length > 0 && participants.every((person) => participantSet.has(person.id))) {
    return "Todos";
  }
  const orderedNames = participants.filter((person) => participantSet.has(person.id)).map((person) => person.name);
  if (orderedNames.length > 0) {
    return orderedNames.join(", ");
  }
  return participantIds.join(", ");
}

function buildParticipantBreakdown({ participantId, participants, items, currency }) {
  const participant = participants.find((person) => person.id === participantId);
  if (!participant) return null;
  const participantIds = new Set(participants.map((person) => person.id));
  const breakdownItems = [];
  let totalCents = 0;

  items.forEach((item, index) => {
    const amountCents = amountToCents(item.amount, currency);
    if (amountCents <= 0) return;
    const selected = (item.participantIds || []).filter((id) => participantIds.has(id));
    if (selected.length === 0 || !selected.includes(participantId)) return;
    const allocationMap = getAllocationMapForItem(item, selected, amountCents);
    const owedCents = allocationMap[participantId] || 0;
    if (owedCents <= 0) return;
    breakdownItems.push({
      id: item.id || `item-${index}`,
      description: item.description?.trim() || "Ítem sin descripción",
      owedCents,
      totalCents: amountCents,
    });
    totalCents += owedCents;
  });

  return { participant, items: breakdownItems, totalCents };
}

function normalizeContact(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function splitEvenly(totalCents, count) {
  if (!Number.isFinite(totalCents) || totalCents <= 0 || count <= 0) return [];
  const base = Math.floor(totalCents / count);
  let remainder = totalCents - base * count;
  return Array.from({ length: count }, () => {
    if (remainder > 0) {
      remainder -= 1;
      return base + 1;
    }
    return base;
  });
}

function buildEqualAllocations(participantIds, totalCents) {
  const shares = splitEvenly(totalCents, participantIds.length);
  const map = {};
  participantIds.forEach((id, index) => {
    map[id] = shares[index] || 0;
  });
  return map;
}

function allocationsToMap(allocations, allowedIds = null) {
  const map = {};
  const allow = allowedIds ? new Set(allowedIds) : null;
  if (Array.isArray(allocations)) {
    allocations.forEach((entry) => {
      const participantId = String(entry?.participantId || "");
      if (!participantId) return;
      if (allow && !allow.has(participantId)) return;
      const amountCents = Math.max(0, Math.round(Number(entry?.amountCents) || 0));
      map[participantId] = amountCents;
    });
    return map;
  }
  if (allocations && typeof allocations === "object") {
    Object.entries(allocations).forEach(([participantId, amountCents]) => {
      if (!participantId) return;
      if (allow && !allow.has(participantId)) return;
      const normalized = Math.max(0, Math.round(Number(amountCents) || 0));
      map[String(participantId)] = normalized;
    });
  }
  return map;
}

function normalizeAllocationMap(allocationMap, participantIds, totalCents) {
  if (!participantIds.length) return {};
  const map = {};
  participantIds.forEach((id) => {
    map[id] = Math.max(0, Math.round(allocationMap[id] || 0));
  });
  const sum = participantIds.reduce((acc, id) => acc + (map[id] || 0), 0);
  if (sum === totalCents) return map;
  if (sum === 0 && totalCents > 0) {
    return buildEqualAllocations(participantIds, totalCents);
  }
  let diff = totalCents - sum;
  let index = 0;
  while (diff !== 0 && participantIds.length) {
    const id = participantIds[index % participantIds.length];
    const nextValue = map[id] + (diff > 0 ? 1 : -1);
    if (nextValue >= 0) {
      map[id] = nextValue;
      diff += diff > 0 ? -1 : 1;
    }
    index += 1;
    if (index > participantIds.length * 2 && diff < 0) break;
  }
  return map;
}

function getAllocationMapForItem(item, participantIds, totalCents) {
  const map = allocationsToMap(item?.allocations, participantIds);
  return normalizeAllocationMap(map, participantIds, totalCents);
}

function getPayerAllocationMapForItem(item, payerIds, totalCents) {
  const map = allocationsToMap(item?.payerAllocations, payerIds);
  return normalizeAllocationMap(map, payerIds, totalCents);
}

function redistributeFromIndex({ orderedIds, allocationMap, totalCents, index, nextPercent }) {
  const targetId = orderedIds[index];
  if (!targetId) return allocationMap;
  const fixedIds = orderedIds.slice(0, index);
  const remainingIds = orderedIds.slice(index + 1);
  const fixedSum = fixedIds.reduce((acc, id) => acc + (allocationMap[id] || 0), 0);
  const desiredCents = Math.round((totalCents * nextPercent) / 100);
  const maxAvailable = Math.max(0, totalCents - fixedSum);
  const nextCents =
    remainingIds.length === 0 ? maxAvailable : clampValue(desiredCents, 0, maxAvailable);
  const remainder = Math.max(0, totalCents - fixedSum - nextCents);
  const shares = splitEvenly(remainder, remainingIds.length);

  const nextMap = {};
  fixedIds.forEach((id) => {
    nextMap[id] = Math.max(0, Math.round(allocationMap[id] || 0));
  });
  nextMap[targetId] = nextCents;
  remainingIds.forEach((id, idx) => {
    nextMap[id] = shares[idx] || 0;
  });
  return nextMap;
}

function buildFrozenIdSet(frozenMap, ids, excludeId = null) {
  const set = new Set();
  ids.forEach((id) => {
    if (id === excludeId) return;
    if (frozenMap?.[id]) {
      set.add(id);
    }
  });
  return set;
}

function redistributeValueWithFrozen({
  participantIds,
  allocationMap,
  totalCents,
  editedId,
  nextCents,
  frozenMap,
}) {
  const frozenSet = buildFrozenIdSet(frozenMap, participantIds, editedId);
  const fixedSum = [...frozenSet].reduce((acc, id) => acc + (allocationMap[id] || 0), 0);
  const maxAvailable = Math.max(0, totalCents - fixedSum);
  const remainingIds = participantIds.filter((id) => id !== editedId && !frozenSet.has(id));
  const clampedEdited =
    remainingIds.length === 0 ? maxAvailable : clampValue(nextCents, 0, maxAvailable);
  const remainder = Math.max(0, maxAvailable - clampedEdited);
  const shares = splitEvenly(remainder, remainingIds.length);

  const nextMap = {};
  frozenSet.forEach((id) => {
    nextMap[id] = Math.max(0, Math.round(allocationMap[id] || 0));
  });
  nextMap[editedId] = clampedEdited;
  remainingIds.forEach((id, index) => {
    nextMap[id] = shares[index] || 0;
  });
  return nextMap;
}

function redistributePercentWithFrozen({
  orderedIds,
  allocationMap,
  totalCents,
  index,
  nextPercent,
  frozenMap,
}) {
  const targetId = orderedIds[index];
  if (!targetId) return allocationMap;
  const frozenSet = buildFrozenIdSet(frozenMap, orderedIds, targetId);
  if (frozenSet.size > 0) {
    const fixedSum = [...frozenSet].reduce((acc, id) => acc + (allocationMap[id] || 0), 0);
    const maxAvailable = Math.max(0, totalCents - fixedSum);
    const desiredCents = Math.round((totalCents * nextPercent) / 100);
    const remainingIds = orderedIds.filter((id) => id !== targetId && !frozenSet.has(id));
    const nextCents =
      remainingIds.length === 0 ? maxAvailable : clampValue(desiredCents, 0, maxAvailable);
    const remainder = Math.max(0, maxAvailable - nextCents);
    const shares = splitEvenly(remainder, remainingIds.length);

    const nextMap = {};
    frozenSet.forEach((id) => {
      nextMap[id] = Math.max(0, Math.round(allocationMap[id] || 0));
    });
    nextMap[targetId] = nextCents;
    remainingIds.forEach((id, idx) => {
      nextMap[id] = shares[idx] || 0;
    });
    return nextMap;
  }
  return redistributeFromIndex({ orderedIds, allocationMap, totalCents, index, nextPercent });
}

function getRawPayerIds(item) {
  if (!item) return [];
  if (Array.isArray(item.payerIds)) {
    return item.payerIds.map((id) => String(id)).filter(Boolean);
  }
  if (item.payerId) {
    return [String(item.payerId)];
  }
  return [];
}

function normalizePayerIds(item, participantIds, fallbackId = null) {
  const valid = new Set(participantIds);
  const raw = getRawPayerIds(item);
  const filtered = raw.filter((id) => valid.has(id));
  if (filtered.length) return filtered;
  if (fallbackId && valid.has(fallbackId)) return [fallbackId];
  return participantIds.length ? [participantIds[0]] : [];
}

function getPaidMapForItem(item, participantIds, totalCents, fallbackId = null) {
  const payerIds = normalizePayerIds(item, participantIds, fallbackId);
  if (payerIds.length <= 1) {
    const map = buildEqualAllocations(payerIds, totalCents);
    return { payerIds, map };
  }
  if (item?.payerMode === "manual") {
    const map = getPayerAllocationMapForItem(item, payerIds, totalCents);
    return { payerIds, map };
  }
  const map = buildEqualAllocations(payerIds, totalCents);
  return { payerIds, map };
}

function mapToAllocations(map, participantIds) {
  return participantIds.map((id) => ({
    participantId: id,
    amountCents: Math.max(0, Math.round(map[id] || 0)),
  }));
}

function buildPercentMap(allocationMap, participantIds, totalCents) {
  const result = {};
  if (!participantIds.length || totalCents <= 0) {
    participantIds.forEach((id) => {
      result[id] = 0;
    });
    return result;
  }
  const rows = participantIds.map((id) => {
    const raw = ((allocationMap[id] || 0) / totalCents) * 100;
    const base = Math.floor(raw * 100) / 100;
    return { id, base, remainder: raw - base };
  });
  let sum = rows.reduce((acc, row) => acc + row.base, 0);
  let diff = Math.round((100 - sum) * 100);
  const sorted = [...rows].sort((a, b) =>
    diff >= 0 ? b.remainder - a.remainder : a.remainder - b.remainder,
  );
  let index = 0;
  while (diff !== 0 && sorted.length) {
    const row = sorted[index % sorted.length];
    row.base = Math.max(0, row.base + (diff > 0 ? 0.01 : -0.01));
    diff += diff > 0 ? -1 : 1;
    index += 1;
    if (index > sorted.length * 200) break;
  }
  sorted.forEach((row) => {
    result[row.id] = Number(row.base.toFixed(2));
  });
  return result;
}

function isEqualAllocation(allocationMap, participantIds, totalCents) {
  if (!participantIds.length || totalCents <= 0) return true;
  const expected = buildEqualAllocations(participantIds, totalCents);
  return participantIds.every((id) => (allocationMap[id] || 0) === (expected[id] || 0));
}

function buildAllocationMapForMode({
  currentAllocations,
  participantIds,
  totalCents,
  mode,
  frozenMap,
}) {
  const hasFrozen = frozenMap && Object.keys(frozenMap).length > 0;
  if (mode === "equal" && !hasFrozen) {
    return normalizeAllocationMap({}, participantIds, totalCents);
  }
  return normalizeAllocationMap(
    allocationsToMap(currentAllocations, participantIds),
    participantIds,
    totalCents,
  );
}

function formatCurrencyFromCents(cents, currency = "COP") {
  const value = Number(cents || 0) / 100;
  const decimals = 2;
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (_error) {
    return `${currency} ${value}`;
  }
}

function formatSplitDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createParticipant({ id, name, contact, type = "friend", friendId = null }) {
  return {
    id: id || createId("person"),
    name: String(name || "").trim() || "Participante",
    contact: String(contact || "").trim() || "",
    type,
    friendId,
  };
}

function createUserParticipant(name) {
  return createParticipant({ id: "user", name: name || "Tu", type: "user" });
}

function createFriendParticipant(friend) {
  return createParticipant({
    id: `friend-${friend.id}`,
    name: friend.name,
    contact: friend.contact,
    type: "friend",
    friendId: friend.id,
  });
}

function createItem(defaultParticipantIds = [], defaultPayerId = "user") {
  const allocationMap = buildEqualAllocations(defaultParticipantIds, 0);
  return {
    id: createId("item"),
    description: "",
    amount: "",
    payerId: defaultPayerId,
    payerIds: [defaultPayerId],
    payerMode: "equal",
    payerAllocations: [],
    participantIds: [...defaultParticipantIds],
    allocations: mapToAllocations(allocationMap, defaultParticipantIds),
  };
}

function createInitialSplit(defaultPayerName) {
  const owner = createUserParticipant(defaultPayerName || "Tu");
  const participantIds = [owner.id];
  return {
    title: "",
    currency: "COP",
    payerId: owner.id,
    participants: [owner],
    items: [],
  };
}

function buildDraftItem(participants, fallbackPayerId = "user") {
  const participantIds = participants.map((person) => person.id);
  const safePayerId = participantIds.includes(fallbackPayerId)
    ? fallbackPayerId
    : participantIds[0] || "user";
  return createItem(participantIds, safePayerId);
}

function buildSettlements(balances) {
  const debtors = balances
    .filter((item) => item.balanceCents < 0)
    .map((item) => ({ id: item.id, name: item.name, remaining: -item.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((item) => item.balanceCents > 0)
    .map((item) => ({ id: item.id, name: item.name, remaining: item.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.remaining, creditor.remaining);

    if (amountCents > 0) {
      settlements.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amountCents,
      });
    }

    debtor.remaining -= amountCents;
    creditor.remaining -= amountCents;

    if (debtor.remaining <= 0) debtorIndex += 1;
    if (creditor.remaining <= 0) creditorIndex += 1;
  }

  return settlements;
}

function buildSettlementsWithPreferences(balances, preferences = {}) {
  const debtors = balances
    .filter((item) => item.balanceCents < 0)
    .map((item) => ({ id: item.id, name: item.name, remaining: -item.balanceCents }));
  const creditors = balances
    .filter((item) => item.balanceCents > 0)
    .map((item) => ({ id: item.id, name: item.name, remaining: item.balanceCents }));
  const creditorMap = new Map(creditors.map((item) => [item.id, item]));
  const settlements = [];

  debtors.forEach((debtor) => {
    if (debtor.remaining <= 0) return;
    const preferredId = preferences[debtor.id];
    if (preferredId && creditorMap.has(preferredId)) {
      const preferred = creditorMap.get(preferredId);
      if (preferred.remaining > 0) {
        const amount = Math.min(debtor.remaining, preferred.remaining);
        if (amount > 0) {
          settlements.push({ fromId: debtor.id, toId: preferred.id, amountCents: amount });
          debtor.remaining -= amount;
          preferred.remaining -= amount;
        }
      }
    }

    creditors.forEach((creditor) => {
      if (debtor.remaining <= 0) return;
      if (creditor.remaining <= 0) return;
      const amount = Math.min(debtor.remaining, creditor.remaining);
      if (amount <= 0) return;
      settlements.push({ fromId: debtor.id, toId: creditor.id, amountCents: amount });
      debtor.remaining -= amount;
      creditor.remaining -= amount;
    });
  });

  return settlements;
}

function calculateSummary({ participants, items, currency = "COP", settlements = [] }) {
  const participantIds = new Set(participants.map((item) => item.id));
  const paidByParticipant = {};
  const owedByParticipant = {};

  participants.forEach((item) => {
    paidByParticipant[item.id] = 0;
    owedByParticipant[item.id] = 0;
  });

  let totalCents = 0;
  let validItems = 0;
  let invalidItems = 0;

  items.forEach((item) => {
    const amountCents = amountToCents(item.amount, currency);
    if (amountCents <= 0) return;

    const selected = (item.participantIds || []).filter((id) => participantIds.has(id));
    if (selected.length === 0) {
      invalidItems += 1;
      return;
    }

    const allocationMap = getAllocationMapForItem(item, selected, amountCents);
    selected.forEach((id) => {
      owedByParticipant[id] += allocationMap[id] || 0;
    });

    totalCents += amountCents;
    validItems += 1;
    const allParticipantIds = participants.map((person) => person.id);
    const fallbackPayerId = selected[0] || participants[0]?.id || null;
    const { payerIds, map: paidMap } = getPaidMapForItem(
      item,
      allParticipantIds,
      amountCents,
      fallbackPayerId,
    );
    payerIds.forEach((id) => {
      paidByParticipant[id] += paidMap[id] || 0;
    });
  });

  let balances = participants.map((item) => {
    const paidCents = paidByParticipant[item.id] || 0;
    const owedCents = owedByParticipant[item.id] || 0;
    return {
      id: item.id,
      name: item.name,
      paidCents,
      owedCents,
      balanceCents: paidCents - owedCents,
    };
  });

  if (Array.isArray(settlements) && settlements.length > 0) {
    const balanceMap = new Map(balances.map((item) => [item.id, { ...item }]));
    settlements.forEach((settlement) => {
      const from = balanceMap.get(settlement.fromId);
      const to = balanceMap.get(settlement.toId);
      const amountCents = Math.max(0, Math.round(Number(settlement.amountCents) || 0));
      if (!from || !to || amountCents <= 0) return;
      from.balanceCents += amountCents;
      to.balanceCents -= amountCents;
    });
    balances = balances.map((item) => balanceMap.get(item.id) || item);
  }

  return {
    totalCents,
    validItems,
    invalidItems,
    balances,
    settlements: buildSettlements(balances),
  };
}

function validateItemData(item, participants, currency) {
  const trimmedDescription = String(item?.description || "").trim();
  if (!trimmedDescription) {
    return { ok: false, message: "La descripción del ítem es obligatoria." };
  }
  const payerIds = getRawPayerIds(item).filter((id) => participants.some((person) => person.id === id));
  if (payerIds.length === 0) {
    return { ok: false, message: "Selecciona quién pagó el ítem." };
  }
  const participantIds = (item?.participantIds || []).filter((id) =>
    participants.some((person) => person.id === id),
  );
  if (participantIds.length === 0) {
    return { ok: false, message: "Selecciona al menos 1 participante para el ítem." };
  }
  const totalCents = amountToCents(item?.amount, currency);
  if (totalCents <= 0) {
    return { ok: false, message: "El valor del ítem debe ser mayor a 0." };
  }
  const allocationMap = getAllocationMapForItem(item, participantIds, totalCents);
  const allocationTotal = participantIds.reduce((acc, id) => acc + (allocationMap[id] || 0), 0);
  if (allocationTotal !== totalCents) {
    return { ok: false, message: "La suma de los participantes debe ser el 100% del valor del ítem." };
  }
  if (participantIds.length === 1 && allocationMap[participantIds[0]] !== totalCents) {
    return { ok: false, message: "Con un solo participante debe asignarse el 100% del ítem." };
  }
  const payerMode = item?.payerMode === "manual" && payerIds.length > 1 ? "manual" : "equal";
  const payerAllocationMap = getPayerAllocationMapForItem(item, payerIds, totalCents);
  return {
    ok: true,
    trimmedDescription,
    payerIds,
    participantIds,
    totalCents,
    allocationMap,
    payerMode,
    payerAllocationMap,
  };
}

function toUiParticipantId(storedId) {
  if (!storedId) return "";
  return storedId === "user" ? "user" : `friend-${storedId}`;
}

function toStoredParticipantId(uiId) {
  if (!uiId) return "";
  return uiId === "user" ? "user" : uiId.replace(/^friend-/, "");
}

function buildParticipantsFromFriendIds(friendIds, friends, ownerName) {
  const owner = createUserParticipant(ownerName || "Tu");
  const friendMap = new Map((friends || []).map((friend) => [String(friend.id), friend]));
  const friendParticipants = (friendIds || []).map((friendId) => {
    const friend = friendMap.get(String(friendId));
    if (friend) {
      return createFriendParticipant(friend);
    }
    return createParticipant({
      id: `friend-${friendId}`,
      name: "Amigo",
      contact: "",
      type: "friend",
      friendId,
    });
  });
  return [owner, ...friendParticipants];
}

function buildItemsFromStored(items, participants, defaultPayerId = "user", currency = "COP") {
  const participantIds = participants.map((person) => person.id);
  const validSet = new Set(participantIds);
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  return items.map((item) => {
    const rawIds = Array.isArray(item.participantIds) ? item.participantIds : [];
    const mappedIds = rawIds
      .map((id) => toUiParticipantId(id))
      .filter((id) => validSet.has(id));
    const nextParticipantIds = mappedIds.length ? mappedIds : participantIds;
    const totalCents = amountToCents(item.amount, currency);
    let mappedAllocations = item.allocations;
    if (Array.isArray(item.allocations)) {
      mappedAllocations = item.allocations.map((entry) => ({
        ...entry,
        participantId: toUiParticipantId(entry?.participantId),
      }));
    } else if (item.allocations && typeof item.allocations === "object") {
      mappedAllocations = Object.entries(item.allocations).reduce((acc, [participantId, amountCents]) => {
        acc[toUiParticipantId(participantId)] = amountCents;
        return acc;
      }, {});
    }
    const allocationMap = normalizeAllocationMap(
      allocationsToMap(mappedAllocations, nextParticipantIds),
      nextParticipantIds,
      totalCents,
    );
    let mappedPayerAllocations = item.payerAllocations;
    if (Array.isArray(item.payerAllocations)) {
      mappedPayerAllocations = item.payerAllocations.map((entry) => ({
        ...entry,
        participantId: toUiParticipantId(entry?.participantId),
      }));
    } else if (item.payerAllocations && typeof item.payerAllocations === "object") {
      mappedPayerAllocations = Object.entries(item.payerAllocations).reduce((acc, [participantId, amountCents]) => {
        acc[toUiParticipantId(participantId)] = amountCents;
        return acc;
      }, {});
    }
    const rawPayerIds = Array.isArray(item.payerIds)
      ? item.payerIds
      : item.payerId
        ? [item.payerId]
        : [];
    const mappedPayerIds = rawPayerIds
      .map((id) => toUiParticipantId(id))
      .filter((id) => validSet.has(id));
    const fallbackPayerId = validSet.has(defaultPayerId)
      ? defaultPayerId
      : nextParticipantIds[0] || defaultPayerId;
    const safePayerIds = mappedPayerIds.length ? mappedPayerIds : [fallbackPayerId];
    const safePayerId = safePayerIds[0] || fallbackPayerId;
    const payerMode = item.payerMode === "manual" && safePayerIds.length > 1 ? "manual" : "equal";
    const payerAllocationMap = getPayerAllocationMapForItem(
      { payerAllocations: mappedPayerAllocations },
      safePayerIds,
      totalCents,
    );
    return {
      id: item.id || createId("item"),
      description: item.description || "",
      amount: item.amount || "",
      payerId: safePayerId,
      payerIds: safePayerIds,
      payerMode,
      payerAllocations: mapToAllocations(payerAllocationMap, safePayerIds),
      participantIds: nextParticipantIds,
      allocations: mapToAllocations(allocationMap, nextParticipantIds),
    };
  });
}

function buildSettlementsFromStored(rawSettlements, participants) {
  if (!Array.isArray(rawSettlements) || rawSettlements.length === 0) return [];
  const validIds = new Set(participants.map((person) => person.id));
  return rawSettlements
    .map((entry) => {
      const fromId = toUiParticipantId(entry?.fromId);
      const toId = toUiParticipantId(entry?.toId);
      if (!validIds.has(fromId) || !validIds.has(toId) || fromId === toId) {
        return null;
      }
      const amountCents = Math.max(0, Math.round(Number(entry?.amountCents) || 0));
      if (amountCents <= 0) return null;
      return {
        id: entry?.id || createId("settlement"),
        fromId,
        toId,
        amountCents,
        createdAt: entry?.createdAt || null,
      };
    })
    .filter(Boolean);
}

function resolvePayerId(record) {
  if (record?.payerType === "friend" && record?.payerFriendId) {
    return `friend-${record.payerFriendId}`;
  }
  return "user";
}

export default function SplitBillManager({ defaultPayerName }) {
  const initial = useMemo(() => createInitialSplit(defaultPayerName), [defaultPayerName]);

  const [title, setTitle] = useState(initial.title);
  const [currency, setCurrency] = useState(initial.currency);
  const [payerId, setPayerId] = useState(initial.payerId);
  const [participants, setParticipants] = useState(initial.participants);
  const [items, setItems] = useState(initial.items);
  const [settlements, setSettlements] = useState([]);
  const [draftItem, setDraftItem] = useState(() => buildDraftItem(initial.participants, initial.payerId));
  const [isAmountEditing, setIsAmountEditing] = useState(false);
  const [allocationInputOverrides, setAllocationInputOverrides] = useState({});
  const [percentInputOverrides, setPercentInputOverrides] = useState({});
  const [draftFrozenParticipantIds, setDraftFrozenParticipantIds] = useState({});
  const [draftAllocationMode, setDraftAllocationMode] = useState("equal");
  const [payerAllocationInputOverrides, setPayerAllocationInputOverrides] = useState({});
  const [payerPercentInputOverrides, setPayerPercentInputOverrides] = useState({});
  const [splits, setSplits] = useState([]);
  const [splitsLoading, setSplitsLoading] = useState(true);
  const [splitsError, setSplitsError] = useState("");
  const [creatingSplit, setCreatingSplit] = useState(false);
  const [editingSplitId, setEditingSplitId] = useState("");
  const [savingSplit, setSavingSplit] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [view, setView] = useState("list");
  const [editStep, setEditStep] = useState("setup");
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState("");
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [friendForm, setFriendForm] = useState({ name: "", contact: "" });
  const [friendSaving, setFriendSaving] = useState(false);
  const [friendFeedback, setFriendFeedback] = useState(null);
  const [friendPickerOpen, setFriendPickerOpen] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePayerIds, setInvoicePayerIds] = useState([]);
  const invoiceInputRef = useRef(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [isEditAmountEditing, setIsEditAmountEditing] = useState(false);
  const [editAllocationInputOverrides, setEditAllocationInputOverrides] = useState({});
  const [editPercentInputOverrides, setEditPercentInputOverrides] = useState({});
  const [editFrozenParticipantIds, setEditFrozenParticipantIds] = useState({});
  const [editAllocationMode, setEditAllocationMode] = useState("equal");
  const [editPayerAllocationInputOverrides, setEditPayerAllocationInputOverrides] = useState({});
  const [editPayerPercentInputOverrides, setEditPayerPercentInputOverrides] = useState({});
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(false);
  const [deletingSplitId, setDeletingSplitId] = useState("");
  const [confirmDeleteSplitId, setConfirmDeleteSplitId] = useState("");
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceRecord, setBalanceRecord] = useState(null);
  const [balanceParticipants, setBalanceParticipants] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balancePartialInputs, setBalancePartialInputs] = useState({});
  const [balancePartialOpen, setBalancePartialOpen] = useState({});
  const [balancePartialEditing, setBalancePartialEditing] = useState({});
  const [balanceLineSelections, setBalanceLineSelections] = useState({});
  const [balanceSettledLines, setBalanceSettledLines] = useState([]);
  const [balanceDetailParticipantId, setBalanceDetailParticipantId] = useState("");
  const [urlSyncEnabled, setUrlSyncEnabled] = useState(false);
  const restoreAttemptedRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;
    async function loadSplits() {
      try {
        const res = await fetch("/api/split-bills", { cache: "no-store" });
        if (!res.ok) {
          throw new Error();
        }
        const payload = await res.json();
        if (!active) return;
        setSplits(payload.data || []);
        setSplitsError("");
      } catch (_error) {
        if (!active) return;
        setSplits([]);
        setSplitsError("No se pudieron cargar las divisiones.");
      } finally {
        if (active) {
          setSplitsLoading(false);
        }
      }
    }
    loadSplits();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (restoreAttemptedRef.current) return;
    const splitIdParam = searchParams?.get("splitId");
    const stepParam = searchParams?.get("step");
    if (!splitIdParam || stepParam !== "items") {
      restoreAttemptedRef.current = true;
      setUrlSyncEnabled(true);
      return;
    }
    if (friendsLoading || splitsLoading) return;

    restoreAttemptedRef.current = true;
    const restore = async () => {
      try {
        if (
          editingSplitId === splitIdParam &&
          view === "edit" &&
          editStep === "items"
        ) {
          return;
        }
        const record = splits.find((item) => item.id === splitIdParam);
        if (record) {
          openSplit(record);
          return;
        }
        const res = await fetch(`/api/split-bills/${splitIdParam}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error();
        }
        const payload = await res.json();
        if (payload?.data) {
          openSplit(payload.data);
        } else {
          setFeedback({ type: "error", text: "No se pudo restaurar la división." });
        }
      } catch (_error) {
        setFeedback({ type: "error", text: "No se pudo restaurar la división." });
      } finally {
        setUrlSyncEnabled(true);
      }
    };
    restore();
  }, [
    searchParams,
    friendsLoading,
    splitsLoading,
    splits,
    editingSplitId,
    view,
    editStep,
  ]);

  useEffect(() => {
    if (!urlSyncEnabled) return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    const shouldPersist = view === "edit" && editStep === "items" && editingSplitId;
    const nextSplitId = shouldPersist ? editingSplitId : "";
    const nextStep = shouldPersist ? "items" : "";
    const currentSplitId = params.get("splitId") || "";
    const currentStep = params.get("step") || "";

    if (currentSplitId === nextSplitId && currentStep === nextStep) return;

    if (nextSplitId) {
      params.set("splitId", nextSplitId);
      params.set("step", nextStep);
    } else {
      params.delete("splitId");
      params.delete("step");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [urlSyncEnabled, view, editStep, editingSplitId, searchParams, router, pathname]);

  useEffect(() => {
    let active = true;
    async function loadFriends() {
      try {
        const res = await fetch("/api/friends", { cache: "no-store" });
        if (!res.ok) {
          throw new Error();
        }
        const payload = await res.json();
        if (!active) return;
        setFriends(payload.data || []);
        setFriendsError("");
      } catch (_error) {
        if (!active) return;
        setFriends([]);
        setFriendsError("No se pudo cargar la lista de amigos.");
      } finally {
        if (active) {
          setFriendsLoading(false);
        }
      }
    }
    loadFriends();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => calculateSummary({ participants, items, currency, settlements }),
    [participants, items, currency, settlements],
  );
  const balanceDetail = useMemo(() => {
    if (!balanceDetailParticipantId) return null;
    return buildParticipantBreakdown({
      participantId: balanceDetailParticipantId,
      participants,
      items,
      currency,
    });
  }, [balanceDetailParticipantId, participants, items, currency]);
  const itemsTotalCents = useMemo(
    () => items.reduce((acc, item) => acc + amountToCents(item.amount, currency), 0),
    [items, currency],
  );
  const availableFriends = useMemo(() => {
    const participantIds = new Set(
      participants.filter((person) => person.type === "friend" && person.friendId).map((person) => String(person.friendId)),
    );
    return (friends || []).filter((friend) => !participantIds.has(String(friend.id)));
  }, [friends, participants]);
  const isListView = view === "list";
  const isSetupStep = view === "edit" && editStep === "setup";
  const isItemsStep = view === "edit" && editStep === "items";
  const workspaceClassName = `expense-workspace${isItemsStep ? " split-items-view" : ""}`;
  const actionButtonStyle = { justifyContent: "center" };
  const actionIconStyle = { fontSize: 16, lineHeight: 1 };
  const feedbackStyle = feedback?.type === "warn" ? { color: "var(--amber)" } : undefined;
  const feedbackClass =
    feedback?.type === "error"
      ? "message message-error"
      : feedback?.type === "ok"
        ? "message message-ok"
        : "message";
  const friendFeedbackClass =
    friendFeedback?.type === "error"
      ? "message message-error"
      : friendFeedback?.type === "ok"
        ? "message message-ok"
        : "message";
  const friendFeedbackStyle = friendFeedback?.type === "warn" ? { color: "var(--amber)" } : undefined;
  const draftValidation = useMemo(
    () => validateItemData(draftItem, participants, currency),
    [draftItem, participants, currency],
  );

  function showToast(text, type = "ok") {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function clearDraftOverrides() {
    setIsAmountEditing(false);
    setAllocationInputOverrides({});
    setPercentInputOverrides({});
    setPayerAllocationInputOverrides({});
    setPayerPercentInputOverrides({});
  }

  function clearEditOverrides() {
    setIsEditAmountEditing(false);
    setEditAllocationInputOverrides({});
    setEditPercentInputOverrides({});
    setEditPayerAllocationInputOverrides({});
    setEditPayerPercentInputOverrides({});
  }

  function resetSplit({ clearFeedback = true } = {}) {
    const next = createInitialSplit(defaultPayerName);
    setTitle(next.title);
    setCurrency(next.currency);
    setPayerId(next.payerId);
    setParticipants(next.participants);
    setItems(next.items);
    setSettlements([]);
    setDraftItem(buildDraftItem(next.participants, next.payerId));
    setDraftFrozenParticipantIds({});
    setDraftAllocationMode("equal");
    setEditAllocationMode("equal");
    setEditFrozenParticipantIds({});
    setInvoiceFile(null);
    setInvoicePayerIds([]);
    clearDraftOverrides();
    setFriendPickerOpen(false);
    closeItemEditor();
    if (clearFeedback) {
      setFeedback(null);
    }
  }

  function startNewSplit() {
    resetSplit({ clearFeedback: true });
    setEditingSplitId("");
    setView("edit");
    setEditStep("setup");
    setFriendPickerOpen(false);
    setConfirmDeleteSplitId("");
    closeItemEditor();
  }

  function returnToList() {
    setView("list");
    setEditStep("setup");
    setEditingSplitId("");
    setFeedback(null);
    setFriendPickerOpen(false);
    setConfirmDeleteSplitId("");
    closeItemEditor();
  }

  function openFriendModal() {
    setFriendForm({ name: "", contact: "" });
    setFriendFeedback(null);
    setFriendModalOpen(true);
  }

  function closeFriendModal() {
    setFriendModalOpen(false);
    setFriendFeedback(null);
  }

  function updateFriendForm(patch) {
    setFriendForm((current) => ({ ...current, ...patch }));
  }

  async function reloadSplits({ showLoading = false } = {}) {
    if (showLoading) {
      setSplitsLoading(true);
    }
    try {
      const res = await fetch("/api/split-bills", { cache: "no-store" });
      if (!res.ok) {
        throw new Error();
      }
      const payload = await res.json();
      setSplits(payload.data || []);
      setSplitsError("");
    } catch (_error) {
      setSplits([]);
      setSplitsError("No se pudieron cargar las divisiones.");
    } finally {
      setSplitsLoading(false);
    }
  }

  async function saveFriendFromModal() {
    const name = friendForm.name.trim();
    const contact = friendForm.contact.trim();
    if (!name || !contact) {
      setFriendFeedback({
        type: "error",
        text: "Escribe el nombre y el correo o número telefónico.",
      });
      return;
    }

    const normalized = normalizeContact(contact);
    const existing = friends.find((item) => normalizeContact(item.contact) === normalized);
    if (existing) {
      setFriendFeedback({ type: "warn", text: "Ese amigo ya existe en tu lista." });
      return;
    }

    setFriendSaving(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact }),
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch (_error) {
        payload = null;
      }
      if (!res.ok) {
        setFriendFeedback({ type: "error", text: payload?.error || "No se pudo guardar el amigo." });
        return;
      }

      const friend = payload?.data;
      if (!friend) {
        setFriendFeedback({ type: "error", text: "No se pudo guardar el amigo." });
        return;
      }

      setFriends((current) => {
        const exists = current.some((item) => item.id === friend.id);
        if (exists) return current;
        return [friend, ...current];
      });
      if (payload?.existed) {
        setFeedback({ type: "warn", text: "Ese amigo ya estaba guardado." });
      }
      if (isItemsStep) {
        addParticipantRecord(createFriendParticipant(friend), { silent: true });
      }
      setFriendForm({ name: "", contact: "" });
      setFriendModalOpen(false);
      setFriendFeedback(null);
    } catch (_error) {
      setFriendFeedback({ type: "error", text: "No se pudo guardar el amigo." });
    } finally {
      setFriendSaving(false);
    }
  }

  async function createSplitSkeleton(trimmedTitle) {
    const payer = participants.find((item) => item.id === payerId) || participants[0];
    const payerType = payer?.type === "friend" ? "friend" : "user";
    const payerFriendId = payer?.type === "friend" ? payer.friendId : null;
    if (payerType === "friend" && !payerFriendId) {
      setFeedback({ type: "error", text: "Selecciona quién pagó la cuenta." });
      return null;
    }

    const participantFriendIds = participants
      .filter((item) => item.type === "friend" && item.friendId)
      .map((item) => item.friendId);

    setCreatingSplit(true);
    try {
      const res = await fetch("/api/split-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          currency,
          payerType,
          payerFriendId,
          participantFriendIds,
          items: [],
          settlements: [],
        }),
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch (_error) {
        payload = null;
      }
      if (!res.ok) {
        setFeedback({ type: "error", text: payload?.error || "No se pudo crear la división." });
        return null;
      }
      const saved = payload?.data;
      if (saved?.id) {
        setEditingSplitId(saved.id);
      }
      await reloadSplits();
      showToast(`Se creó la división ${trimmedTitle} correctamente`, "ok");
      return saved;
    } catch (_error) {
      setFeedback({ type: "error", text: "No se pudo crear la división." });
      return null;
    } finally {
      setCreatingSplit(false);
    }
  }

  async function continueToItems() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFeedback({ type: "error", text: "El título es obligatorio." });
      return;
    }
    if (trimmedTitle !== title) {
      setTitle(trimmedTitle);
    }
    if (participants.length <= 1) {
      setFeedback({
        type: "warn",
        text: "Para repartir la cuenta deberás tener a tus amigos agregados",
      });
    } else {
      setFeedback(null);
    }
    if (!editingSplitId) {
      const created = await createSplitSkeleton(trimmedTitle);
      if (!created) return;
      setItems([]);
      setSettlements([]);
    }
    setEditStep("items");
    setDraftItem(buildDraftItem(participants, payerId));
    clearDraftOverrides();
    setFriendPickerOpen(false);
  }

  function getStatusFromSummary(summaryForRecord) {
    if (!summaryForRecord) return { label: "Pendiente", tone: "neg" };
    if (summaryForRecord.validItems === 0 || summaryForRecord.totalCents <= 0 || summaryForRecord.invalidItems > 0) {
      return { label: "Pendiente", tone: "neg" };
    }
    if (summaryForRecord.settlements.length === 0) {
      return { label: "Listo", tone: "pos" };
    }
    return { label: "En reparto", tone: "" };
  }

  function getSplitStatus(record) {
    if (!record) return { label: "Pendiente", tone: "neg" };
    const recordParticipants = buildParticipantsFromFriendIds(
      record.participantFriendIds || [],
      friends,
      defaultPayerName,
    );
    const defaultPayerId = resolvePayerId(record);
    const recordItems = buildItemsFromStored(record.items, recordParticipants, defaultPayerId, record.currency);
    const recordSettlements = buildSettlementsFromStored(record.settlements, recordParticipants);
    const summaryForRecord = calculateSummary({
      participants: recordParticipants,
      items: recordItems,
      currency: record.currency,
      settlements: recordSettlements,
    });
    return getStatusFromSummary(summaryForRecord);
  }

  function openSplit(record) {
    if (!record) return;
    const nextParticipants = buildParticipantsFromFriendIds(
      record.participantFriendIds || [],
      friends,
      defaultPayerName,
    );
    const desiredPayerId = resolvePayerId(record);
    const nextItems = buildItemsFromStored(record.items, nextParticipants, desiredPayerId, record.currency);
    const payerIsValid = nextParticipants.some((person) => person.id === desiredPayerId);
    const nextPayerId = payerIsValid ? desiredPayerId : nextParticipants[0]?.id;

    setTitle(record.title || "");
    setCurrency(record.currency || "COP");
    setParticipants(nextParticipants);
    setItems(nextItems);
    setSettlements(buildSettlementsFromStored(record.settlements, nextParticipants));
    setPayerId(nextPayerId);
    setDraftItem(buildDraftItem(nextParticipants, nextPayerId));
    clearDraftOverrides();
    setEditingSplitId(record.id || "");
    setFeedback(null);
    setView("edit");
    setEditStep("items");
    setFriendPickerOpen(false);
    setConfirmDeleteSplitId("");
    closeItemEditor();
  }

  async function deleteSplit(record) {
    if (!record?.id) return;
    setConfirmDeleteSplitId("");
    setDeletingSplitId(record.id);
    try {
      const res = await fetch(`/api/split-bills/${record.id}`, { method: "DELETE" });
      if (!res.ok) {
        let payload = null;
        try {
          payload = await res.json();
        } catch (_error) {
          payload = null;
        }
        setFeedback({ type: "error", text: payload?.error || "No se pudo eliminar la división." });
        return;
      }
      await reloadSplits();
      if (editingSplitId === record.id) {
        returnToList();
      }
      setFeedback({ type: "ok", text: "División eliminada correctamente." });
    } catch (_error) {
      setFeedback({ type: "error", text: "No se pudo eliminar la división." });
    } finally {
      setDeletingSplitId("");
    }
  }

  function openBalanceModal(record) {
    if (!record) return;
    const recordParticipants = buildParticipantsFromFriendIds(
      record.participantFriendIds || [],
      friends,
      defaultPayerName,
    );
    const defaultPayerId = resolvePayerId(record);
    const recordItems = buildItemsFromStored(record.items, recordParticipants, defaultPayerId, record.currency);
    const recordSettlements = buildSettlementsFromStored(record.settlements, recordParticipants);
    const summaryForRecord = calculateSummary({
      participants: recordParticipants,
      items: recordItems,
      currency: record.currency,
      settlements: recordSettlements,
    });
    setBalanceRecord(record);
    setBalanceParticipants(recordParticipants);
    setBalanceSummary(summaryForRecord);
    setBalancePartialInputs({});
    setBalancePartialOpen({});
    setBalancePartialEditing({});
    setBalanceLineSelections({});
    setBalanceSettledLines([]);
    setBalanceError("");
    setBalanceModalOpen(true);
  }

  function closeBalanceModal() {
    setBalanceModalOpen(false);
    setBalanceRecord(null);
    setBalanceParticipants([]);
    setBalanceSummary(null);
    setBalancePartialInputs({});
    setBalancePartialOpen({});
    setBalancePartialEditing({});
    setBalanceLineSelections({});
    setBalanceSettledLines([]);
    setBalanceError("");
  }

  function updateBalancePartialInput(key, value) {
    const sanitized = normalizePositiveDecimalInput(value);
    setBalancePartialInputs((current) => ({ ...current, [key]: sanitized }));
    if (balanceError) {
      setBalanceError("");
    }
  }

  function setBalancePartialEditingState(key, isEditing) {
    setBalancePartialEditing((current) => ({ ...current, [key]: isEditing }));
  }

  async function persistBalanceSettlement(line, amountCents, { markSettled = false } = {}) {
    if (!balanceRecord || amountCents <= 0) return;
    setBalanceSaving(true);
    setBalanceError("");
    const newEntry = {
      id: createId("settlement"),
      fromId: toStoredParticipantId(line.fromId),
      toId: toStoredParticipantId(line.toId),
      amountCents,
      createdAt: new Date().toISOString(),
    };
    const nextStoredSettlements = [...(balanceRecord.settlements || []), newEntry];
    try {
      const res = await fetch(`/api/split-bills/${balanceRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: balanceRecord.title,
          currency: balanceRecord.currency,
          payerType: balanceRecord.payerType,
          payerFriendId: balanceRecord.payerFriendId,
          participantFriendIds: balanceRecord.participantFriendIds || [],
          items: balanceRecord.items || [],
          settlements: nextStoredSettlements,
        }),
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch (_error) {
        payload = null;
      }
      if (!res.ok) {
        setBalanceError(payload?.error || "No se pudo actualizar el balance.");
        return;
      }
      const saved = payload?.data;
      if (!saved) {
        setBalanceError("No se pudo actualizar el balance.");
        return;
      }

      setSplits((current) => current.map((item) => (item.id === saved.id ? saved : item)));

      const recordParticipants = buildParticipantsFromFriendIds(
        saved.participantFriendIds || [],
        friends,
        defaultPayerName,
      );
      const defaultPayerId = resolvePayerId(saved);
      const recordItems = buildItemsFromStored(saved.items, recordParticipants, defaultPayerId, saved.currency);
      const recordSettlements = buildSettlementsFromStored(saved.settlements, recordParticipants);
      const summaryForRecord = calculateSummary({
        participants: recordParticipants,
        items: recordItems,
        currency: saved.currency,
        settlements: recordSettlements,
      });

      if (markSettled) {
        setBalanceSettledLines((current) => {
          const key = `${line.fromId}-${line.toId}`;
          const filtered = current.filter((entry) => entry.key !== key);
          return [
            ...filtered,
            {
              key,
              settlementId: newEntry.id,
              fromId: line.fromId,
              toId: line.toId,
              amountCents,
            },
          ];
        });
      }

      setBalanceRecord(saved);
      setBalanceParticipants(recordParticipants);
      setBalanceSummary(summaryForRecord);

      if (editingSplitId === saved.id) {
        setSettlements(recordSettlements);
      }
    } catch (_error) {
      setBalanceError("No se pudo actualizar el balance.");
    } finally {
      setBalanceSaving(false);
    }
  }

  async function undoBalanceSettlement(line) {
    if (!balanceRecord || !line) return;
    setBalanceSaving(true);
    setBalanceError("");
    const currentSettlements = balanceRecord.settlements || [];
    let nextSettlements = currentSettlements.filter((entry) => entry?.id !== line.id);
    if (nextSettlements.length === currentSettlements.length) {
      const storedFromId = toStoredParticipantId(line.fromId);
      const storedToId = toStoredParticipantId(line.toId);
      const lineAmount = Math.max(0, Math.round(Number(line.amountCents) || 0));
      const lineCreatedAt = line.createdAt ? String(line.createdAt) : "";
      let removed = false;
      nextSettlements = currentSettlements.filter((entry) => {
        if (removed) return true;
        const entryAmount = Math.max(0, Math.round(Number(entry?.amountCents) || 0));
        const entryCreatedAt = entry?.createdAt ? String(entry.createdAt) : "";
        const matches =
          String(entry?.fromId || "") === storedFromId &&
          String(entry?.toId || "") === storedToId &&
          entryAmount === lineAmount &&
          (!lineCreatedAt || entryCreatedAt === lineCreatedAt);
        if (matches) {
          removed = true;
          return false;
        }
        return true;
      });
    }
    try {
      const res = await fetch(`/api/split-bills/${balanceRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: balanceRecord.title,
          currency: balanceRecord.currency,
          payerType: balanceRecord.payerType,
          payerFriendId: balanceRecord.payerFriendId,
          participantFriendIds: balanceRecord.participantFriendIds || [],
          items: balanceRecord.items || [],
          settlements: nextSettlements,
        }),
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch (_error) {
        payload = null;
      }
      if (!res.ok) {
        setBalanceError(payload?.error || "No se pudo actualizar el balance.");
        return;
      }
      const saved = payload?.data;
      if (!saved) {
        setBalanceError("No se pudo actualizar el balance.");
        return;
      }

      setSplits((current) => current.map((item) => (item.id === saved.id ? saved : item)));

      const recordParticipants = buildParticipantsFromFriendIds(
        saved.participantFriendIds || [],
        friends,
        defaultPayerName,
      );
      const defaultPayerId = resolvePayerId(saved);
      const recordItems = buildItemsFromStored(saved.items, recordParticipants, defaultPayerId, saved.currency);
      const recordSettlements = buildSettlementsFromStored(saved.settlements, recordParticipants);
      const summaryForRecord = calculateSummary({
        participants: recordParticipants,
        items: recordItems,
        currency: saved.currency,
        settlements: recordSettlements,
      });

      setBalanceRecord(saved);
      setBalanceParticipants(recordParticipants);
      setBalanceSummary(summaryForRecord);
      setBalanceSettledLines((current) => current.filter((entry) => entry.settlementId !== line.id));

      if (editingSplitId === saved.id) {
        setSettlements(recordSettlements);
      }
    } catch (_error) {
      setBalanceError("No se pudo actualizar el balance.");
    } finally {
      setBalanceSaving(false);
    }
  }

  function addParticipantRecord(person, { silent = false } = {}) {
    if (!person) return;
    const incomingContact = normalizeContact(person.contact);
    const exists = participants.some(
      (item) =>
        item.id === person.id ||
        (incomingContact && normalizeContact(item.contact) === incomingContact),
    );
    if (exists) {
      if (!silent) {
        setFeedback({ type: "warn", text: "Este amigo ya está en la división." });
      }
      return;
    }

    setParticipants((current) => [...current, person]);
    setDraftItem((current) => {
      const nextParticipantIds = [...new Set([...(current.participantIds || []), person.id])];
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = normalizeAllocationMap({}, nextParticipantIds, totalCents);
      return {
        ...current,
        participantIds: nextParticipantIds,
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });
    if (!silent) {
      setFeedback(null);
    }
  }

  function addFriendToParticipants(friend) {
    if (!friend) return;
    const person = createFriendParticipant(friend);
    addParticipantRecord(person);
  }

  function addExistingFriendToItem(friend, { target = "draft" } = {}) {
    if (!friend) return;
    const person = createFriendParticipant(friend);
    addParticipantRecord(person, { silent: true });
    if (target === "edit") {
      setEditingItem((current) => {
        if (!current) return current;
        const nextParticipantIds = [...new Set([...(current.participantIds || []), person.id])];
        const totalCents = amountToCents(current.amount, currency);
        const allocationMap = normalizeAllocationMap({}, nextParticipantIds, totalCents);
        return {
          ...current,
          participantIds: nextParticipantIds,
          allocations: mapToAllocations(allocationMap, nextParticipantIds),
        };
      });
    }
  }

  function toggleFriendSelection(friend) {
    if (!friend) return;
    const participantId = `friend-${friend.id}`;
    const isSelected = participants.some((item) => item.id === participantId);
    if (isSelected) {
      removeParticipant(participantId);
    } else {
      addFriendToParticipants(friend);
    }
  }

  function removeParticipant(participantId) {
    const target = participants.find((item) => item.id === participantId);
    if (!target || target.type === "user") {
      return;
    }
    if (participants.length <= 1) {
      setFeedback({ type: "error", text: "Debes mantener al menos 1 participante." });
      return;
    }

    clearAllocationOverride(participantId);
    clearPercentOverride(participantId);
    clearPayerAllocationOverride(participantId);
    clearPayerPercentOverride(participantId);

    const nextParticipants = participants.filter((item) => item.id !== participantId);
    if (!nextParticipants.length) return;

    setParticipants(nextParticipants);
    setDraftItem((current) => {
      const rawParticipantIds = (current.participantIds || []).filter((id) => id !== participantId);
      const nextParticipantIds = rawParticipantIds.length ? rawParticipantIds : nextParticipants.map((p) => p.id);
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = normalizeAllocationMap(
        allocationsToMap(current.allocations, nextParticipantIds),
        nextParticipantIds,
        totalCents,
      );
      const filteredPayerIds = getRawPayerIds(current).filter((id) =>
        nextParticipantIds.includes(id),
      );
      const nextPayerIds = filteredPayerIds.length ? filteredPayerIds : [nextParticipantIds[0] || "user"];
      const nextPayerId = nextPayerIds[0];
      const nextPayerMode = nextPayerIds.length > 1 ? current.payerMode || "equal" : "equal";
      const nextPayerMap = normalizeAllocationMap(
        allocationsToMap(current.payerAllocations, nextPayerIds),
        nextPayerIds,
        totalCents,
      );
      return {
        ...current,
        participantIds: nextParticipantIds,
        payerId: nextPayerId,
        payerIds: nextPayerIds,
        payerMode: nextPayerMode,
        payerAllocations: mapToAllocations(nextPayerMap, nextPayerIds),
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });

    if (payerId === participantId) {
      setPayerId(nextParticipants[0].id);
    }
    setFeedback(null);
  }

  function removeParticipantFromItem(item, participantId, fallbackParticipantIds) {
    const nextIds = (item.participantIds || []).filter((id) => id !== participantId);
    const nextParticipantIds = nextIds.length ? nextIds : fallbackParticipantIds;
    const totalCents = amountToCents(item.amount, currency);
    const allocationMap = normalizeAllocationMap(
      allocationsToMap(item.allocations, nextParticipantIds),
      nextParticipantIds,
      totalCents,
    );
    const filteredPayerIds = getRawPayerIds(item).filter((id) => nextParticipantIds.includes(id));
    const nextPayerIds = filteredPayerIds.length ? filteredPayerIds : [nextParticipantIds[0] || "user"];
    const nextPayerId = nextPayerIds[0];
    const nextPayerMode = nextPayerIds.length > 1 ? item.payerMode || "equal" : "equal";
    const nextPayerMap = normalizeAllocationMap(
      allocationsToMap(item.payerAllocations, nextPayerIds),
      nextPayerIds,
      totalCents,
    );
    return {
      ...item,
      participantIds: nextParticipantIds,
      payerId: nextPayerId,
      payerIds: nextPayerIds,
      payerMode: nextPayerMode,
      payerAllocations: mapToAllocations(nextPayerMap, nextPayerIds),
      allocations: mapToAllocations(allocationMap, nextParticipantIds),
    };
  }

  async function removeParticipantFromDivision(participantId) {
    const target = participants.find((item) => item.id === participantId);
    if (!target || target.type === "user") return;
    if (participants.length <= 1) {
      setFeedback({ type: "error", text: "Debes mantener al menos 1 participante." });
      return;
    }
    const nextParticipants = participants.filter((item) => item.id !== participantId);
    if (!nextParticipants.length) return;
    const fallbackParticipantIds = nextParticipants.map((person) => person.id);
    const nextItems = items.map((item) =>
      item.participantIds?.includes(participantId) || getRawPayerIds(item).includes(participantId)
        ? removeParticipantFromItem(item, participantId, fallbackParticipantIds)
        : item,
    );
    const nextSettlements = settlements.filter(
      (entry) => entry.fromId !== participantId && entry.toId !== participantId,
    );
    const nextPayerId = payerId === participantId ? fallbackParticipantIds[0] : payerId;

    clearAllocationOverride(participantId);
    clearPercentOverride(participantId);
    clearPayerAllocationOverride(participantId);
    clearPayerPercentOverride(participantId);
    clearDraftFreeze(participantId);
    clearEditAllocationOverride(participantId);
    clearEditPercentOverride(participantId);
    clearEditPayerAllocationOverride(participantId);
    clearEditPayerPercentOverride(participantId);
    clearEditFreeze(participantId);

    setParticipants(nextParticipants);
    setItems(nextItems);
    setSettlements(nextSettlements);
    setPayerId(nextPayerId);
    setDraftItem((current) => {
      const rawParticipantIds = (current.participantIds || []).filter((id) => id !== participantId);
      const nextParticipantIds = rawParticipantIds.length ? rawParticipantIds : fallbackParticipantIds;
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = buildAllocationMapForMode({
        currentAllocations: current.allocations,
        participantIds: nextParticipantIds,
        totalCents,
        mode: "equal",
        frozenMap: draftFrozenParticipantIds,
      });
      const filteredPayerIds = getRawPayerIds(current).filter((id) => nextParticipantIds.includes(id));
      const nextPayerIds = filteredPayerIds.length ? filteredPayerIds : [nextParticipantIds[0] || "user"];
      const nextDraftPayerId = nextPayerIds[0];
      const nextPayerMode = nextPayerIds.length > 1 ? current.payerMode || "equal" : "equal";
      const nextPayerMap = normalizeAllocationMap(
        allocationsToMap(current.payerAllocations, nextPayerIds),
        nextPayerIds,
        totalCents,
      );
      return {
        ...current,
        participantIds: nextParticipantIds,
        payerId: nextDraftPayerId,
        payerIds: nextPayerIds,
        payerMode: nextPayerMode,
        payerAllocations: mapToAllocations(nextPayerMap, nextPayerIds),
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });
    setEditingItem((current) => {
      if (!current) return current;
      if (
        !(current.participantIds || []).includes(participantId) &&
        !getRawPayerIds(current).includes(participantId)
      ) {
        return current;
      }
      return removeParticipantFromItem(current, participantId, fallbackParticipantIds);
    });

    const saved = await persistSplit(nextItems, {
      allowEmpty: true,
      nextParticipants,
      nextPayerId,
      nextSettlements,
    });
    if (!saved) return;
    setFeedback({ type: "ok", text: "Participante eliminado de la división." });
  }

  function resetDraftItem(nextParticipants = participants, fallbackPayerId = payerId) {
    setDraftItem(buildDraftItem(nextParticipants, fallbackPayerId));
    setDraftFrozenParticipantIds({});
    setDraftAllocationMode("equal");
    clearDraftOverrides();
  }

  function resetDraftItemKeepingPayers(nextParticipants, nextPayerIds, nextPayerMode) {
    const participantIds = nextParticipants.map((person) => person.id);
    const base = buildDraftItem(nextParticipants, nextPayerIds[0] || payerId);
    const normalizedPayerIds = normalizePayerIds(
      { payerIds: nextPayerIds },
      participantIds,
      base.payerId,
    );
    const normalizedMode =
      nextPayerMode === "manual" && normalizedPayerIds.length > 1 ? "manual" : "equal";
    const payerAllocations =
      normalizedMode === "manual"
        ? mapToAllocations(buildEqualAllocations(normalizedPayerIds, 0), normalizedPayerIds)
        : [];
    setDraftItem({
      ...base,
      payerId: normalizedPayerIds[0] || base.payerId,
      payerIds: normalizedPayerIds,
      payerMode: normalizedMode,
      payerAllocations,
    });
    setDraftFrozenParticipantIds({});
    setDraftAllocationMode("equal");
    clearDraftOverrides();
  }

  function setAllocationOverride(participantId, value) {
    setAllocationInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearAllocationOverride(participantId) {
    setAllocationInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setPercentOverride(participantId, value) {
    setPercentInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearPercentOverride(participantId) {
    setPercentInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setPayerAllocationOverride(participantId, value) {
    setPayerAllocationInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearPayerAllocationOverride(participantId) {
    setPayerAllocationInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setPayerPercentOverride(participantId, value) {
    setPayerPercentInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearPayerPercentOverride(participantId) {
    setPayerPercentInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function toggleDraftFreeze(participantId) {
    setDraftFrozenParticipantIds((current) => {
      const next = { ...current };
      if (next[participantId]) {
        delete next[participantId];
      } else {
        next[participantId] = true;
      }
      return next;
    });
  }

  function clearDraftFreeze(participantId) {
    setDraftFrozenParticipantIds((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setEditAllocationOverride(participantId, value) {
    setEditAllocationInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearEditAllocationOverride(participantId) {
    setEditAllocationInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setEditPercentOverride(participantId, value) {
    setEditPercentInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearEditPercentOverride(participantId) {
    setEditPercentInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setEditPayerAllocationOverride(participantId, value) {
    setEditPayerAllocationInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearEditPayerAllocationOverride(participantId) {
    setEditPayerAllocationInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function setEditPayerPercentOverride(participantId, value) {
    setEditPayerPercentInputOverrides((current) => ({ ...current, [participantId]: value }));
  }

  function clearEditPayerPercentOverride(participantId) {
    setEditPayerPercentInputOverrides((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function toggleEditFreeze(participantId) {
    setEditFrozenParticipantIds((current) => {
      const next = { ...current };
      if (next[participantId]) {
        delete next[participantId];
      } else {
        next[participantId] = true;
      }
      return next;
    });
  }

  function clearEditFreeze(participantId) {
    setEditFrozenParticipantIds((current) => {
      if (!(participantId in current)) return current;
      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }

  function toggleInvoicePayer(participantId) {
    setInvoicePayerIds((current) => {
      const exists = current.includes(participantId);
      if (exists) {
        return current.filter((id) => id !== participantId);
      }
      return [...current, participantId];
    });
  }

  function handleInvoiceChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setInvoiceFile(null);
      setInvoicePayerIds([]);
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setFeedback({ type: "error", text: "La factura debe ser una imagen o PDF." });
      if (invoiceInputRef.current) {
        invoiceInputRef.current.value = "";
      }
      setInvoiceFile(null);
      setInvoicePayerIds([]);
      return;
    }
    setInvoiceFile(file);
    setInvoicePayerIds([]);
  }

  function clearInvoiceFile() {
    setInvoiceFile(null);
    setInvoicePayerIds([]);
    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = "";
    }
  }

  function openBalanceDetail(participantId) {
    setBalanceDetailParticipantId(participantId);
  }

  function closeBalanceDetail() {
    setBalanceDetailParticipantId("");
  }

  function updateBalanceLineSelection(lineKey, toId) {
    setBalanceLineSelections((current) => ({ ...current, [lineKey]: toId }));
    setBalancePartialInputs({});
    setBalancePartialOpen({});
    setBalancePartialEditing({});
    setBalanceSettledLines([]);
  }

  function exportSplitItemsCsv() {
    if (!items.length) return;
    const header = ["Ítem", "Valor", "Participantes"];
    const rows = items.map((item) => {
      const amountCents = amountToCents(item.amount, currency);
      const amountLabel = formatAmountInputFromCents(amountCents, currency);
      const participantsLabel = getItemParticipantsLabel(item, participants);
      const description = item.description?.trim() || "Ítem sin descripción";
      return [description, amountLabel, participantsLabel];
    });
    const escapeValue = (value) => `"${String(value ?? "").replace(/\"/g, "\"\"")}"`;
    const csvRows = [header, ...rows].map((row) => row.map(escapeValue).join(";"));
    const csvContent = `\ufeff${csvRows.join("\n")}`;
    const baseName = (title || "division").trim() || "division";
    const safeName = baseName.toLowerCase().replace(/[^\w\d]+/g, "-").replace(/^-+|-+$/g, "");
    const filename = `${safeName || "division"}-items.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportBalanceCsv() {
    if (!items.length) return;
    const header = ["Participante", "Ítem", "Valor asignado", "Total ítem"];
    const rows = [];
    participants.forEach((person) => {
      const breakdown = buildParticipantBreakdown({
        participantId: person.id,
        participants,
        items,
        currency,
      });
      if (!breakdown || breakdown.items.length === 0) {
        rows.push([person.name, "Sin ítems", "0,00", ""]);
        return;
      }
      breakdown.items.forEach((entry) => {
        rows.push([
          person.name,
          entry.description,
          formatAmountInputFromCents(entry.owedCents, currency),
          formatAmountInputFromCents(entry.totalCents, currency),
        ]);
      });
    });
    const escapeValue = (value) => `"${String(value ?? "").replace(/\"/g, "\"\"")}"`;
    const csvRows = [header, ...rows].map((row) => row.map(escapeValue).join(";"));
    const csvContent = `\ufeff${csvRows.join("\n")}`;
    const baseName = (title || "division").trim() || "division";
    const safeName = baseName.toLowerCase().replace(/[^\w\d]+/g, "-").replace(/^-+|-+$/g, "");
    const filename = `${safeName || "division"}-balance.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }


  function updateDraftItem(patch) {
    setDraftItem((current) => ({ ...current, ...patch }));
  }

  function updateDraftAmount(nextAmount) {
    const sanitizedAmount = normalizePositiveDecimalInput(nextAmount);
    setDraftItem((current) => {
      const participantIds = current.participantIds || [];
      const prevTotalCents = amountToCents(current.amount, currency);
      const nextTotalCents = amountToCents(sanitizedAmount, currency);
      let nextMap = {};
      if (participantIds.length) {
        const keepManual =
          draftAllocationMode === "manual" || Object.keys(draftFrozenParticipantIds).length > 0;
        if (!keepManual) {
          nextMap = normalizeAllocationMap({}, participantIds, nextTotalCents);
        } else if (prevTotalCents > 0) {
          const prevMap = getAllocationMapForItem(current, participantIds, prevTotalCents);
          participantIds.forEach((id) => {
            const percent = prevMap[id] / prevTotalCents;
            nextMap[id] = Math.round(nextTotalCents * percent);
          });
        }
        if (Object.keys(nextMap).length === 0) {
          nextMap = normalizeAllocationMap(nextMap, participantIds, nextTotalCents);
        }
      }
      const payerIds = normalizePayerIds(current, participants.map((person) => person.id));
      let nextPayerMap = {};
      if (payerIds.length) {
        if (prevTotalCents > 0) {
          const prevPayerMap = getPayerAllocationMapForItem(current, payerIds, prevTotalCents);
          payerIds.forEach((id) => {
            const percent = prevPayerMap[id] / prevTotalCents;
            nextPayerMap[id] = Math.round(nextTotalCents * percent);
          });
        }
        nextPayerMap = normalizeAllocationMap(nextPayerMap, payerIds, nextTotalCents);
      }
      return {
        ...current,
        amount: sanitizedAmount,
        allocations: mapToAllocations(nextMap, participantIds),
        payerAllocations: mapToAllocations(nextPayerMap, payerIds),
      };
    });
  }

  function toggleDraftPayer(participantId) {
    setDraftItem((current) => {
      const currentIds = getRawPayerIds(current);
      const exists = currentIds.includes(participantId);
      const nextIds = exists
        ? currentIds.filter((id) => id !== participantId)
        : [...currentIds, participantId];
      if (nextIds.length === 0) {
        return current;
      }
      const nextMode = nextIds.length > 1 ? (current.payerMode === "manual" ? "manual" : "equal") : "equal";
      const totalCents = amountToCents(current.amount, currency);
      const nextPayerMap = normalizeAllocationMap(
        allocationsToMap(current.payerAllocations, nextIds),
        nextIds,
        totalCents,
      );
      return {
        ...current,
        payerIds: nextIds,
        payerId: nextIds[0],
        payerMode: nextMode,
        payerAllocations: mapToAllocations(nextPayerMap, nextIds),
      };
    });
  }

  function toggleDraftPayerMode() {
    setDraftItem((current) => {
      const payerIds = getRawPayerIds(current);
      if (payerIds.length <= 1) return current;
      const nextMode = current.payerMode === "manual" ? "equal" : "manual";
      const totalCents = amountToCents(current.amount, currency);
      const nextPayerMap =
        nextMode === "manual"
          ? getPayerAllocationMapForItem(current, payerIds, totalCents)
          : buildEqualAllocations(payerIds, totalCents);
      return {
        ...current,
        payerMode: nextMode,
        payerAllocations: mapToAllocations(nextPayerMap, payerIds),
      };
    });
    setPayerAllocationInputOverrides({});
    setPayerPercentInputOverrides({});
  }

  function toggleDraftParticipant(participantId) {
    setDraftItem((current) => {
      const exists = (current.participantIds || []).includes(participantId);
      if (exists) {
        clearAllocationOverride(participantId);
        clearPercentOverride(participantId);
        clearDraftFreeze(participantId);
        const nextParticipantIds = current.participantIds.filter((id) => id !== participantId);
        const totalCents = amountToCents(current.amount, currency);
        const allocationMap = buildAllocationMapForMode({
          currentAllocations: current.allocations,
          participantIds: nextParticipantIds,
          totalCents,
          mode: "equal",
          frozenMap: draftFrozenParticipantIds,
        });
        return {
          ...current,
          participantIds: nextParticipantIds,
          allocations: mapToAllocations(allocationMap, nextParticipantIds),
        };
      }
      const nextParticipantIds = [...(current.participantIds || []), participantId];
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = buildAllocationMapForMode({
        currentAllocations: current.allocations,
        participantIds: nextParticipantIds,
        totalCents,
        mode: "equal",
        frozenMap: draftFrozenParticipantIds,
      });
      return {
        ...current,
        participantIds: nextParticipantIds,
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });
    setDraftAllocationMode("equal");
  }

  function assignAllParticipantsToDraft() {
    setDraftItem((current) => {
      const nextParticipantIds = participants.map((person) => person.id);
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = normalizeAllocationMap({}, nextParticipantIds, totalCents);
      return {
        ...current,
        participantIds: nextParticipantIds,
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });
    setDraftAllocationMode("equal");
  }

  function toggleAllParticipantsInDraft() {
    const allSelected =
      participants.length > 0 &&
      participants.every((person) => (draftItem.participantIds || []).includes(person.id));
    if (allSelected) {
      setDraftItem((current) => ({
        ...current,
        participantIds: [],
        allocations: [],
      }));
      setAllocationInputOverrides({});
      setPercentInputOverrides({});
      setDraftFrozenParticipantIds({});
      setDraftAllocationMode("equal");
      return;
    }
    assignAllParticipantsToDraft();
  }

  function toggleAllParticipantsInEdit() {
    if (!editingItem) return;
    const allSelected =
      participants.length > 0 &&
      participants.every((person) => (editingItem.participantIds || []).includes(person.id));
    if (allSelected) {
      setEditingItem((current) =>
        current
          ? {
              ...current,
              participantIds: [],
              allocations: [],
            }
          : current,
      );
      setEditAllocationInputOverrides({});
      setEditPercentInputOverrides({});
      setEditFrozenParticipantIds({});
      setEditAllocationMode("equal");
      return;
    }
    assignAllParticipantsToEdit();
  }

  function updateDraftAllocationValue(participantId, nextValue) {
    setDraftAllocationMode("manual");
    setDraftItem((current) => {
      const participantIds = current.participantIds || [];
      const totalCents = amountToCents(current.amount, currency);
      if (!participantIds.includes(participantId)) return current;
      const nextCents = clampValue(amountToCents(nextValue, currency), 0, totalCents);
      const allocationMap = getAllocationMapForItem(current, participantIds, totalCents);
      const nextMap = redistributeValueWithFrozen({
        participantIds,
        allocationMap,
        totalCents,
        editedId: participantId,
        nextCents,
        frozenMap: draftFrozenParticipantIds,
      });
      return {
        ...current,
        allocations: mapToAllocations(nextMap, participantIds),
      };
    });
  }

  function updateDraftPayerAllocationValue(participantId, nextValue) {
    setDraftItem((current) => {
      const payerIds = getRawPayerIds(current);
      const totalCents = amountToCents(current.amount, currency);
      if (!payerIds.includes(participantId)) return current;
      const nextCents = clampValue(amountToCents(nextValue, currency), 0, totalCents);
      const allocationMap = getPayerAllocationMapForItem(current, payerIds, totalCents);
      allocationMap[participantId] = nextCents;
      const remainder = totalCents - nextCents;
      const others = payerIds.filter((id) => id !== participantId);
      const shares = splitEvenly(remainder, others.length);
      others.forEach((id, index) => {
        allocationMap[id] = shares[index] || 0;
      });
      const normalizedMap = normalizeAllocationMap(allocationMap, payerIds, totalCents);
      return {
        ...current,
        payerMode: "manual",
        payerAllocations: mapToAllocations(normalizedMap, payerIds),
      };
    });
  }

  function updateDraftPayerAllocationPercent(participantId, index, orderedIds, nextValue) {
    setDraftItem((current) => {
      const payerIds = orderedIds.length ? orderedIds : getRawPayerIds(current);
      const totalCents = amountToCents(current.amount, currency);
      if (!payerIds.includes(participantId)) return current;
      const percentValue = clampValue(parseNumericInput(nextValue), 0, 100);
      const allocationMap = getPayerAllocationMapForItem(current, payerIds, totalCents);
      const nextMap = redistributeFromIndex({
        orderedIds: payerIds,
        allocationMap,
        totalCents,
        index,
        nextPercent: percentValue,
      });
      return {
        ...current,
        payerMode: "manual",
        payerAllocations: mapToAllocations(nextMap, payerIds),
      };
    });
  }

  function updateDraftAllocationPercent(participantId, index, orderedIds, nextValue) {
    setDraftAllocationMode("manual");
    setDraftItem((current) => {
      const participantIds = orderedIds.length ? orderedIds : current.participantIds || [];
      const totalCents = amountToCents(current.amount, currency);
      if (!participantIds.includes(participantId)) return current;
      const percentValue = clampValue(parseNumericInput(nextValue), 0, 100);
      const allocationMap = getAllocationMapForItem(current, participantIds, totalCents);
      const nextMap = redistributePercentWithFrozen({
        orderedIds: participantIds,
        allocationMap,
        totalCents,
        index,
        nextPercent: percentValue,
        frozenMap: draftFrozenParticipantIds,
      });
      return {
        ...current,
        allocations: mapToAllocations(nextMap, participantIds),
      };
    });
  }

  function openItemEditor(item, index) {
    if (!item) return;
    setEditFrozenParticipantIds({});
    const participantIds = item.participantIds || [];
    const totalCents = amountToCents(item.amount, currency);
    const allocationMap = getAllocationMapForItem(item, participantIds, totalCents);
    setEditAllocationMode(isEqualAllocation(allocationMap, participantIds, totalCents) ? "equal" : "manual");
    setEditingItem({
      ...item,
      participantIds: item.participantIds || [],
      allocations: item.allocations || [],
    });
    setEditingItemIndex(index);
    setItemModalOpen(true);
    setFriendPickerOpen(false);
    setConfirmDeleteItem(false);
    clearEditOverrides();
  }

  function closeItemEditor() {
    setItemModalOpen(false);
    setEditingItem(null);
    setEditingItemIndex(-1);
    setConfirmDeleteItem(false);
    setEditFrozenParticipantIds({});
    setEditAllocationMode("equal");
    clearEditOverrides();
  }

  function updateEditingItem(patch) {
    setEditingItem((current) => (current ? { ...current, ...patch } : current));
  }

  function updateEditingAmount(nextAmount) {
    const sanitizedAmount = normalizePositiveDecimalInput(nextAmount);
    setEditingItem((current) => {
      if (!current) return current;
      const participantIds = current.participantIds || [];
      const prevTotalCents = amountToCents(current.amount, currency);
      const nextTotalCents = amountToCents(sanitizedAmount, currency);
      let nextMap = {};
      if (participantIds.length) {
        const keepManual =
          editAllocationMode === "manual" || Object.keys(editFrozenParticipantIds).length > 0;
        if (!keepManual) {
          nextMap = normalizeAllocationMap({}, participantIds, nextTotalCents);
        } else if (prevTotalCents > 0) {
          const prevMap = getAllocationMapForItem(current, participantIds, prevTotalCents);
          participantIds.forEach((id) => {
            const percent = prevMap[id] / prevTotalCents;
            nextMap[id] = Math.round(nextTotalCents * percent);
          });
        }
        if (Object.keys(nextMap).length === 0) {
          nextMap = normalizeAllocationMap(nextMap, participantIds, nextTotalCents);
        }
      }
      const payerIds = normalizePayerIds(current, participants.map((person) => person.id));
      let nextPayerMap = {};
      if (payerIds.length) {
        if (prevTotalCents > 0) {
          const prevPayerMap = getPayerAllocationMapForItem(current, payerIds, prevTotalCents);
          payerIds.forEach((id) => {
            const percent = prevPayerMap[id] / prevTotalCents;
            nextPayerMap[id] = Math.round(nextTotalCents * percent);
          });
        }
        nextPayerMap = normalizeAllocationMap(nextPayerMap, payerIds, nextTotalCents);
      }
      return {
        ...current,
        amount: sanitizedAmount,
        allocations: mapToAllocations(nextMap, participantIds),
        payerAllocations: mapToAllocations(nextPayerMap, payerIds),
      };
    });
  }

  function toggleEditingPayer(participantId) {
    setEditingItem((current) => {
      if (!current) return current;
      const currentIds = getRawPayerIds(current);
      const exists = currentIds.includes(participantId);
      const nextIds = exists
        ? currentIds.filter((id) => id !== participantId)
        : [...currentIds, participantId];
      if (nextIds.length === 0) {
        return current;
      }
      const nextMode = nextIds.length > 1 ? (current.payerMode === "manual" ? "manual" : "equal") : "equal";
      const totalCents = amountToCents(current.amount, currency);
      const nextPayerMap = normalizeAllocationMap(
        allocationsToMap(current.payerAllocations, nextIds),
        nextIds,
        totalCents,
      );
      return {
        ...current,
        payerIds: nextIds,
        payerId: nextIds[0],
        payerMode: nextMode,
        payerAllocations: mapToAllocations(nextPayerMap, nextIds),
      };
    });
  }

  function toggleEditingPayerMode() {
    setEditingItem((current) => {
      if (!current) return current;
      const payerIds = getRawPayerIds(current);
      if (payerIds.length <= 1) return current;
      const nextMode = current.payerMode === "manual" ? "equal" : "manual";
      const totalCents = amountToCents(current.amount, currency);
      const nextPayerMap =
        nextMode === "manual"
          ? getPayerAllocationMapForItem(current, payerIds, totalCents)
          : buildEqualAllocations(payerIds, totalCents);
      return {
        ...current,
        payerMode: nextMode,
        payerAllocations: mapToAllocations(nextPayerMap, payerIds),
      };
    });
    setEditPayerAllocationInputOverrides({});
    setEditPayerPercentInputOverrides({});
  }

  function toggleEditingParticipant(participantId) {
    setEditingItem((current) => {
      if (!current) return current;
      const exists = (current.participantIds || []).includes(participantId);
      if (exists) {
        clearEditAllocationOverride(participantId);
        clearEditPercentOverride(participantId);
        clearEditFreeze(participantId);
        const nextParticipantIds = current.participantIds.filter((id) => id !== participantId);
        const totalCents = amountToCents(current.amount, currency);
        const allocationMap = buildAllocationMapForMode({
          currentAllocations: current.allocations,
          participantIds: nextParticipantIds,
          totalCents,
          mode: "equal",
          frozenMap: editFrozenParticipantIds,
        });
        return {
          ...current,
          participantIds: nextParticipantIds,
          allocations: mapToAllocations(allocationMap, nextParticipantIds),
        };
      }
      const nextParticipantIds = [...(current.participantIds || []), participantId];
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = buildAllocationMapForMode({
        currentAllocations: current.allocations,
        participantIds: nextParticipantIds,
        totalCents,
        mode: "equal",
        frozenMap: editFrozenParticipantIds,
      });
      return {
        ...current,
        participantIds: nextParticipantIds,
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });
    setEditAllocationMode("equal");
  }

  function assignAllParticipantsToEdit() {
    setEditingItem((current) => {
      if (!current) return current;
      const nextParticipantIds = participants.map((person) => person.id);
      const totalCents = amountToCents(current.amount, currency);
      const allocationMap = normalizeAllocationMap({}, nextParticipantIds, totalCents);
      return {
        ...current,
        participantIds: nextParticipantIds,
        allocations: mapToAllocations(allocationMap, nextParticipantIds),
      };
    });
    setEditAllocationMode("equal");
  }

  function updateEditingAllocationValue(participantId, nextValue) {
    setEditAllocationMode("manual");
    setEditingItem((current) => {
      if (!current) return current;
      const participantIds = current.participantIds || [];
      const totalCents = amountToCents(current.amount, currency);
      if (!participantIds.includes(participantId)) return current;
      const nextCents = clampValue(amountToCents(nextValue, currency), 0, totalCents);
      const allocationMap = getAllocationMapForItem(current, participantIds, totalCents);
      const nextMap = redistributeValueWithFrozen({
        participantIds,
        allocationMap,
        totalCents,
        editedId: participantId,
        nextCents,
        frozenMap: editFrozenParticipantIds,
      });
      return {
        ...current,
        allocations: mapToAllocations(nextMap, participantIds),
      };
    });
  }

  function updateEditingAllocationPercent(participantId, index, orderedIds, nextValue) {
    setEditAllocationMode("manual");
    setEditingItem((current) => {
      if (!current) return current;
      const participantIds = orderedIds.length ? orderedIds : current.participantIds || [];
      const totalCents = amountToCents(current.amount, currency);
      if (!participantIds.includes(participantId)) return current;
      const percentValue = clampValue(parseNumericInput(nextValue), 0, 100);
      const allocationMap = getAllocationMapForItem(current, participantIds, totalCents);
      const nextMap = redistributePercentWithFrozen({
        orderedIds: participantIds,
        allocationMap,
        totalCents,
        index,
        nextPercent: percentValue,
        frozenMap: editFrozenParticipantIds,
      });
      return {
        ...current,
        allocations: mapToAllocations(nextMap, participantIds),
      };
    });
  }

  function updateEditingPayerAllocationValue(participantId, nextValue) {
    setEditingItem((current) => {
      if (!current) return current;
      const payerIds = getRawPayerIds(current);
      const totalCents = amountToCents(current.amount, currency);
      if (!payerIds.includes(participantId)) return current;
      const nextCents = clampValue(amountToCents(nextValue, currency), 0, totalCents);
      const allocationMap = getPayerAllocationMapForItem(current, payerIds, totalCents);
      allocationMap[participantId] = nextCents;
      const remainder = totalCents - nextCents;
      const others = payerIds.filter((id) => id !== participantId);
      const shares = splitEvenly(remainder, others.length);
      others.forEach((id, index) => {
        allocationMap[id] = shares[index] || 0;
      });
      const normalizedMap = normalizeAllocationMap(allocationMap, payerIds, totalCents);
      return {
        ...current,
        payerMode: "manual",
        payerAllocations: mapToAllocations(normalizedMap, payerIds),
      };
    });
  }

  function updateEditingPayerAllocationPercent(participantId, index, orderedIds, nextValue) {
    setEditingItem((current) => {
      if (!current) return current;
      const payerIds = orderedIds.length ? orderedIds : getRawPayerIds(current);
      const totalCents = amountToCents(current.amount, currency);
      if (!payerIds.includes(participantId)) return current;
      const percentValue = clampValue(parseNumericInput(nextValue), 0, 100);
      const allocationMap = getPayerAllocationMapForItem(current, payerIds, totalCents);
      const nextMap = redistributeFromIndex({
        orderedIds: payerIds,
        allocationMap,
        totalCents,
        index,
        nextPercent: percentValue,
      });
      return {
        ...current,
        payerMode: "manual",
        payerAllocations: mapToAllocations(nextMap, payerIds),
      };
    });
  }

  async function saveEditingItem() {
    if (!editingItem || editingItemIndex < 0) return;
    const validation = validateItemData(editingItem, participants, currency);
    if (!validation.ok) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }
    const {
      trimmedDescription,
      participantIds,
      totalCents,
      allocationMap,
      payerIds,
      payerMode,
      payerAllocationMap,
    } = validation;
    const nextPayerIds = normalizePayerIds({ payerIds }, participants.map((person) => person.id));
    const nextPayerId = nextPayerIds[0] || participantIds[0] || "user";
    const safePayerAllocationMap = normalizeAllocationMap(payerAllocationMap, nextPayerIds, totalCents);
    const normalizedItem = {
      ...editingItem,
      description: trimmedDescription,
      amount: formatAmountInputFromCents(totalCents, currency),
      payerId: nextPayerId,
      payerIds: nextPayerIds,
      payerMode,
      payerAllocations: mapToAllocations(safePayerAllocationMap, nextPayerIds),
      participantIds,
      allocations: mapToAllocations(allocationMap, participantIds),
    };
    const nextItems = items.map((item, index) => (index === editingItemIndex ? normalizedItem : item));
    const saved = await persistSplit(nextItems);
    if (!saved) return;
    setItems(nextItems);
    setFeedback({ type: "ok", text: "Ítem actualizado correctamente." });
    closeItemEditor();
  }

  async function deleteEditingItem() {
    if (editingItemIndex < 0) return;
    const nextItems = items.filter((_item, index) => index !== editingItemIndex);
    const saved = await persistSplit(nextItems, { allowEmpty: true });
    if (!saved) return;
    setItems(nextItems);
    setFeedback({ type: "ok", text: "Ítem eliminado correctamente." });
    closeItemEditor();
  }

  async function persistSplit(
    nextItems,
    {
      allowEmpty = false,
      nextParticipants = participants,
      nextPayerId = payerId,
      nextSettlements = settlements,
    } = {},
  ) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFeedback({ type: "error", text: "El título es obligatorio." });
      return null;
    }
    if (nextParticipants.length < 1) {
      setFeedback({ type: "error", text: "Agrega al menos 1 participante." });
      return null;
    }
    const invalidPayer = nextItems.some((item) => {
      const payerIds = getRawPayerIds(item).filter((id) => nextParticipants.some((person) => person.id === id));
      return payerIds.length === 0;
    });
    if (invalidPayer) {
      setFeedback({ type: "error", text: "Selecciona quién pagó cada ítem." });
      return null;
    }
    const nextSummary = calculateSummary({
      participants: nextParticipants,
      items: nextItems,
      currency,
      settlements: nextSettlements,
    });
    if (!allowEmpty) {
      if (nextSummary.validItems === 0 || nextSummary.totalCents <= 0) {
        setFeedback({ type: "error", text: "Agrega al menos un ítem con valor mayor a 0." });
        return null;
      }
      if (nextSummary.invalidItems > 0) {
        setFeedback({
          type: "error",
          text: "Hay ítems sin participantes asignados. Ajústalos para guardar la división.",
        });
        return null;
      }
    }
    const payerSourceItem = nextItems.find((item) =>
      getRawPayerIds(item).some((id) => nextParticipants.some((person) => person.id === id)),
    );
    const fallbackPayerId = getRawPayerIds(payerSourceItem)[0] || nextPayerId;
    const payer = nextParticipants.find((item) => item.id === fallbackPayerId);
    const payerType = payer?.type === "friend" ? "friend" : "user";
    const payerFriendId = payer?.type === "friend" ? payer.friendId : null;
    if (payerType === "friend" && !payerFriendId) {
      setFeedback({ type: "error", text: "Selecciona quién pagó la cuenta." });
      return null;
    }

    const participantFriendIds = nextParticipants
      .filter((item) => item.type === "friend" && item.friendId)
      .map((item) => item.friendId);

    const itemsPayload = nextItems.map((item) => {
      const participantIds = item.participantIds || [];
      const totalCents = amountToCents(item.amount, currency);
      const allocationMap = getAllocationMapForItem(item, participantIds, totalCents);
      const payerIds = normalizePayerIds(item, nextParticipants.map((person) => person.id));
      const storedPayerIds = payerIds.map((id) => toStoredParticipantId(id));
      const payerMode = item.payerMode === "manual" && payerIds.length > 1 ? "manual" : "equal";
      const payerAllocationMap = getPayerAllocationMapForItem(item, payerIds, totalCents);
      return {
        id: item.id,
        description: item.description,
        amount: item.amount,
        payerId: storedPayerIds[0] || toStoredParticipantId(item.payerId || "user"),
        payerIds: storedPayerIds,
        payerMode,
        payerAllocations: payerIds.map((id) => ({
          participantId: toStoredParticipantId(id),
          amountCents: payerAllocationMap[id] || 0,
        })),
        participantIds: participantIds.map((id) => toStoredParticipantId(id)),
        allocations: participantIds.map((id) => ({
          participantId: toStoredParticipantId(id),
          amountCents: allocationMap[id] || 0,
        })),
      };
    });

    const settlementsPayload = Array.isArray(nextSettlements)
      ? nextSettlements.map((entry) => ({
          id: entry.id,
          fromId: toStoredParticipantId(entry.fromId),
          toId: toStoredParticipantId(entry.toId),
          amountCents: Math.max(0, Math.round(Number(entry.amountCents) || 0)),
          createdAt: entry.createdAt || new Date().toISOString(),
        }))
      : [];

    setSavingSplit(true);
    try {
      const endpoint = editingSplitId ? `/api/split-bills/${editingSplitId}` : "/api/split-bills";
      const res = await fetch(endpoint, {
        method: editingSplitId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          currency,
          payerType,
          payerFriendId,
          participantFriendIds,
          items: itemsPayload,
          settlements: settlementsPayload,
        }),
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch (_error) {
        payload = null;
      }
      if (!res.ok) {
        setFeedback({ type: "error", text: payload?.error || "No se pudo guardar la división." });
        return null;
      }

      const saved = payload?.data;
      if (saved?.id && !editingSplitId) {
        setEditingSplitId(saved.id);
      }
      await reloadSplits();
      if (trimmedTitle !== title) {
        setTitle(trimmedTitle);
      }
      return saved;
    } catch (_error) {
      setFeedback({ type: "error", text: "No se pudo guardar la división." });
      return null;
    } finally {
      setSavingSplit(false);
    }
  }

  async function saveDraftItem() {
    const validation = validateItemData(draftItem, participants, currency);
    if (!validation.ok) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }
    const {
      trimmedDescription,
      participantIds,
      totalCents,
      allocationMap,
      payerIds,
      payerMode,
      payerAllocationMap,
    } = validation;
    const nextPayerIds = normalizePayerIds({ payerIds }, participants.map((person) => person.id));
    const nextPayerId = nextPayerIds[0] || participantIds[0] || "user";

    const safePayerAllocationMap = normalizeAllocationMap(payerAllocationMap, nextPayerIds, totalCents);
    const normalizedDraft = {
      ...draftItem,
      description: trimmedDescription,
      amount: formatAmountInputFromCents(totalCents, currency),
      payerId: nextPayerId,
      payerIds: nextPayerIds,
      payerMode,
      payerAllocations: mapToAllocations(safePayerAllocationMap, nextPayerIds),
      participantIds,
      allocations: mapToAllocations(allocationMap, participantIds),
    };

    const nextItems = [...items, normalizedDraft];
    const saved = await persistSplit(nextItems);
    if (!saved) return;
    setItems(nextItems);
    setFeedback({ type: "ok", text: "Ítem guardado correctamente." });
    resetDraftItemKeepingPayers(participants, getRawPayerIds(draftItem), draftItem.payerMode);
  }

  return (
    <section className={workspaceClassName}>
      {toast ? (
        <div className={`toast toast-${toast.type || "ok"}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      ) : null}
      <article className="panel expense-log">
        <div className="split-header">
          {!isListView ? (
            <button className="btn btn-ghost" type="button" onClick={returnToList}>
              ← Ver divisiones
            </button>
          ) : null}
          <div className="dashboard-actions split-actions">
            <button
              className="btn btn-secondary split-action-btn"
              type="button"
              style={actionButtonStyle}
              onClick={openFriendModal}
            >
              <span style={actionIconStyle}>👥</span>
              <span>Agregar amigos</span>
            </button>
            {!isItemsStep ? (
              <button className="btn btn-primary" type="button" style={actionButtonStyle} onClick={startNewSplit}>
                + Nueva división
              </button>
            ) : null}
          </div>
        </div>

        {isListView ? (
          <>
            <section className="expense-intro panel-soft">
              <p className="expense-intro-title">Paso 1</p>
              <p className="expense-intro-copy">
                Selecciona una división existente o crea una nueva. Al entrar en una división podrás agregar ítems y
                repartir los montos entre los integrantes.
              </p>
            </section>

            {feedback && feedback.type === "ok" ? (
              <p className="message message-ok">{feedback.text}</p>
            ) : null}

            <section className="panel dashboard-card">
              <div className="dashboard-card-head">
                <h2>Divisiones creadas</h2>
                <button className="btn btn-ghost" type="button">
                  Ver más
                </button>
              </div>

              {splitsLoading ? (
                <div className="dashboard-empty">Cargando historial...</div>
              ) : splitsError ? (
                <div className="message message-error">{splitsError}</div>
              ) : splits.length === 0 ? (
                <div className="dashboard-empty">
                  Aún no hay divisiones registradas. Crea una nueva para comenzar.
                </div>
              ) : (
                <div className="movement-list">
                  {splits.map((record) => {
                    const recordParticipants = buildParticipantsFromFriendIds(
                      record.participantFriendIds || [],
                      friends,
                      defaultPayerName,
                    );
                    const defaultPayerId = resolvePayerId(record);
                    const recordItems = buildItemsFromStored(
                      record.items,
                      recordParticipants,
                      defaultPayerId,
                      record.currency,
                    );
                    const recordSettlements = buildSettlementsFromStored(record.settlements, recordParticipants);
                    const summaryForRecord = calculateSummary({
                      participants: recordParticipants,
                      items: recordItems,
                      currency: record.currency,
                      settlements: recordSettlements,
                    });
                    const participantCount = recordParticipants.length;
                    const itemCount = recordItems.length;
                    const status = getStatusFromSummary(summaryForRecord);
                    const createdLabel = formatSplitDate(record.createdAt);
                    return (
                      <div key={record.id} className="movement-item split-row">
                        <button
                          type="button"
                          className="split-row-main"
                          onClick={() => openSplit(record)}
                        >
                          <div>
                            <p className="movement-name">{record.title || "División sin título"}</p>
                            <p className="movement-meta">
                              {participantCount} integrantes · {itemCount} ítems ·{" "}
                              {formatCurrencyFromCents(summaryForRecord.totalCents, record.currency)}
                              {createdLabel ? ` · Creada ${createdLabel}` : ""}
                            </p>
                          </div>
                          <p className={`movement-amount ${status.tone}`}>{status.label}</p>
                        </button>
                        <div className="split-row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost split-row-balance"
                            onClick={(event) => {
                              event.stopPropagation();
                              openBalanceModal(record);
                            }}
                            disabled={itemCount === 0}
                            aria-label="Balancear"
                            title={itemCount === 0 ? "Agrega ítems para balancear" : "Balancear"}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M12 3c.6 0 1 .4 1 1v2h5.5c.4 0 .8.3.9.7l2 6c.1.3.1.7-.1 1-.2.3-.5.4-.9.4H16c-.4 0-.8-.2-.9-.6L13 8.9V17h4c.6 0 1 .4 1 1s-.4 1-1 1H7c-.6 0-1-.4-1-1s.4-1 1-1h4V8.9l-2.1 4.6c-.2.4-.5.6-.9.6H2.6c-.3 0-.6-.1-.8-.4-.2-.3-.2-.6-.1-.9l2-6c.1-.4.5-.7.9-.7H10V4c0-.6.4-1 1-1Zm-6.4 9H8l1-3H4.6l-1 3Zm10.4 0h3.4l-1-3H15l1 3Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          {confirmDeleteSplitId === record.id ? (
                            <div className="split-row-confirm">
                              <span className="movement-meta">
                                ¿Eliminar esta división? Esta acción no se puede deshacer.
                              </span>
                              <div className="split-row-confirm-actions">
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setConfirmDeleteSplitId("");
                                  }}
                                  disabled={deletingSplitId === record.id}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost split-row-delete"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteSplit(record);
                                  }}
                                  disabled={deletingSplitId === record.id}
                                >
                                  {deletingSplitId === record.id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost split-row-delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                setConfirmDeleteSplitId(record.id);
                              }}
                              disabled={deletingSplitId === record.id}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="dashboard-empty" style={{ marginTop: 10 }}>
                Selecciona una división para continuar o crea una nueva desde el botón superior.
              </div>
            </section>
          </>
        ) : (
          <>
            {isSetupStep ? (
              <>
                <section className="expense-intro panel-soft">
                  <p className="expense-intro-title">Paso 2</p>
                  <p className="expense-intro-copy">
                    Define título, moneda y participantes antes de agregar los gastos.
                  </p>
                </section>

                <section className="panel dashboard-card">
                  <div className="dashboard-card-head">
                    <h2>Nueva división</h2>
                  </div>

                  <div className="expense-form-grid" style={{ marginBottom: 10 }}>
                    <input
                      className="input"
                      placeholder="Título (ej: Cena viernes)"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                    <select
                      className="input"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                    >
                      {CURRENCIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="chip-row" style={{ marginBottom: 12 }}>
                    {participants.map((item) => (
                      <div
                        key={item.id}
                        className={`chip ${payerId === item.id ? "chip-live" : ""}`}
                        style={{ gap: 6 }}
                      >
                        <span>{item.name}</span>
                        {item.type === "friend" ? (
                          <button
                            type="button"
                            onClick={() => removeParticipant(item.id)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "inherit",
                              cursor: "pointer",
                              padding: 0,
                              lineHeight: 1,
                              fontWeight: 800,
                            }}
                            aria-label={`Quitar ${item.name}`}
                          >
                            x
                          </button>
                        ) : null}
                      </div>
                      ))}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p className="expense-hint" style={{ marginBottom: 6 }}>Amigos guardados</p>
                    {friendsLoading ? (
                      <div className="dashboard-empty">Cargando amigos...</div>
                    ) : friends.length === 0 ? (
                      <p className="expense-hint">Añade un amigo</p>
                    ) : (
                      <div className="chip-row">
                        {friends.map((friend) => {
                          const selected = participants.some((item) => item.id === `friend-${friend.id}`);
                          return (
                            <button
                              key={friend.id}
                              type="button"
                              className={`chip ${selected ? "chip-live" : ""}`}
                              onClick={() => toggleFriendSelection(friend)}
                            >
                              {friend.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {friendsError ? <p className="message message-error">{friendsError}</p> : null}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p className="expense-hint" style={{ marginBottom: 6 }}>Adjuntar factura</p>
                    <div className="expense-form-grid" style={{ marginBottom: 8 }}>
                      <input
                        ref={invoiceInputRef}
                        className="input"
                        type="file"
                        accept="image/*,application/pdf,.pdf"
                        onChange={handleInvoiceChange}
                      />
                      {invoiceFile ? (
                        <button className="btn btn-ghost" type="button" onClick={clearInvoiceFile}>
                          Quitar factura
                        </button>
                      ) : null}
                    </div>
                    {invoiceFile ? (
                      <p className="movement-meta" style={{ marginTop: 4 }}>
                        {invoiceFile.name}
                      </p>
                    ) : null}
                    {invoiceFile ? (
                      <>
                        <p className="expense-hint" style={{ margin: "8px 0 6px" }}>
                          Pagaron la factura
                        </p>
                        <div className="chip-row">
                          {participants.map((person) => {
                            const active = invoicePayerIds.includes(person.id);
                            return (
                              <button
                                key={person.id}
                                type="button"
                                className={`chip ${active ? "chip-live" : ""}`}
                                onClick={() => toggleInvoicePayer(person.id)}
                              >
                                {person.name}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>

                  <button className="btn btn-primary" type="button" onClick={continueToItems} disabled={creatingSplit}>
                    {creatingSplit ? "Creando división..." : "Agregar gastos a dividir"}
                  </button>

                  {feedback && feedback.type !== "ok" ? (
                    <p className={feedbackClass} style={feedbackStyle}>
                      {feedback.text}
                    </p>
                  ) : null}
                </section>
              </>
            ) : isItemsStep ? (
              <>
                <section className="expense-intro panel-soft">
                  <p className="expense-intro-title">Paso 3</p>
                  <p className="expense-intro-copy">
                    Agrega ítems y revisa los balances.
                  </p>
                </section>

                <section className="split-stack">
                  <aside className="panel dashboard-card split-balance-card">
                    <div className="dashboard-card-head">
                      <h2>Balances</h2>
                    </div>
                    <div className="split-table-wrap">
                      <table className="expense-table split-table">
                        <thead>
                          <tr>
                            <th>Participante</th>
                            <th>Pago</th>
                            <th>Consumo</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.balances.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="split-balance-name"
                                  onClick={() => openBalanceDetail(item.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      openBalanceDetail(item.id);
                                    }
                                  }}
                                  title="Ver detalle de consumo"
                                >
                                  {item.name}
                                </span>
                              </td>
                              <td>{formatCurrencyFromCents(item.paidCents, currency)}</td>
                              <td>{formatCurrencyFromCents(item.owedCents, currency)}</td>
                              <td className={`amount-col ${item.balanceCents >= 0 ? "pos" : "neg"}`}>
                                {item.balanceCents >= 0 ? "+" : "-"}
                                {formatCurrencyFromCents(Math.abs(item.balanceCents), currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </aside>

                  <article className="panel dashboard-card split-items-card">
                    <div className="dashboard-card-head">
                      <h2>Agregar ítems</h2>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={exportSplitItemsCsv}
                        disabled={items.length === 0}
                        title="Exportar ítems a CSV"
                      >
                        Exportar CSV
                      </button>
                    </div>

                    {feedback ? (
                      <p className={feedbackClass} style={feedbackStyle}>
                        {feedback.text}
                      </p>
                    ) : null}

                    <div className="split-participants">
                      <div className="split-participants-head">
                        <p className="expense-hint" style={{ margin: 0 }}>
                          Participantes de la división
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost split-add-btn"
                          onClick={() => setFriendPickerOpen((current) => !current)}
                          aria-label="Agregar amigo"
                          title="Agregar amigo"
                        >
                          <span className="split-add-icon">+</span>
                        </button>
                      </div>
                      <div className="chip-row">
                        {participants.map((item) => (
                          <div
                            key={item.id}
                            className={`chip ${payerId === item.id ? "chip-live" : ""}`}
                            style={{ gap: 6 }}
                          >
                            <span>{item.name}</span>
                            {item.type === "friend" ? (
                              <button
                                type="button"
                                onClick={() => removeParticipantFromDivision(item.id)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "inherit",
                                  cursor: "pointer",
                                  padding: 0,
                                  lineHeight: 1,
                                  fontWeight: 800,
                                }}
                                aria-label={`Quitar ${item.name}`}
                              >
                                x
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      {friendPickerOpen ? (
                        <div className="split-add-friend-list">
                          {friendsLoading ? (
                            <p className="expense-hint">Cargando amigos...</p>
                          ) : availableFriends.length === 0 ? (
                            <p className="expense-hint">No hay amigos disponibles.</p>
                          ) : (
                            <div className="chip-row">
                              {availableFriends.map((friend) => (
                                <button
                                  key={friend.id}
                                  type="button"
                                  className="chip"
                                  onClick={() => {
                                    addExistingFriendToItem(friend, { target: itemModalOpen ? "edit" : "draft" });
                                    setFriendPickerOpen(false);
                                  }}
                                >
                                  {friend.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {(() => {
                      const draftAmountCents = amountToCents(draftItem.amount, currency);
                      const draftParticipants = participants.filter((person) =>
                        (draftItem.participantIds || []).includes(person.id),
                      );
                      const draftParticipantIds = draftParticipants.map((person) => person.id);
                      const allocationMap = getAllocationMapForItem(
                        draftItem,
                        draftParticipants.map((person) => person.id),
                        draftAmountCents,
                      );
                      const draftPayerIds = getRawPayerIds(draftItem);
                      const isDraftPayerManual = draftItem.payerMode === "manual";
                      const draftPayers = participants.filter((person) => draftPayerIds.includes(person.id));
                      const payerAllocationMap = getPayerAllocationMapForItem(
                        draftItem,
                        draftPayerIds,
                        draftAmountCents,
                      );
                      const draftPercentMap = buildPercentMap(
                        allocationMap,
                        draftParticipantIds,
                        draftAmountCents,
                      );
                      const draftPayerPercentMap = buildPercentMap(
                        payerAllocationMap,
                        draftPayerIds,
                        draftAmountCents,
                      );
                      return (
                        <article className="movement-item" style={{ display: "grid", gap: 8 }}>
                          <div className="expense-form-grid">
                            <input
                              className="input"
                              placeholder="Descripción del ítem"
                              value={draftItem.description}
                              onChange={(event) => updateDraftItem({ description: event.target.value })}
                            />
                            <input
                              className="input"
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]{0,2}"
                              placeholder="Valor"
                              value={
                                isAmountEditing
                                  ? draftItem.amount
                                  : formatAmountInputValue(draftItem.amount, currency)
                              }
                              onFocus={() => setIsAmountEditing(true)}
                              onBlur={() => setIsAmountEditing(false)}
                              onChange={(event) => updateDraftAmount(event.target.value)}
                            />
                          </div>

                          <div>
                            <p className="expense-hint" style={{ marginBottom: 6 }}>
                              Pagó
                            </p>
                            <div className="expense-method-row">
                              {participants.map((person) => {
                                const active = draftPayerIds.includes(person.id);
                                return (
                                  <button
                                    key={person.id}
                                    type="button"
                                    className={`expense-method-chip ${active ? "active" : ""}`}
                                    onClick={() => toggleDraftPayer(person.id)}
                                  >
                                    {person.name}
                                  </button>
                                );
                              })}
                            </div>
                            {draftPayerIds.length > 1 ? (
                              <label className="split-toggle" style={{ marginTop: 6 }}>
                                <input
                                  type="checkbox"
                                  checked={isDraftPayerManual}
                                  onChange={toggleDraftPayerMode}
                                />
                                <span>Definir cuánto pagó cada uno</span>
                              </label>
                            ) : null}
                            {draftPayerIds.length > 1 && !isDraftPayerManual ? (
                              <p className="expense-hint" style={{ marginTop: 6 }}>
                                El pago se divide en partes iguales.
                              </p>
                            ) : null}
                            {draftPayerIds.length > 1 && isDraftPayerManual ? (
                              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                                <div className="movement-meta split-allocation-row">
                                  <span>Pagador</span>
                                  <span>Valor</span>
                                  <span>%</span>
                                </div>
                                {draftPayers.map((person, index) => {
                                  const allocationCents = payerAllocationMap[person.id] || 0;
                                  const percentValue = draftPayerPercentMap[person.id] || 0;
                                  const allocationOverride = payerAllocationInputOverrides[person.id];
                                  const percentOverride = payerPercentInputOverrides[person.id];
                                  return (
                                    <div key={person.id} className="split-allocation-row">
                                      <span>{person.name}</span>
                                      <input
                                        className="input split-value-input"
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                          allocationOverride !== undefined
                                            ? allocationOverride
                                            : formatAmountInputFromCents(allocationCents, currency)
                                        }
                                        onBlur={() => clearPayerAllocationOverride(person.id)}
                                        onChange={(event) => {
                                          const nextValue = event.target.value;
                                          setPayerAllocationOverride(person.id, nextValue);
                                          updateDraftPayerAllocationValue(person.id, nextValue);
                                        }}
                                      />
                                      <input
                                        className="input split-percent-input"
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                          percentOverride !== undefined
                                            ? percentOverride
                                            : formatPercentInput(percentValue)
                                        }
                                        onBlur={() => clearPayerPercentOverride(person.id)}
                                        onChange={(event) => {
                                          const nextValue = event.target.value;
                                          setPayerPercentOverride(person.id, nextValue);
                                          updateDraftPayerAllocationPercent(
                                            person.id,
                                            index,
                                            draftPayerIds,
                                            nextValue,
                                          );
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          <div>
                            <p className="expense-hint" style={{ marginBottom: 6 }}>
                              Se reparte entre
                            </p>
                            <div className="expense-method-row" style={{ marginBottom: 8 }}>
                              {participants.map((person) => {
                                const active = (draftItem.participantIds || []).includes(person.id);
                                return (
                                  <button
                                    key={person.id}
                                    type="button"
                                    className={`expense-method-chip ${active ? "active" : ""}`}
                                    onClick={() => toggleDraftParticipant(person.id)}
                                  >
                                    {person.name}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                className={`expense-method-chip ${
                                  participants.length > 0 &&
                                  participants.every((person) =>
                                    (draftItem.participantIds || []).includes(person.id),
                                  )
                                    ? "active"
                                    : ""
                                }`}
                                onClick={toggleAllParticipantsInDraft}
                              >
                                Todos
                              </button>
                            </div>
                          </div>

                          {draftParticipants.length === 0 ? (
                            <p className="movement-meta" style={{ margin: 0 }}>
                              Selecciona participantes para repartir el ítem.
                            </p>
                          ) : (
                            <div style={{ display: "grid", gap: 6 }}>
                              <div className="movement-meta split-allocation-row split-allocation-row-freeze">
                                <span>Participante</span>
                                <span>Valor</span>
                                <span>%</span>
                                <span aria-hidden="true" />
                              </div>
                              {draftParticipants.map((person, index) => {
                                const allocationCents = allocationMap[person.id] || 0;
                                const percentValue = draftPercentMap[person.id] || 0;
                                const allocationOverride = allocationInputOverrides[person.id];
                                const percentOverride = percentInputOverrides[person.id];
                                const isFrozen = !!draftFrozenParticipantIds[person.id];
                                return (
                                  <div key={person.id} className="split-allocation-row split-allocation-row-freeze">
                                    <span>{person.name}</span>
                                    <input
                                      className="input split-value-input"
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        allocationOverride !== undefined
                                          ? allocationOverride
                                          : formatAmountInputFromCents(allocationCents, currency)
                                      }
                                      onBlur={() => clearAllocationOverride(person.id)}
                                      onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setAllocationOverride(person.id, nextValue);
                                        updateDraftAllocationValue(person.id, nextValue);
                                      }}
                                    />
                                    <input
                                      className="input split-percent-input"
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        percentOverride !== undefined
                                          ? percentOverride
                                          : formatPercentInput(percentValue)
                                      }
                                      onBlur={() => clearPercentOverride(person.id)}
                                      onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setPercentOverride(person.id, nextValue);
                                        updateDraftAllocationPercent(
                                          person.id,
                                          index,
                                          draftParticipantIds,
                                          nextValue,
                                        );
                                      }}
                                    />
                                    <label className="split-freeze-toggle" aria-label="Congelar">
                                      <input
                                        type="checkbox"
                                        checked={isFrozen}
                                        onChange={() => toggleDraftFreeze(person.id)}
                                        aria-label="Congelar"
                                      />
                                      <span className="split-freeze-pill" aria-hidden="true">❄</span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                            <p className="movement-meta" style={{ margin: 0 }}>
                              {draftParticipants.length > 0 && draftAmountCents > 0
                                ? `Total del ítem: ${formatCurrencyFromCents(draftAmountCents, currency)}`
                                : "Ingresa el valor del ítem para calcular el reparto."}
                            </p>
                            <div className="split-item-actions">
                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={saveDraftItem}
                                disabled={savingSplit || !draftValidation.ok}
                              >
                                {savingSplit ? "Guardando..." : "Guardar ítem"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })()}

                    <div className="split-items-summary">
                      <p className="expense-hint" style={{ marginBottom: 6 }}>Ítems guardados</p>
                      {items.length === 0 ? (
                        <div className="dashboard-empty">Aún no hay ítems guardados.</div>
                      ) : (
                        <div className="movement-list">
                          {items.map((item, index) => {
                            const amountCents = amountToCents(item.amount, currency);
                            const participantLabel = getItemParticipantsLabel(item, participants);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className="movement-item split-item-row"
                                onClick={() => openItemEditor(item, index)}
                              >
                                <div style={{ display: "grid", gap: 2 }}>
                                  <p className="movement-name" style={{ margin: 0 }}>
                                    {item.description || "Ítem sin descripción"}
                                  </p>
                                  <p className="movement-meta" style={{ margin: 0 }}>
                                    {participantLabel}
                                  </p>
                                </div>
                                <p className="movement-amount" style={{ margin: 0 }}>
                                  {formatCurrencyFromCents(amountCents, currency)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="split-items-total">
                        <span>Total de la cuenta</span>
                        <strong>{formatCurrencyFromCents(itemsTotalCents, currency)}</strong>
                      </div>
                    </div>
                  </article>
                </section>
              </>
            ) : null}
          </>
        )}

        {friendModalOpen ? (
          <>
            <button
              type="button"
              className="friend-modal-backdrop"
              onClick={closeFriendModal}
              aria-label="Cerrar modal de amigos"
            />
            <div className="friend-modal" role="dialog" aria-modal="true">
              <div className="friend-modal-head">
                <div>
                  <h2>Agregar amigo</h2>
                  <p>Guarda contactos para usarlos en futuras divisiones.</p>
                </div>
                <button type="button" className="friend-modal-close" onClick={closeFriendModal} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              <div className="friend-modal-body">
                <div className="expense-form-grid">
                  <input
                    className="input"
                    placeholder="Nombre"
                    value={friendForm.name}
                    onChange={(event) => updateFriendForm({ name: event.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Correo o número telefónico"
                    value={friendForm.contact}
                    onChange={(event) => updateFriendForm({ contact: event.target.value })}
                  />
                </div>
                {friendFeedback ? (
                  <p className={friendFeedbackClass} style={friendFeedbackStyle}>
                    {friendFeedback.text}
                  </p>
                ) : null}
                <div className="friend-modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={closeFriendModal}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={saveFriendFromModal} disabled={friendSaving}>
                    {friendSaving ? "Guardando..." : "Guardar amigo"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
        {itemModalOpen && editingItem ? (
          <>
            <button
              type="button"
              className="item-modal-backdrop"
              onClick={closeItemEditor}
              aria-label="Cerrar edición de ítem"
            />
            <div className="item-modal" role="dialog" aria-modal="true">
              <div className="item-modal-head">
                <div>
                  <h2>Editar ítem</h2>
                  <p>Ajusta el detalle y el reparto del ítem.</p>
                </div>
                <button type="button" className="item-modal-close" onClick={closeItemEditor} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              <div className="item-modal-body">
                {(() => {
                  const editAmountCents = amountToCents(editingItem.amount, currency);
                  const editParticipants = participants.filter((person) =>
                    (editingItem.participantIds || []).includes(person.id),
                  );
                  const editParticipantIds = editParticipants.map((person) => person.id);
                  const allocationMap = getAllocationMapForItem(
                    editingItem,
                    editParticipants.map((person) => person.id),
                    editAmountCents,
                  );
                  const editPayerIds = getRawPayerIds(editingItem);
                  const isEditPayerManual = editingItem.payerMode === "manual";
                  const editPayers = participants.filter((person) => editPayerIds.includes(person.id));
                  const editPayerAllocationMap = getPayerAllocationMapForItem(
                    editingItem,
                    editPayerIds,
                    editAmountCents,
                  );
                  const editPercentMap = buildPercentMap(
                    allocationMap,
                    editParticipantIds,
                    editAmountCents,
                  );
                  const editPayerPercentMap = buildPercentMap(
                    editPayerAllocationMap,
                    editPayerIds,
                    editAmountCents,
                  );
                  return (
                    <>
                      <div className="expense-form-grid">
                        <input
                          className="input"
                          placeholder="Descripción del ítem"
                          value={editingItem.description || ""}
                          onChange={(event) => updateEditingItem({ description: event.target.value })}
                        />
                        <input
                          className="input"
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]{0,2}"
                          placeholder="Valor"
                          value={
                            isEditAmountEditing
                              ? editingItem.amount
                              : formatAmountInputValue(editingItem.amount, currency)
                          }
                          onFocus={() => setIsEditAmountEditing(true)}
                          onBlur={() => setIsEditAmountEditing(false)}
                          onChange={(event) => updateEditingAmount(event.target.value)}
                        />
                      </div>

                      <div>
                        <p className="expense-hint" style={{ marginBottom: 6 }}>
                          Pagó
                        </p>
                        <div className="expense-method-row">
                          {participants.map((person) => {
                            const active = editPayerIds.includes(person.id);
                            return (
                              <button
                                key={person.id}
                                type="button"
                                className={`expense-method-chip ${active ? "active" : ""}`}
                                onClick={() => toggleEditingPayer(person.id)}
                              >
                                {person.name}
                              </button>
                            );
                          })}
                        </div>
                        {editPayerIds.length > 1 ? (
                          <label className="split-toggle" style={{ marginTop: 6 }}>
                            <input
                              type="checkbox"
                              checked={isEditPayerManual}
                              onChange={toggleEditingPayerMode}
                            />
                            <span>Definir cuánto pagó cada uno</span>
                          </label>
                        ) : null}
                        {editPayerIds.length > 1 && !isEditPayerManual ? (
                          <p className="expense-hint" style={{ marginTop: 6 }}>
                            El pago se divide en partes iguales.
                          </p>
                        ) : null}
                        {editPayerIds.length > 1 && isEditPayerManual ? (
                          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                            <div className="movement-meta split-allocation-row">
                              <span>Pagador</span>
                              <span>Valor</span>
                              <span>%</span>
                            </div>
                            {editPayers.map((person, index) => {
                              const allocationCents = editPayerAllocationMap[person.id] || 0;
                              const percentValue = editPayerPercentMap[person.id] || 0;
                              const allocationOverride = editPayerAllocationInputOverrides[person.id];
                              const percentOverride = editPayerPercentInputOverrides[person.id];
                              return (
                                <div key={person.id} className="split-allocation-row">
                                  <span>{person.name}</span>
                                  <input
                                    className="input split-value-input"
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      allocationOverride !== undefined
                                        ? allocationOverride
                                        : formatAmountInputFromCents(allocationCents, currency)
                                    }
                                    onBlur={() => clearEditPayerAllocationOverride(person.id)}
                                    onChange={(event) => {
                                      const nextValue = event.target.value;
                                      setEditPayerAllocationOverride(person.id, nextValue);
                                      updateEditingPayerAllocationValue(person.id, nextValue);
                                    }}
                                  />
                                  <input
                                    className="input split-percent-input"
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      percentOverride !== undefined
                                        ? percentOverride
                                        : formatPercentInput(percentValue)
                                    }
                                    onBlur={() => clearEditPayerPercentOverride(person.id)}
                                    onChange={(event) => {
                                      const nextValue = event.target.value;
                                      setEditPayerPercentOverride(person.id, nextValue);
                                      updateEditingPayerAllocationPercent(
                                        person.id,
                                        index,
                                        editPayerIds,
                                        nextValue,
                                      );
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <p className="expense-hint" style={{ marginBottom: 6 }}>
                          Se reparte entre
                        </p>
                        <div className="expense-method-row" style={{ marginBottom: 8 }}>
                          {participants.map((person) => {
                            const active = (editingItem.participantIds || []).includes(person.id);
                            return (
                              <button
                                key={person.id}
                                type="button"
                                className={`expense-method-chip ${active ? "active" : ""}`}
                                onClick={() => toggleEditingParticipant(person.id)}
                              >
                                {person.name}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            className={`expense-method-chip ${
                              participants.length > 0 &&
                              participants.every((person) =>
                                (editingItem.participantIds || []).includes(person.id),
                              )
                                ? "active"
                                : ""
                            }`}
                            onClick={toggleAllParticipantsInEdit}
                          >
                            Todos
                          </button>
                        </div>
                      </div>

                      {editParticipants.length === 0 ? (
                        <p className="movement-meta" style={{ margin: 0 }}>
                          Selecciona participantes para repartir el ítem.
                        </p>
                      ) : (
                        <div style={{ display: "grid", gap: 6 }}>
                          <div className="movement-meta split-allocation-row split-allocation-row-freeze">
                            <span>Participante</span>
                            <span>Valor</span>
                            <span>%</span>
                            <span aria-hidden="true" />
                          </div>
                          {editParticipants.map((person, index) => {
                            const allocationCents = allocationMap[person.id] || 0;
                            const percentValue = editPercentMap[person.id] || 0;
                            const allocationOverride = editAllocationInputOverrides[person.id];
                            const percentOverride = editPercentInputOverrides[person.id];
                            const isFrozen = !!editFrozenParticipantIds[person.id];
                            return (
                              <div key={person.id} className="split-allocation-row split-allocation-row-freeze">
                                <span>{person.name}</span>
                                <input
                                  className="input split-value-input"
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    allocationOverride !== undefined
                                      ? allocationOverride
                                      : formatAmountInputFromCents(allocationCents, currency)
                                  }
                                  onBlur={() => clearEditAllocationOverride(person.id)}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setEditAllocationOverride(person.id, nextValue);
                                    updateEditingAllocationValue(person.id, nextValue);
                                  }}
                                />
                                <input
                                  className="input split-percent-input"
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    percentOverride !== undefined
                                      ? percentOverride
                                      : formatPercentInput(percentValue)
                                  }
                                  onBlur={() => clearEditPercentOverride(person.id)}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setEditPercentOverride(person.id, nextValue);
                                    updateEditingAllocationPercent(
                                      person.id,
                                      index,
                                      editParticipantIds,
                                      nextValue,
                                    );
                                  }}
                                />
                                <label className="split-freeze-toggle" aria-label="Congelar">
                                  <input
                                    type="checkbox"
                                    checked={isFrozen}
                                    onChange={() => toggleEditFreeze(person.id)}
                                    aria-label="Congelar"
                                  />
                                  <span className="split-freeze-pill" aria-hidden="true">❄</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {confirmDeleteItem ? (
                        <div className="item-modal-confirm">
                          <p className="message" style={{ margin: 0 }}>
                            ¿Seguro que deseas eliminar este ítem? Esta acción no se puede deshacer.
                          </p>
                          <div className="item-modal-actions">
                            <button
                              className="btn btn-ghost"
                              type="button"
                              onClick={() => setConfirmDeleteItem(false)}
                            >
                              Cancelar
                            </button>
                            <button
                              className="btn btn-ghost item-modal-delete"
                              type="button"
                              onClick={deleteEditingItem}
                            >
                              Eliminar ítem
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="item-modal-actions">
                          <button className="btn btn-primary" type="button" onClick={saveEditingItem}>
                            Guardar cambios
                          </button>
                          <button
                            className="btn btn-ghost item-modal-delete"
                            type="button"
                            onClick={() => setConfirmDeleteItem(true)}
                          >
                            Eliminar ítem
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        ) : null}
        {balanceModalOpen && balanceSummary ? (
          <>
            <button
              type="button"
              className="balance-modal-backdrop"
              onClick={closeBalanceModal}
              aria-label="Cerrar balance"
            />
            <div className="balance-modal" role="dialog" aria-modal="true">
              <div className="balance-modal-head">
                <div>
                  <h2>Balance de la cuenta</h2>
                  <p>Detalle de quién debe a quién y opciones para saldar.</p>
                </div>
                <div className="balance-modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={exportBalanceCsv}
                    disabled={items.length === 0}
                  >
                    Exportar CSV
                  </button>
                  <button
                    type="button"
                    className="balance-modal-close"
                    onClick={closeBalanceModal}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="balance-modal-body">
                {balanceError ? <p className="message message-error">{balanceError}</p> : null}
                {(() => {
                  const balanceCurrency = balanceRecord?.currency || currency;
                  const nameMap = new Map(balanceParticipants.map((person) => [person.id, person.name]));
                  const creditors = balanceSummary.balances.filter((item) => item.balanceCents > 0);
                  const historyLines = buildSettlementsFromStored(
                    balanceRecord?.settlements || [],
                    balanceParticipants,
                  ).sort((a, b) => {
                    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
                    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
                    return bTime - aTime;
                  });
                  const balanceLines = balanceSummary.settlements || [];
                  return (
                    <>
                      <div className="balance-actions">
                        <h3>Liquidar deudas</h3>
                        {balanceLines.length === 0 ? (
                          <p className="movement-meta">No hay deudas pendientes.</p>
                        ) : (
                          <div className="balance-lines">
                            {balanceLines.map((line, index) => {
                              const lineKey = `${line.fromId}-${line.toId}-${index}`;
                              const selectedCreditor = balanceLineSelections[lineKey] || line.toId;
                              const key = `${line.fromId}-${selectedCreditor}-${index}`;
                              const lineForPayment =
                                selectedCreditor === line.toId ? line : { ...line, toId: selectedCreditor };
                              const fromName = nameMap.get(line.fromId) || "Participante";
                              const toName = nameMap.get(line.toId) || "Participante";
                              const inputValue = balancePartialInputs[key] || "";
                              const partialOpen = balancePartialOpen[key];
                              return (
                                <div key={key} className="balance-line">
                                  <div className="balance-line-info">
                                    <div className="balance-line-label">
                                      <span className="movement-name">{fromName} debe a</span>
                                      {creditors.length > 0 ? (
                                        <select
                                          className="input balance-line-select"
                                          value={selectedCreditor}
                                          onChange={(event) =>
                                            updateBalanceLineSelection(lineKey, event.target.value)
                                          }
                                        >
                                          {creditors.map((creditor) => (
                                            <option key={creditor.id} value={creditor.id}>
                                              {nameMap.get(creditor.id) || creditor.name}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="movement-name">{toName}</span>
                                      )}
                                    </div>
                                    <p className="movement-amount" style={{ margin: 0 }}>
                                      {formatCurrencyFromCents(line.amountCents, balanceCurrency)}
                                    </p>
                                  </div>
                                  <div className="balance-line-actions">
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => {
                                        setBalancePartialOpen((current) => ({ ...current, [key]: false }));
                                        setBalancePartialInputs((current) => ({ ...current, [key]: "" }));
                                        persistBalanceSettlement(lineForPayment, line.amountCents, { markSettled: true });
                                      }}
                                      disabled={balanceSaving}
                                    >
                                      Pago total
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      onClick={() =>
                                        setBalancePartialOpen((current) => ({ ...current, [key]: !current[key] }))
                                      }
                                      disabled={balanceSaving}
                                    >
                                      Pago parcial
                                    </button>
                                  </div>
                                  {partialOpen ? (
                                    <div className="balance-line-partial">
                                      <input
                                        className="input"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Monto"
                                        value={
                                          balancePartialEditing[key]
                                            ? inputValue
                                            : formatAmountInputValue(inputValue, balanceCurrency)
                                        }
                                        onFocus={() => setBalancePartialEditingState(key, true)}
                                        onBlur={() => setBalancePartialEditingState(key, false)}
                                        onChange={(event) => updateBalancePartialInput(key, event.target.value)}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                          const amountCents = amountToCents(inputValue, balanceCurrency);
                                          if (amountCents <= 0) {
                                            setBalanceError("Ingresa un valor válido para saldar.");
                                            return;
                                          }
                                          if (amountCents > line.amountCents) {
                                            setBalanceError("El valor no puede superar la deuda pendiente.");
                                            return;
                                          }
                                          setBalanceError("");
                                          setBalancePartialOpen((current) => ({ ...current, [key]: false }));
                                          setBalancePartialInputs((current) => ({ ...current, [key]: "" }));
                                          persistBalanceSettlement(lineForPayment, amountCents, {
                                            markSettled: amountCents === line.amountCents,
                                          });
                                        }}
                                        disabled={balanceSaving}
                                      >
                                        Aplicar
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                            {balanceSettledLines.map((line) => {
                              const fromName = nameMap.get(line.fromId) || "Participante";
                              const toName = nameMap.get(line.toId) || "Participante";
                              return (
                                <div key={line.key} className="balance-line balance-line-disabled">
                                  <div className="balance-line-info">
                                    <div className="balance-line-label">
                                      <span className="movement-name">{fromName} debe a {toName}</span>
                                    </div>
                                    <p className="movement-amount" style={{ margin: 0 }}>
                                      {formatCurrencyFromCents(line.amountCents, balanceCurrency)}
                                    </p>
                                  </div>
                                  <p className="movement-meta balance-line-status">Cuenta liquidada</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="balance-actions">
                        <h3>Historial de pagos</h3>
                        {historyLines.length === 0 ? (
                          <p className="movement-meta">Aún no hay pagos registrados.</p>
                        ) : (
                          <div className="balance-lines">
                            {historyLines.map((line) => {
                              const fromName = nameMap.get(line.fromId) || "Participante";
                              const toName = nameMap.get(line.toId) || "Participante";
                              return (
                                <div key={line.id} className="balance-line">
                                  <div className="balance-line-info">
                                    <div className="balance-line-label">
                                      <p className="movement-name" style={{ margin: 0 }}>
                                        {fromName} pagó a {toName}
                                      </p>
                                      <button
                                        type="button"
                                        className="btn btn-ghost balance-undo-btn balance-undo-inline"
                                        onClick={() => undoBalanceSettlement(line)}
                                        disabled={balanceSaving}
                                        title="Deshacer"
                                        aria-label="Deshacer"
                                      >
                                        ↩
                                      </button>
                                    </div>
                                    <p className="movement-amount" style={{ margin: 0 }}>
                                      {formatCurrencyFromCents(line.amountCents, balanceCurrency)}
                                    </p>
                                  </div>
                                  {line.createdAt ? (
                                    <p className="movement-meta" style={{ margin: 0 }}>
                                      {new Date(line.createdAt).toLocaleString("es-CO")}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        ) : null}
        {balanceDetailParticipantId && balanceDetail ? (
          <>
            <button
              type="button"
              className="balance-modal-backdrop"
              onClick={closeBalanceDetail}
              aria-label="Cerrar detalle de consumo"
            />
            <div className="balance-modal" role="dialog" aria-modal="true">
              <div className="balance-modal-head">
                <div>
                  <h2>Consumo de {balanceDetail.participant.name}</h2>
                  <p>Ítems en los que participa y su valor asignado.</p>
                </div>
                <button type="button" className="balance-modal-close" onClick={closeBalanceDetail} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              <div className="balance-modal-body">
                {balanceDetail.items.length === 0 ? (
                  <p className="movement-meta">No hay ítems asociados.</p>
                ) : (
                  <div className="movement-list">
                    {balanceDetail.items.map((item) => (
                      <div key={item.id} className="movement-item split-item-row">
                        <p className="movement-name" style={{ margin: 0 }}>
                          {item.description}
                        </p>
                        <p className="movement-amount" style={{ margin: 0 }}>
                          {formatCurrencyFromCents(item.owedCents, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="split-items-total" style={{ marginTop: 12 }}>
                  <span>Total consumo</span>
                  <strong>
                    {formatCurrencyFromCents(
                      summary.balances.find((item) => item.id === balanceDetail.participant.id)?.owedCents ??
                        balanceDetail.totalCents,
                      currency,
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </article>
    </section>
  );
}
