const { fetchProfiles } = require("../services/profileService");

async function getProfiles(_req, res, next) {
  try {
    const profiles = await fetchProfiles();
    res.json({ data: profiles });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfiles,
};
