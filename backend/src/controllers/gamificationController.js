const { getStatus } = require("../services/gamificationService");

async function status(req, res, next) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId query parameter is required" });
    }
    const payload = await getStatus(userId);
    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  status,
};
