const express = require("express");
const { AdminPost, Schedules } = require("../models");
const router = express.Router();

// Get all posts (no authentication required)
router.get("/getposts", async (req, res) => {
  try {
    const posts = await AdminPost.find().sort({ postedAt: -1 }); // Sort by date, descending
    res.json({ success: true, posts: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

// Get upcoming matches from the schedules collection
router.get("/upcomingmatches", async (req, res) => {
  try {
    const upcomingMatches = await Schedules.find({ status: "upcoming" }).sort({
      createdAt: 1,
    }); // Sort by creation date
    res.json({ success: true, matches: upcomingMatches });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch upcoming matches" });
  }
});

router.get("/recentmatches", async (req, res) => {
  try {
    const upcomingMatches = await Schedules.find({ status: "recent" }).sort({
      createdAt: 1,
    }); // Sort by creation date
    res.json({ success: true, matches: upcomingMatches });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch recent matches" });
  }
});

router.get("/livematches", async (req, res) => {
  try {
    const upcomingMatches = await Schedules.find({ status: "live" }).sort({
      createdAt: 1,
    }); // Sort by creation date
    res.json({ success: true, matches: upcomingMatches });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch live matches" });
  }
});
module.exports = router;
