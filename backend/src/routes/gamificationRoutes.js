const express = require("express");
const { status } = require("../controllers/gamificationController");

const router = express.Router();

router.get("/status", status);

module.exports = router;
