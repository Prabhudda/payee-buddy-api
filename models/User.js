import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, default: "Username" },
  phoneNumber: { 
    type: String, 
    required: [true, "Phone number is required"], 
    unique: true,
    set: function (value) {
      return value.startsWith("+91") ? value : `+91${value}`;
    },
    validate: {
      validator: function (value) {
        return /^\+91\d{10}$/.test(value);
      },
      message: "Invalid phone number. Must be 10 digits.",
    },
  },
  
  password: { type: String, default: "Password" },
  creationDate: { type: Date, default: Date.now },
  updationDate: { type: Date, default: Date.now },
  role: { type: String, enum: ["free", "premium"], default: "free" },
  lastLoginDate: { type: Date, default: null },
  balance: { type: Number, default: 0 },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null }
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
