const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { RefUser, Schedules } = require("../models"); // Ensure the RefUser schema is defined in your models
const authenticateJWT = require("../middleware");
const config = require("../config"); // Include JWT secret configuration

const router = express.Router();

router.post("/create", authenticateJWT, async (req, res) => {
  try {
    const existingUser = await RefUser.findOne({ email: req.body.email });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new RefUser({ ...req.body, password: hashedPassword });
    const result = await user.save();
    res.status(201).json({ success: true, user: result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error creating account" });
  }
});

// Handle user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const user = await RefUser.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email,
          loggedin: user.loggedin,
          sportscategory: user.sportscategory,
        },
        config.JWT_SECRET,
        { expiresIn: "24h" },
      );
      res.json({ success: true, message: "Logged in successfully", token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } else {
    res.json({ success: false, message: "Please provide email and password" });
  }
});

// Sports Coach landing page route
router.get("/", authenticateJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Correct route to fetch upcoming and live matches based on sports category
router.get("/matches", authenticateJWT, async (req, res) => {
  try {
    // Fetch matches based on the user's sports category and either "live" or "upcoming" status
    const matches = await Schedules.find({
      sport: req.user.sportscategory, // Filter by sport category
      status: { $in: ["upcoming", "live"] }, // Fetch only live and recent matches
    });

    // Send the filtered matches back to the frontend
    res.json({
      success: true,
      matches: matches,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ success: false, error: "Failed to fetch matches" });
  }
});
// Update match status route
router.post("/startmatch", authenticateJWT, async (req, res) => {
  const { matchId } = req.body;

  try {
    const match = await Schedules.findById(matchId);
    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Match not found" });
    }

    // Update match status to "live"
    match.status = "live";
    await match.save();

    res.json({ success: true, message: "Match status updated to live", match });
  } catch (error) {
    console.error("Error updating match status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update match status" });
  }
});

router.post("/updateScore", authenticateJWT, async (req, res) => {
  const { matchId, team } = req.body;

  try {
    const match = await Schedules.findById(matchId);
    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Match not found" });
    }

    if (team === "T1") {
      match.scoreT1 += 1;
    } else if (team === "T2") {
      match.scoreT2 += 1;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid team identifier" });
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: `Score updated successfully for ${team}`,
      match,
    });
  } catch (error) {
    console.error("Error updating score:", error);
    res.status(500).json({ success: false, message: "Failed to update score" });
  }
});

router.post("/stopmatch", authenticateJWT, async (req, res) => {
  const { matchId } = req.body;

  try {
    const match = await Schedules.findById(matchId);
    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Match not found" });
    }

    // Update status to "recent"
    match.status = "recent";

    // Determine the result
    if (match.scoreT1 > match.scoreT2) {
      match.result = match.team1; // Team 1 wins
    } else if (match.scoreT2 > match.scoreT1) {
      match.result = match.team2; // Team 2 wins
    } else {
      match.result = "Draw"; // It's a tie
    }

    // Save the match with updated status and result
    await match.save();

    res.json({ success: true, message: "Match stopped successfully", match });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error stopping the match", error });
  }
});

module.exports = router;
