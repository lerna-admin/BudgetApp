const express = require("express");
const { getProfiles } = require("../controllers/profileController");

const router = express.Router();

router.get("/", getProfiles);

module.exports = router;
