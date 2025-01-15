const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {
  SportsCoachUser,
  SportsRules,
  TeamRankings,
  Pools,
  Schedules,
} = require("../models");
const authenticateJWT = require("../middleware");
const config = require("../config");

const router = express.Router();

// Sports Coach signup route
router.post("/create", async (req, res) => {
  try {
    const existingUser = await SportsCoachUser.findOne({
      email: req.body.email,
    });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new SportsCoachUser({ ...req.body, password: hashedPassword });
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
    const user = await SportsCoachUser.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email,
          loggedin: user.loggedin,
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

// Change password route
router.post("/changepassword", authenticateJWT, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await SportsCoachUser.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch)
      return res.status(400).json({ error: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Error changing password" });
  }
});

// Fetch rules for a specific sport
router.get("/getrules/:sport", authenticateJWT, async (req, res) => {
  const { sport } = req.params;

  try {
    const rules = await SportsRules.findOne({ sport });
    if (rules) {
      res.json({
        success: true,
        rules: {
          rules: rules.rules,
          lastUpdatedBy: rules.lastUpdatedBy,
          updatedAt: rules.updatedAt,
        },
      });
    } else {
      res.status(404).json({ success: false, message: "Rules not found" });
    }
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ success: false, error: "Error fetching rules" });
  }
});

// Update rules for a specific sport
router.put("/updaterules/:sport", authenticateJWT, async (req, res) => {
  const { sport } = req.params;
  const { rules } = req.body;

  try {
    const user = await SportsCoachUser.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const updated = await SportsRules.findOneAndUpdate(
      { sport },
      {
        rules,
        lastUpdatedBy: user.username,
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );

    res.json({
      success: true,
      updated: {
        sport: updated.sport,
        rules: updated.rules,
        lastUpdatedBy: updated.lastUpdatedBy,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating rules:", error);
    res.status(500).json({ success: false, error: "Error updating rules" });
  }
});

// Create pools and schedules
router.post("/create-pools", authenticateJWT, async (req, res) => {
  const { sport } = req.body;
  const user = req.user;
  const currentYear = new Date().getFullYear();

  try {
    const existingPools = await Pools.findOne({
      sport,
      year: currentYear.toString(),
    });

    if (existingPools) {
      return res.status(400).json({
        success: false,
        message: `Pools and schedules for ${currentYear} have already been created by ${existingPools.createdBy}.`,
      });
    }

    const rankings = await TeamRankings.find({ category: sport }).sort({
      P1: 1,
    });

    if (!rankings || rankings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No teams found for this sport." });
    }

    const teams = [];
    rankings.forEach((rank) => {
      teams.push(
        rank.P1,
        rank.P2,
        rank.P3,
        rank.P4,
        rank.P5,
        rank.P6,
        rank.P7,
        rank.P8,
      );
    });

    const teamsToConsider = teams.slice(0, 8);
    const poolA = teamsToConsider.filter((_, index) => index % 2 === 0);
    const poolB = teamsToConsider.filter((_, index) => index % 2 === 1);

    const newPools = new Pools({
      sport,
      poolA,
      poolB,
      createdBy: user.username,
      year: currentYear.toString(),
    });
    await newPools.save();

    const schedules = [];
    [poolA, poolB].forEach((pool, poolIndex) => {
      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          schedules.push({
            pool: poolIndex === 0 ? "Pool A" : "Pool B",
            team1: pool[i],
            team2: pool[j],
            sport,
            year: currentYear.toString(),
          });
        }
      }
    });

    await Schedules.insertMany(schedules);

    res.json({
      success: true,
      message: "Pools and schedules created successfully!",
    });
  } catch (error) {
    console.error("Error creating pools and schedules:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating pools and schedules." });
  }
});

// Fetch pools and schedules for a specific sport
router.get(
  "/get-pools-and-schedules/:sport",
  authenticateJWT,
  async (req, res) => {
    const { sport } = req.params;

    try {
      const pools = await Pools.findOne({ sport });

      if (!pools) {
        return res
          .status(404)
          .json({ success: false, message: `Pools not found for ${sport}.` });
      }

      const schedules = await Schedules.find({ sport }).sort({ createdAt: 1 });

      if (!schedules || schedules.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No schedules found for ${sport}.`,
        });
      }

      res.json({
        success: true,
        pools: {
          poolA: pools.poolA,
          poolB: pools.poolB,
        },
        schedules,
      });
    } catch (error) {
      console.error("Error fetching pools and schedules:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching pools and schedules.",
      });
    }
  },
);

module.exports = router;
