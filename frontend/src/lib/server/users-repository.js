import crypto from "node:crypto";
import { query } from "./db";

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    countryCode: row.country_code,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    passwordHash: row.password_hash,
  };
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT id, name, email, country_code, role, status, created_at, updated_at, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  return mapUserRow(rows[0]);
}

export async function findUserById(userId) {
  const { rows } = await query(
    `SELECT id, name, email, country_code, role, status, created_at, updated_at, password_hash
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  return mapUserRow(rows[0]);
}

export async function createUser({ name, email, passwordHash, countryCode }) {
  const id = crypto.randomUUID();
  let finalCountryCode = countryCode || null;

  if (finalCountryCode) {
    const { rows } = await query(
      "SELECT code FROM countries WHERE code = $1 LIMIT 1",
      [finalCountryCode],
    );

    if (!rows.length) {
      finalCountryCode = null;
    }
  }

  const { rows } = await query(
    `INSERT INTO users(id, name, email, password_hash, country_code, role, status)
     VALUES($1, $2, $3, $4, $5, 'user', 'active')
     RETURNING id, name, email, country_code, role, status, created_at, updated_at, password_hash`,
    [id, name, email, passwordHash, finalCountryCode],
  );

  return mapUserRow(rows[0]);
}
