import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { verifyToken } from "../utils/auth.js";
const router = express.Router();

// Make a Transaction
router.post("/", async (req, res) => {
  try {
    const { senderId, receiverId, amount } = req.body;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    if (!sender || !receiver) {
      return res.status(400).json({ message: "Sender or Receiver not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save();
    await receiver.save();

    const transaction = new Transaction({ senderId, receiverId, amount });
    await transaction.save();

    res.json({ message: "Transaction successful" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// //Transaction History
// router.get("/history/:userId", verifyToken, async (req, res) => {
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


router.get("/history/:userId",verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10; 
    const offset = parseInt(req.query.offset) || 0;

    const transactions = await Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
    .sort({ date: -1 })
    .skip(offset)
    .limit(limit);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



//reward
router.post("/reward/:senderId", async (req, res) => {
  try {
    const { senderId } = req.params;

    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(400).json({ message: "Sender not found" });
    }

    sender.balance += 2;
    await sender.save();

    res.json({ message: "Reward added successfully", newBalance: sender.balance });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
