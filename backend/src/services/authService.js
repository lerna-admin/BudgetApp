const {
  createUser,
  findUserByEmail,
  findUserById,
} = require("../repositories/authRepository");
const {
  hashPassword,
  signToken,
  verifyPassword,
} = require("../lib/auth");

function sanitizeUser(userRow) {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    countryCode: userRow.country_code,
    role: userRow.role,
    status: userRow.status,
    createdAt: userRow.created_at,
    updatedAt: userRow.updated_at,
  };
}

async function registerUser({ name, email, password, countryCode }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = hashPassword(password);
  const createdUser = await createUser({
    name,
    email,
    passwordHash,
    countryCode: countryCode || null,
  });

  const user = sanitizeUser(createdUser);
  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return { token, user };
}

async function loginUser({ email, password }) {
  const userRow = await findUserByEmail(email);
  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const user = sanitizeUser(userRow);
  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return { token, user };
}

async function getUserProfile(userId) {
  const userRow = await findUserById(userId);
  if (!userRow) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(userRow);
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
