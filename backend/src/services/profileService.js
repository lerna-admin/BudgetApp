const {
  findAllProfiles,
  findObjectivesByProfile,
  createProfileSelection,
  findActiveSelection,
} = require("../repositories/profileRepository");

async function fetchProfiles() {
  return findAllProfiles();
}

async function fetchObjectives(profileId) {
  return findObjectivesByProfile(profileId);
}

async function selectProfile(userId, profileId, notes) {
  return createProfileSelection({ userId, profileId, notes });
}

async function getActiveSelection(userId) {
  return findActiveSelection(userId);
}

module.exports = {
  fetchProfiles,
  fetchObjectives,
  selectProfile,
  getActiveSelection,
};
