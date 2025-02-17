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


// Check if user exists by phone number
router.post("/check-user", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({ phoneNumber });

    if (user) {
      return res.status(200).json({ 
        message: "User found, You can proceed with the transaction.", 
        user: { _id: user._id, phoneNumber: user.phoneNumber,userName: user.username}
      });
    }

    return res.status(404).json({ message: "Oops! It looks like your friend hasn’t joined Payee Buddy yet. Ask them to sign up to receive your payment!" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



export default router;
