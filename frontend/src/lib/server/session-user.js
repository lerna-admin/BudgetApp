import { cookies } from "next/headers";

import { verifyToken } from "./auth-server";
import { hasPool } from "./db";
import { findUserById } from "./users-repository";

export async function getSessionUser() {
  if (!hasPool()) {
    return null;
  }

  const token = (await cookies()).get("budgetapp_session")?.value;
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return null;
  }

  try {
    return await findUserById(payload.sub);
  } catch (_error) {
    return null;
  }
}
