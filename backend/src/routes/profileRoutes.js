const express = require("express");
const {
  getProfiles,
  getProfileObjectives,
  createSelection,
  activeSelection,
} = require("../controllers/profileController");

const router = express.Router();

router.get("/", getProfiles);
router.get("/:profileId/objectives", getProfileObjectives);
router.post("/select", createSelection);
router.get("/active", activeSelection);

module.exports = router;
