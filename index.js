import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import twilio from "twilio";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());


const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPSMS = async (phoneNumber, otp) => {
  try {
    await twilioClient.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, 
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));


const userSchema = new mongoose.Schema({
  username: { type: String, required: true,default: "Username" },
  password: { type: String, required: true,default: "Password" },
  phoneNumber: { type: String, required: true, unique: true },
  creationDate: { type: Date, default: Date.now },
  updationDate: { type: Date, default: Date.now },
  role: { type: Number, default: 1 },
  lastLoginDate: { type: Date, default: null },
  userPrivilege: { type: String, enum: ["free", "premium"], default: "free" },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);


const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};


app.post("/register", async (req, res) => {
  try {
    const { username, phoneNumber, password, role, userPrivilege } = req.body;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const user = new User({ username, phoneNumber, password, role, userPrivilege });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let user = await User.findOne({ phoneNumber });
  
    if (!user) {
      user = new User({
        phoneNumber:`${phoneNumber}`
      });
      await user.save();
    }

    const otp = generateOTP();
    const otpSent = await sendOTPSMS(phoneNumber, otp);

    if (otpSent) {
      return res.json({ message: "OTP sent successfully" });
    } else {
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const tokenWithoutBearer = token.split(" ")[1]; 
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};



app.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});




const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




