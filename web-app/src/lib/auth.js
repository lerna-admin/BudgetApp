import { cookies } from "next/headers";

import { getUserBySession } from "@/data/user-store";

export const SESSION_COOKIE = "session_token";

export async function getCurrentUser() {
	const cookieStore = await cookies();
	const session = cookieStore.get(SESSION_COOKIE);
	const token = session?.value;
	if (!token) {
		return null;
	}
	return getUserBySession(token);
}
