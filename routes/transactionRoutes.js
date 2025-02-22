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
router.post("/reward/:senderId", async (req, res) => {
  try {
    const { senderId } = req.params;

    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(400).json({ message: "Sender not found" });
    }

    sender.balance += 1;
    await sender.save();

    res.json({ message: "Reward added successfully", newBalance: sender.balance });

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





 

// router.get("/summary/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { period } = req.query; // Accepts "day", "week", "month", "quarter", "year"

//     // Get the current date, month, and year
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth();
//     const currentYear = currentDate.getFullYear();

//     let dateFormat;
//     let matchCondition = {
//       $or: [{ senderId: userId }, { receiverId: userId }],
//     };

//     if (period === "day") {
//       // If period is "day", filter by current month and year
//       matchCondition.$expr = {
//         $and: [
//           { $eq: [{ $year: "$date" }, currentYear] },
//           { $eq: [{ $month: "$date" }, currentMonth] },
//         ],
//       };
//       dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
//     } else if (period === "week") {
//       dateFormat = {
//         $concat: [
//           { $toString: { $isoWeekYear: "$date" } },
//           "-W",
//           { $toString: { $isoWeek: "$date" } },
//         ],
//       };
//     } else if (period === "month") {
//       dateFormat = { $dateToString: { format: "%Y-%m", date: "$date" } };
//     } else if (period === "quarter") {
//       dateFormat = {
//         $concat: [
//           { $toString: { $year: "$date" } },
//           "-Q",
//           { $toString: { $ceil: { $divide: [{ $month: "$date" }, 3] } } },
//         ],
//       };
//     } else if (period === "year") {
//       dateFormat = { $dateToString: { format: "%Y", date: "$date" } };
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Invalid period. Use day, week, month, quarter, or year." });
//     }

//     const transactions = await Transaction.aggregate([
//       {
//         $match: matchCondition, // Filter transactions
//       },
//       {
//         $group: {
//           _id: dateFormat, // Group by the selected period
//           totalSent: {
//             $sum: { $cond: [{ $eq: ["$senderId", userId] }, "$amount", 0] },
//           },
//           totalReceived: {
//             $sum: { $cond: [{ $eq: ["$receiverId", userId] }, "$amount", 0] },
//           },
//         },
//       },
//       { $sort: { _id: 1 } }, // Sort by date
//     ]);

//     res.json(transactions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });



// router.get("/summary/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { period } = req.query; // Accepts "day", "week", "month", "quarter", "year"

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth() + 1;

//     let dateFormat;
//     let matchCondition = { $or: [{ senderId: userId }, { receiverId: userId }] };

//     if (period === "day") {
//       dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
//     } else if (period === "week") {
//       dateFormat = {
//         $concat: [
//           { $toString: { $isoWeekYear: "$date" } },
//           "-W",
//           { $toString: { $isoWeek: "$date" } },
//         ],
//       };
//     } else if (period === "month") {
//       dateFormat = { $dateToString: { format: "%Y-%m", date: "$date" } };
//     } else if (period === "quarter") {
//       dateFormat = {
//         $concat: [
//           { $toString: { $year: "$date" } },
//           "-Q",
//           { $toString: { $ceil: { $divide: [{ $month: "$date" }, 3] } } },
//         ],
//       };
//     } else if (period === "year") {
//       dateFormat = { $dateToString: { format: "%Y", date: "$date" } };
//     } else {
//       return res.status(400).json({ message: "Invalid period. Use day, week, month, quarter, or year." });
//     }

//     const transactions = await Transaction.aggregate([
//       { $match: matchCondition },
//       {
//         $group: {
//           _id: dateFormat,
//           totalSent: { $sum: { $cond: [{ $eq: ["$senderId", userId] }, "$amount", 0] } },
//           totalReceived: { $sum: { $cond: [{ $eq: ["$receiverId", userId] }, "$amount", 0] } },
//           totalTransactions: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     let labels = [];
//     let receivedData = [];
//     let sentData = [];
//     let weeklyData = {};

//     let totalReceived = 0;
//     let totalSent = 0;
//     let totalTransactions = 0;

//     transactions.forEach((item) => {
//       labels.push(item._id);
//       receivedData.push(item.totalReceived);
//       sentData.push(item.totalSent);
//       totalReceived += item.totalReceived;
//       totalSent += item.totalSent;
//       totalTransactions += item.totalTransactions;

//       if (period === "day" || period === "week") {
//         let date = new Date(item._id);
//         let weekKey = `Week ${getWeekRange(date)}`;

//         if (!weeklyData[weekKey]) {
//           weeklyData[weekKey] = {
//             totalReceived: 0,
//             totalSent: 0,
//             totalTransactions: 0,
//           };
//         }

//         weeklyData[weekKey].totalReceived += item.totalReceived;
//         weeklyData[weekKey].totalSent += item.totalSent;
//         weeklyData[weekKey].totalTransactions += item.totalTransactions;
//       }
//     });

//     // **Calculate Best & Worst Weeks**
//     const sortedWeeks = Object.entries(weeklyData).sort((a, b) => b[1].totalReceived - a[1].totalReceived);
//     const bestWeek = sortedWeeks.length ? { range: sortedWeeks[0][0], amount: sortedWeeks[0][1].totalReceived } : { range: "", amount: 0 };
//     const worstWeek = sortedWeeks.length > 1 ? { range: sortedWeeks[sortedWeeks.length - 1][0], amount: sortedWeeks[sortedWeeks.length - 1][1].totalReceived } : bestWeek;

//     return res.json({
//       transactions: {
//         labels,
//         datasets: [
//           { data: receivedData },
//           { data: sentData },
//         ],
//       },
//       summary: {
//         totalReceived,
//         totalSent,
//         bestWeek,
//         worstWeek,
//       },
//     });

//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // **Helper function to get formatted week range**
// const getWeekRange = (date) => {
//   let start = new Date(date);
//   start.setDate(start.getDate() - start.getDay());
//   let end = new Date(start);
//   end.setDate(end.getDate() + 6);

//   const formatDate = (d) => `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
//   return `${formatDate(start)} - ${formatDate(end)}`;
// };


























