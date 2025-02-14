import express from "express";
import { verifyToken } from "../utils/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//user details by id
router.get("/info/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
