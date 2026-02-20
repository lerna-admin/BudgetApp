const { findAllProfiles } = require("../repositories/profileRepository");

async function fetchProfiles() {
  return findAllProfiles();
}

module.exports = {
  fetchProfiles,
};
