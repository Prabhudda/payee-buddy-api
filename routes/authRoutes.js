import express from "express";
import bcrypt from "bcryptjs";
import { generateOTP, sendOTPWhatsApp } from "../utils/otp.js";
import { generateToken } from "../utils/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Login or Register with OTP
router.post("/login", async (req, res) => {
  try {
    let { phoneNumber } = req.body;

    phoneNumber = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`;

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = new User({ phoneNumber });
      await user.save();
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.lastLoginDate = new Date();
    await user.save();

    const otpResponse = await sendOTPWhatsApp(phoneNumber, otp);

    res.json(otpResponse);


  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({message: error.errors.phoneNumber.message});
    }
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    let { phoneNumber, otp } = req.body;

    phoneNumber = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`;

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.otp || user.otp !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = generateToken(user._id);
    res.json({ message: "OTP verified successfully", token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



//register
router.post("/register", async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, phoneNumber, password: hashedPassword });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
