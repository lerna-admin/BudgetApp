const {
  fetchProfiles,
  fetchObjectives,
  selectProfile,
  getActiveSelection,
} = require("../services/profileService");

async function getProfiles(_req, res, next) {
  try {
    const profiles = await fetchProfiles();
    res.json({ data: profiles });
  } catch (error) {
    next(error);
  }
}

async function getProfileObjectives(req, res, next) {
  try {
    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ message: "profileId is required" });
    }
    const objectives = await fetchObjectives(profileId);
    res.json({ data: objectives });
  } catch (error) {
    next(error);
  }
}

async function createSelection(req, res, next) {
  try {
    const { userId, profileId, notes } = req.body;
    if (!userId || !profileId) {
      return res.status(400).json({ message: "userId and profileId are required" });
    }
    const selection = await selectProfile(userId, profileId, notes);
    res.status(201).json({ data: selection });
  } catch (error) {
    next(error);
  }
}

async function activeSelection(req, res, next) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId query parameter is required" });
    }
    const selection = await getActiveSelection(userId);
    res.json({ data: selection });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfiles,
  getProfileObjectives,
  createSelection,
  activeSelection,
};
