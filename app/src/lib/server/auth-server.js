import crypto from "node:crypto";

const DEFAULT_ITERATIONS = 120000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = "sha512";
const TOKEN_ALGO = "sha256";
export const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.AUTH_SECRET || "budgetapp-dev-secret-change-me";
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, HASH_KEYLEN, HASH_DIGEST)
    .toString("hex");
  return `${DEFAULT_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedValue) {
  const [iterationsStr, salt, storedHash] = (storedValue || "").split(":");
  if (!iterationsStr || !salt || !storedHash) {
    return false;
  }

  const iterations = Number(iterationsStr);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const computedHash = crypto
    .pbkdf2Sync(password, salt, iterations, HASH_KEYLEN, HASH_DIGEST)
    .toString("hex");

  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(computedHash, "hex");
  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signToken(payload, ttlSeconds = TOKEN_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const finalPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(finalPayload));
  const signature = crypto
    .createHmac(TOKEN_ALGO, getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const [encodedPayload, receivedSignature] = token.split(".");
  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac(TOKEN_ALGO, getSecret())
    .update(encodedPayload)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }
    return payload;
  } catch (_error) {
    return null;
  }
}
