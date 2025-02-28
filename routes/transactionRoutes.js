import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { verifyToken } from "../utils/auth.js";
const router = express.Router();

// Make a Transaction
router.post("/", async (req, res) => {
  try {
    const { senderId, receiverId, amount } = req.body;

    if(amount<1){
      return res.status(400).json({ message: "The sending amount must be at least $1" });
    }

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

    res.status(200).json({ message: "Transaction successful" });

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


// router.get("/history/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const limit = parseInt(req.query.limit) || 10; 
//     const offset = parseInt(req.query.offset) || 0;

//     const transactions = await Transaction.find({
//       $or: [{ senderId: userId }, { receiverId: userId }]
//     })
//     .sort({ date: -1 })
//     .skip(offset)
//     .limit(limit);

//     res.json(transactions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;

    const parsedLimit = limit === "all" ? null : parseInt(limit) || 10;
    const parsedOffset = parseInt(offset) || 0;

    let query = Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ date: -1 }).skip(parsedOffset);

    if (parsedLimit !== null) {
      query = query.limit(parsedLimit);
    }

    const transactions = await query;
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//reward
// router.post("/reward/:senderId", async (req, res) => {
//   try {
//     const { senderId } = req.params;

//     const sender = await User.findById(senderId);
//     if (!sender) {
//       return res.status(400).json({ message: "Sender not found" });
//     }

//     sender.balance += 1;
//     await sender.save();

//     res.json({ message: "Reward added successfully", newBalance: sender.balance });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.post("/reward/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(400).json({ message: "User not found" });
    }

    receiver.balance += 2;
    await receiver.save();

    const transaction = new Transaction({
      senderId: userId, 
      receiverId: userId,
      amount: 2,
      type:'reward'
    });

    await transaction.save();

    res.json({
      message: "Reward added successfully",
      newBalance: receiver.balance,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; 


    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; 
    const currentYear = currentDate.getFullYear();

    let dateFormat;
    let matchCondition = {
      $or: [{ senderId: userId }, { receiverId: userId }],
    };

    switch (period) {
      case "day":
        matchCondition.$expr = {
          $and: [
            { $eq: [{ $year: "$date" }, currentYear] },
            { $eq: [{ $month: "$date" }, currentMonth] },
          ],
        };
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;

      case "week":
        dateFormat = {
          $concat: [
            { $toString: { $isoWeekYear: "$date" } },
            "-W",
            { $toString: { $isoWeek: "$date" } },
          ],
        };
        break;

      case "month":
        matchCondition.$expr = { $eq: [{ $year: "$date" }, currentYear] }; 
        dateFormat = { $dateToString: { format: "%Y-%m", date: "$date" } };
        break;

      case "quarter":
        matchCondition.$expr = { $eq: [{ $year: "$date" }, currentYear] };
        dateFormat = {
          $concat: [
            { $toString: { $year: "$date" } },
            "-Q",
            { $toString: { $ceil: { $divide: [{ $month: "$date" }, 3] } } },
          ],
        };
        break;

      case "year":
        dateFormat = { $dateToString: { format: "%Y", date: "$date" } };
        break;

      default:
        return res
          .status(400)
          .json({ message: "Invalid period. Use day, week, month, quarter, or year." });
    }

    const transactions = await Transaction.aggregate([
      {
        $match: matchCondition, 
      },
      {
        $group: {
          _id: dateFormat, 
          totalSent: {
            $sum: { $cond: [{ $eq: ["$senderId", userId] }, "$amount", 0] },
          },
          totalReceived: {
            $sum: { $cond: [{ $eq: ["$receiverId", userId] }, "$amount", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


 export default router;
























