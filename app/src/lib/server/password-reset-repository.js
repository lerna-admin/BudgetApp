import crypto from "node:crypto";

import { query } from "./db";

const RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 45);

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function resetExpiryDate() {
  const now = Date.now();
  const ttlMs = Math.max(5, RESET_TTL_MINUTES) * 60 * 1000;
  return new Date(now + ttlMs);
}

export async function createPasswordResetToken(userId) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = resetExpiryDate();
  const id = crypto.randomUUID();

  await query(
    `UPDATE password_reset_tokens
        SET used_at = NOW()
      WHERE user_id = $1
        AND used_at IS NULL`,
    [userId],
  );

  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, tokenHash, expiresAt.toISOString()],
  );

  return {
    rawToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function consumePasswordResetToken(rawToken) {
  const tokenHash = hashToken(rawToken);

  const { rows } = await query(
    `UPDATE password_reset_tokens
        SET used_at = NOW()
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      RETURNING id, user_id`,
    [tokenHash],
  );

  if (!rows[0]) {
    return null;
  }

  return {
    tokenId: rows[0].id,
    userId: rows[0].user_id,
  };
}

export async function invalidateUserResetTokens(userId) {
  await query(
    `UPDATE password_reset_tokens
        SET used_at = NOW()
      WHERE user_id = $1
        AND used_at IS NULL`,
    [userId],
  );
}
