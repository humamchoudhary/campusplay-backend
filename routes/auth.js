const express = require("express");
const authenticateJWT = require("../middleware");

const router = express.Router();

router.get("/", authenticateJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});
module.exports = router;
