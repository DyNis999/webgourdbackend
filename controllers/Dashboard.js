
const Monitoring = require('../models/Monitoring');
const {User} = require('../models/user');
const {Post} = require('../models/Post');
const mongoose = require("mongoose");

// Helper function to get the week number of a date
const getWeekNumber = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

// Controller to fetch pollination data by Plot and week
exports.AdmingetPollinationByWeek = async (req, res) => {
  try {
    const { plotNo } = req.query; // Get plotNo from query params

    const matchStage = plotNo
      ? [{ $match: { plotNo: plotNo } }]
      : [];

    const data = await Monitoring.aggregate([
      ...matchStage,
      {
        $project: {
          dateOfPollination: 1,
          plotNo: 1,
          gourdType: 1,
          pollinatedImageCount: { $size: { $ifNull: ["$pollinatedFlowerImages", []] } }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfPollination" },
            year: { $year: "$dateOfPollination" },
            plotNo: "$plotNo",
            gourdType: "$gourdType"
          },
          totalPollinated: { $sum: "$pollinatedImageCount" }
        }
      },
      {
        $lookup: {
          from: "gourdtypes",
          localField: "_id.gourdType",
          foreignField: "_id",
          as: "gourdTypeDetails"
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: { $arrayElemAt: ["$gourdTypeDetails.name", 0] },
          totalPollinated: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, plotNo: 1 } }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching pollination data:", error);
    res.status(500).json({ message: "Error fetching pollination data" });
  }
};

// Controller to fetch completed pollination data by Plot and week
// Controller to fetch completed pollination data by Plot and week using harvest days
exports.AdmingetCompletedByWeek = async (req, res) => {
  try {
    const data = await Monitoring.aggregate([
      { $match: { status: "Completed" } },
      { $unwind: "$dateOfHarvest" },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfHarvest.date" },
            year: { $year: "$dateOfHarvest.date" },
            plotNo: "$plotNo",
            gourdType: "$gourdType"
          },
          totalCompleted: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'gourdtypes',
          localField: '_id.gourdType',
          foreignField: '_id',
          as: 'gourdTypeDetails'
        }
      },
      { $unwind: "$gourdTypeDetails" },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          totalCompleted: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, plotNo: 1 } }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching completed data:", error);
    res.status(500).json({ message: "Error fetching completed data" });
  }
};

// Controller to fetch failed pollination data by Plot and week using harvest days
exports.AdmingetFailedByWeek = async (req, res) => {
  try {
    const data = await Monitoring.aggregate([
      { $match: { status: "Failed" } },
      // Unwind the dateOfHarvest array to get each day as a separate document
      { $unwind: "$dateOfHarvest" },
      // Group by week/year of each harvest day, plotNo, and gourdType
      {
        $group: {
          _id: {
            week: { $week: "$dateOfHarvest.date" },
            year: { $year: "$dateOfHarvest.date" },
            plotNo: "$plotNo",
            gourdType: "$gourdType"
          },
          totalFailed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "gourdtypes",
          localField: "_id.gourdType",
          foreignField: "_id",
          as: "gourdTypeDetails"
        }
      },
      {
        $unwind: {
          path: "$gourdTypeDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          totalFailed: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, plotNo: 1 } }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching failed data:", error);
    res.status(500).json({ message: "Error fetching failed data" });
  }
};

// Controller to fetch pollination data by Plot and week for the current user
// Controller to fetch pollination data by Plot and week for the current user
exports.getPollinationByWeekID = async (req, res) => {
  try {
    const userId = req.auth.userId; // Extract the authenticated user's ID

    const data = await Monitoring.aggregate([
      {
        $match: { userID: new mongoose.Types.ObjectId(userId) }
      },
      {
        $project: {
          dateOfPollination: 1,
          plotNo: 1,
          gourdType: 1,
          pollinatedImageCount: { $size: { $ifNull: ["$pollinatedFlowerImages", []] } }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfPollination" },
            year: { $year: "$dateOfPollination" },
            plotNo: "$plotNo",
            gourdType: "$gourdType"
          },
          totalPollinated: { $sum: "$pollinatedImageCount" }
        }
      },
      {
        $lookup: {
          from: "gourdtypes",
          localField: "_id.gourdType",
          foreignField: "_id",
          as: "gourdTypeDetails"
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: { $arrayElemAt: ["$gourdTypeDetails.name", 0] },
          totalPollinated: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, plotNo: 1 } }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching pollination data:", error);
    res.status(500).json({ message: "Error fetching pollination data" });
  }
};

// Controller to fetch completed pollination data by Plot and week for the current user (using harvest days)
exports.getCompletedByWeekId = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const data = await Monitoring.aggregate([
      {
        $match: {
          status: "Completed",
          userID: new mongoose.Types.ObjectId(userId)
        }
      },
      { $unwind: "$dateOfHarvest" },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfHarvest.date" },
            year: { $year: "$dateOfHarvest.date" },
            plotNo: "$plotNo",
            gourdType: "$gourdType"
          },
          totalCompleted: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "gourdtypes",
          localField: "_id.gourdType",
          foreignField: "_id",
          as: "gourdTypeDetails"
        }
      },
      { $unwind: "$gourdTypeDetails" },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          totalCompleted: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, plotNo: 1 } }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching completed data:", error);
    res.status(500).json({ message: "Error fetching completed data" });
  }
};

// Controller to fetch failed pollination data by Plot and week for the current user (using harvest days)
exports.getFailedByWeekId = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const data = await Monitoring.aggregate([
      {
        $match: {
          status: "Failed",
          userID: new mongoose.Types.ObjectId(userId)
        }
      },
      { $unwind: "$dateOfHarvest" },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfHarvest.date" },
            year: { $year: "$dateOfHarvest.date" },
            plotNo: "$plotNo",
            gourdType: "$gourdType"
          },
          totalFailed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "gourdtypes",
          localField: "_id.gourdType",
          foreignField: "_id",
          as: "gourdTypeDetails"
        }
      },
      {
        $unwind: {
          path: "$gourdTypeDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          totalFailed: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, week: 1, plotNo: 1 } }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching failed data:", error);
    res.status(500).json({ message: "Error fetching failed data" });
  }
};



// Controller to get a summary of gourd types and users
exports.getGourdTypeUserSummary = async (req, res) => {
  try {
    const data = await Monitoring.aggregate([
      {
        $lookup: {
          from: "gourdtypes",
          localField: "gourdType",
          foreignField: "_id",
          as: "gourdType_lookup_gourdtypes"
        }
      },
      {
        $addFields: {
          gourdType_lookup_gourdtypes: {
            $ifNull: [
              { $arrayElemAt: ["$gourdType_lookup_gourdtypes", 0] },
              null
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userID",
          foreignField: "_id",
          as: "userID_lookup_users"
        }
      },
      {
        $addFields: {
          userID_lookup_users: {
            $ifNull: [
              { $arrayElemAt: ["$userID_lookup_users", 0] },
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            __alias_0: "$gourdType_lookup_gourdtypes.name",
            __alias_1: "$userID_lookup_users.name"
          },
          __alias_2: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          __alias_0: "$_id.__alias_0",
          __alias_1: "$_id.__alias_1",
          __alias_2: 1
        }
      },
      {
        $project: {
          y: "$__alias_0",
          x: "$__alias_2",
          color: "$__alias_1",
          _id: 0
        }
      },
      {
        $addFields: {
          __agg_sum: { $sum: ["$x"] }
        }
      },
      {
        $group: {
          _id: { y: "$y" },
          __grouped_docs: { $push: "$$ROOT" },
          __agg_sum: { $sum: "$__agg_sum" }
        }
      },
      { $sort: { __agg_sum: -1 } },
      { $unwind: "$__grouped_docs" },
      { $replaceRoot: { newRoot: "$__grouped_docs" } },
      { $project: { __agg_sum: 0 } },
      { $limit: 5000 }
    ]);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getGourdTypeUserSummary:", error);
    res.status(500).json({ message: "Error fetching summary data" });
  }
};
// Controller to get user count
exports.getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    console.log("User count:", count);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user count" });
  }
};

// Controller to get post count
exports.getPostCount = async (req, res) => {
  try {
    const count = await Post.countDocuments();
    console.log("Post count:", count);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching post count" });
  }
};


// Controller to get overall pollination statistics (total pollinated, completed, and failed)
// exports.getOverallPollinationStats = async (req, res) => {
//   try {
//     // 1. Total pollinated: count of all pollinated flower images
//     const pollinatedStats = await Monitoring.aggregate([
//       {
//         $project: {
//           pollinatedCount: { $size: { $ifNull: ["$pollinatedFlowerImages", []] } }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalPollinated: { $sum: "$pollinatedCount" }
//         }
//       }
//     ]);

//     const totalPollinated = pollinatedStats[0]?.totalPollinated || 0;

//     // 2. Total completed: count of all records where status is Completed
//     const totalCompleted = await Monitoring.countDocuments({ status: "Completed" });

//     // 3. Total failed: count of all records where status is Failed
//     const totalFailed = await Monitoring.countDocuments({ status: "Failed" });

//     res.status(200).json({
//       totalPollinated,
//       totalCompleted,
//       totalFailed,
//     });
//   } catch (error) {
//     console.error("Error fetching overall pollination stats:", error);
//     res.status(500).json({ message: "Error fetching overall pollination stats" });
//   }
// };

exports.getOverallPollinationStats = async (req, res) => {
  try {
    const stats = await Monitoring.aggregate([
      {
        $project: {
          pollinatedCount: { $size: { $ifNull: ["$pollinatedFlowerImages", []] } },
          harvestedCount: { $size: { $ifNull: ["$fruitHarvestedImages", []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalPollinated: { $sum: "$pollinatedCount" },
          totalHarvested: { $sum: "$harvestedCount" }
        }
      }
    ]);

    const totalPollinated = stats[0]?.totalPollinated || 0;
    const totalHarvested = stats[0]?.totalHarvested || 0;

    const successRate = totalPollinated > 0
      ? (totalHarvested / totalPollinated) * 100
      : 0;

    res.status(200).json({
      totalPollinated,
      totalHarvested,
      successRate: successRate.toFixed(2) + '%'
    });
  } catch (error) {
    console.error("Error fetching overall pollination stats:", error);
    res.status(500).json({ message: "Error fetching overall pollination stats" });
  }
};
