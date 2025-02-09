import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));












// import express from "express";
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import cors from "cors";
// import twilio from "twilio";
// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors());

// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// //OTP
// const sendOTPWhatsApp = async (phoneNumber, otp) => {
//  await twilioClient.messages.create({
//       from: `${process.env.TWILIO_WHATSAPP_NUMBER}`,
//       to: `${phoneNumber}`,
//       body: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
//     });
// };

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error(err));

// // User Schema
// const userSchema = new mongoose.Schema({
//   username: { type: String, default: "" },
//   phoneNumber: { type: String, required: true, unique: true },
//   password: { type: String, default: "" },
//   creationDate: { type: Date, default: Date.now },
//   updationDate: { type: Date, default: Date.now },
//   role: { type: String, enum: ["free", "premium"], default: "free" },
//   lastLoginDate: { type: Date, default: null },
//   balance: { type: Number, default: 0 },
//   otp: { type: String, default: null },
//   otpExpiry: { type: Date, default: null }
// });

// // Transaction Schema
// const transactionSchema = new mongoose.Schema({
//   senderId: { type: String, required: true },
//   receiverId: { type: String, required: true },
//   amount: { type: Number, required: true },
//   date: { type: Date, default: Date.now }
// });

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// const User = mongoose.model("User", userSchema);
// const Transaction = mongoose.model("Transaction", transactionSchema);

// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
// };

// //Register
// app.post("/register", async (req, res) => {
//   try {
//     const { username, phoneNumber, password, role } = req.body;

//     const existingUser = await User.findOne({ phoneNumber });
//     if (existingUser) {
//       return res.status(400).json({ message: "Phone number already in use" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, phoneNumber, password: hashedPassword, role });
//     await user.save();

//     const token = generateToken(user._id);
//     res.status(201).json({ message: "User created successfully", token });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// //Login 
// app.post("/login", async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }

//     let user = await User.findOne({ phoneNumber });

//     if (!user) {
//       user = new User({ phoneNumber });
//     }

//     const otp = generateOTP();
//     const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

//     await User.findOneAndUpdate(
//       { phoneNumber },
//       { otp, otpExpiry, lastLoginDate: new Date() },
//       { upsert: true }
//     );

//     await sendOTPWhatsApp(phoneNumber, otp);

//     return res.json({ message: "OTP sent successfully via WhatsApp" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // OTP Verification
// app.post("/verify-otp", async (req, res) => {
//   try {
//     const { phoneNumber, otp } = req.body;
//     const user = await User.findOne({ phoneNumber });

//     if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     user.otp = null; 
//     user.otpExpiry = null;
//     await user.save();

//     const token = generateToken(user._id);
//     res.json({ message: "OTP verified successfully", token });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Verify Token Middleware
// const verifyToken = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token) return res.status(401).json({ message: "Access denied" });

//   try {
//     const tokenWithoutBearer = token.split(" ")[1];
//     const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(400).json({ message: "Invalid token" });
//   }
// };

// // Profile
// app.get("/profile", verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// // Transaction
// app.post("/transaction", async (req, res) => {
//   try {
//     const { senderId, receiverId, amount } = req.body;

//     const sender = await User.findById(senderId);
//     const receiver = await User.findById(receiverId);
//     if (!sender || !receiver) {
//       return res.status(400).json({ message: "Sender or Receiver not found" });
//     }

//     if (sender.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     sender.balance -= amount;
//     receiver.balance += amount;
//     await sender.save();
//     await receiver.save();

//     const transaction = new Transaction({ senderId, receiverId, amount });
//     await transaction.save();

//     res.json({ message: "Transaction successful" });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Transaction History
// app.get("/transactions/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const transactions = await Transaction.find({
//       $or: [{ senderId: userId }, { receiverId: userId }]
//     }).sort({ date: -1 });

//     res.json(transactions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));