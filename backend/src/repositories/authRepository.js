const { v4: uuidv4 } = require("uuid");
const db = require("../db/pool");

const memoryUsers = new Map();

function mapUserRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    country_code: row.country_code,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    password_hash: row.password_hash,
  };
}

async function findUserByEmail(email) {
  if (!db.hasPool()) {
    const user = memoryUsers.get(email.toLowerCase()) || null;
    return user ? { ...user } : null;
  }

  const { rows } = await db.query(
    `SELECT id, name, email, country_code, role, status, created_at, updated_at, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  return mapUserRow(rows[0]);
}

async function findUserById(userId) {
  if (!db.hasPool()) {
    for (const user of memoryUsers.values()) {
      if (user.id === userId) {
        return { ...user };
      }
    }
    return null;
  }

  const { rows } = await db.query(
    `SELECT id, name, email, country_code, role, status, created_at, updated_at, password_hash
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  return mapUserRow(rows[0]);
}

async function createUser({ name, email, passwordHash, countryCode }) {
  const id = uuidv4();

  if (!db.hasPool()) {
    const now = new Date().toISOString();
    const memoryUser = {
      id,
      name,
      email,
      country_code: countryCode,
      role: "user",
      status: "active",
      created_at: now,
      updated_at: now,
      password_hash: passwordHash,
    };
    memoryUsers.set(email.toLowerCase(), memoryUser);
    return { ...memoryUser };
  }

  const { rows } = await db.query(
    `INSERT INTO users(id, name, email, password_hash, country_code, role, status)
     VALUES($1, $2, $3, $4, $5, 'user', 'active')
     RETURNING id, name, email, country_code, role, status, created_at, updated_at, password_hash`,
    [id, name, email, passwordHash, countryCode],
  );

  return mapUserRow(rows[0]);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
