const {
  getUserProfile,
  loginUser,
  registerUser,
} = require("../services/authService");

async function register(req, res, next) {
  try {
    const { name, email, password, countryCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "password must be at least 8 characters" });
    }

    const payload = await registerUser({ name, email, password, countryCode });
    return res.status(201).json({ data: payload });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const payload = await loginUser({ email, password });
    return res.json({ data: payload });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await getUserProfile(req.auth.sub);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  me,
};
