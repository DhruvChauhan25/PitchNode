const express = require("express");

const {
  createRoom,
  checkRoom,
} = require("../controllers/sessionController");

const router = express.Router();

router.post("/create", createRoom);

router.get("/:roomId", checkRoom);

module.exports = router;