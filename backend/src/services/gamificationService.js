const { getActiveSelection } = require("./profileService");
const { listAchievements, listLogs } = require("../repositories/gamificationRepository");

async function getStatus(userId) {
  const selection = await getActiveSelection(userId);
  const achievements = await listAchievements(userId);
  const logs = await listLogs(userId);
  return {
    activeProfile: selection,
    achievements,
    logs,
  };
}

module.exports = {
  getStatus,
};
