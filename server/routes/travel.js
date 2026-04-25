const express = require("express");
const { query } = require("../controllers/travelController");

const router = express.Router();

router.post("/", query);

module.exports = router;
