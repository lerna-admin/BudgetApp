import crypto from "node:crypto";

import {
	ensureHouseholdsSeeded,
	ensureUsersSeeded,
	readHouseholds,
	readUsers,
	persistHouseholds,
	persistUsers,
} from "@/lib/db";

function syncUsers(users) {
	persistUsers(users);
}

function upsertMembership(user, membership) {
	const list = Array.isArray(user.householdMemberships) ? [...user.householdMemberships] : [];
	const index = list.findIndex((item) => item.householdId === membership.householdId);
	if (index === -1) {
		list.push(membership);
	} else {
		list[index] = membership;
	}
	return list;
}

function removeMembership(user, householdId) {
	const list = Array.isArray(user.householdMemberships) ? [...user.householdMemberships] : [];
	return list.filter((item) => item.householdId !== householdId);
}

export async function listHouseholds() {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	return readHouseholds();
}

export async function getHouseholdById(id) {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	return readHouseholds().find((household) => household.id === id) ?? null;
}

export async function createHousehold(payload) {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	if (!payload?.name) {
		throw new Error("El nombre del paquete familiar es obligatorio.");
	}
	const users = readUsers();
	const households = readHouseholds();
	const billingUser = users.find((user) => user.id === payload.billingUserId);
	if (!billingUser) {
		throw new Error("El usuario facturador no existe.");
	}
	const now = new Date().toISOString();
	const household = {
		id: crypto.randomUUID(),
		name: payload.name,
		planType: payload.planType ?? "family",
		billingUserId: billingUser.id,
		createdAt: now,
		updatedAt: now,
		members: [],
	};
	const membersInput = Array.isArray(payload.members) ? payload.members : [];
	const usersClone = [...users];
	if (!membersInput.some((member) => member.userId === billingUser.id)) {
		membersInput.unshift({ userId: billingUser.id, role: "owner", sharePercent: 50 });
	}
	for (const member of membersInput) {
		const user = usersClone.find((item) => item.id === member.userId);
		if (!user) {
			continue;
		}
		const normalizedShare = Number(member.sharePercent) || 0;
		const memberRecord = {
			userId: user.id,
			role: member.role ?? "member",
			sharePercent: Math.max(0, Math.min(100, normalizedShare)),
		};
		household.members.push(memberRecord);
		user.householdMemberships = upsertMembership(user, {
			householdId: household.id,
			role: memberRecord.role,
			sharePercent: memberRecord.sharePercent,
		});
	}
	persistHouseholds([...households, household]);
	syncUsers(usersClone);
	return household;
}

export async function updateHousehold(id, payload) {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	const households = readHouseholds();
	const index = households.findIndex((household) => household.id === id);
	if (index === -1) {
		throw new Error("El paquete familiar no existe.");
	}
	const updated = {
		...households[index],
		name: payload.name ?? households[index].name,
		planType: payload.planType ?? households[index].planType,
		billingUserId: payload.billingUserId ?? households[index].billingUserId,
		updatedAt: new Date().toISOString(),
	};
	households[index] = updated;
	persistHouseholds(households);
	return updated;
}

export async function deleteHousehold(id) {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	const households = readHouseholds();
	const household = households.find((item) => item.id === id);
	if (!household) {
		return false;
	}
	const remaining = households.filter((item) => item.id !== id);
	persistHouseholds(remaining);
	const users = readUsers().map((user) => ({
		...user,
		householdMemberships: removeMembership(user, id),
	}));
	syncUsers(users);
	return true;
}

export async function addHouseholdMember(id, memberPayload) {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	const households = readHouseholds();
	const index = households.findIndex((household) => household.id === id);
	if (index === -1) {
		throw new Error("El paquete familiar no existe.");
	}
	const users = readUsers();
	const user = users.find((item) => item.id === memberPayload.userId);
	if (!user) {
		throw new Error("El usuario a agregar no existe.");
	}
	const normalizedShare = Number(memberPayload.sharePercent) || 0;
	const memberRecord = {
		userId: user.id,
		role: memberPayload.role ?? "member",
		sharePercent: Math.max(0, Math.min(100, normalizedShare)),
	};
	const existingIndex = households[index].members.findIndex((member) => member.userId === user.id);
	if (existingIndex === -1) {
		households[index].members.push(memberRecord);
	} else {
		households[index].members[existingIndex] = memberRecord;
	}
	households[index].updatedAt = new Date().toISOString();
	user.householdMemberships = upsertMembership(user, {
		householdId: households[index].id,
		role: memberRecord.role,
		sharePercent: memberRecord.sharePercent,
	});
	persistHouseholds(households);
	syncUsers(users);
	return households[index];
}

export async function updateHouseholdMember(id, memberPayload) {
	return addHouseholdMember(id, memberPayload);
}

export async function removeHouseholdMember(id, userId) {
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	const households = readHouseholds();
	const index = households.findIndex((household) => household.id === id);
	if (index === -1) {
		throw new Error("El paquete familiar no existe.");
	}
	households[index].members = households[index].members.filter((member) => member.userId !== userId);
	households[index].updatedAt = new Date().toISOString();
	persistHouseholds(households);
	const users = readUsers().map((user) => {
		if (user.id !== userId) {
			return user;
		}
		return {
			...user,
			householdMemberships: removeMembership(user, id),
		};
	});
	syncUsers(users);
	return households[index];
}
