const Monitoring = require('../models/Monitoring');
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
    const data = await Monitoring.aggregate([
      {
        $group: {
          _id: {
            week: { $week: "$dateOfPollination" },
            year: { $year: "$dateOfPollination" },
            plotNo: "$plotNo",
            gourdType: "$gourdType",
            variety: "$variety"
          },
          totalPollinated: { $sum: "$pollinatedFlowers" }
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
        $lookup: {
          from: "varieties",
          localField: "_id.variety",
          foreignField: "_id",
          as: "varietyDetails"
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: { $arrayElemAt: ["$gourdTypeDetails.name", 0] },
          variety: { $arrayElemAt: ["$varietyDetails.name", 0] },
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
exports.AdmingetCompletedByWeek = async (req, res) => {
  try {
    const data = await Monitoring.aggregate([
      {
        $match: { status: "Completed" }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfFinalization" },
            year: { $year: "$dateOfFinalization" },
            plotNo: "$plotNo",
            gourdType: "$gourdType",
            variety: "$variety"
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
      {
        $lookup: {
          from: 'varieties',
          localField: '_id.variety',
          foreignField: '_id',
          as: 'varietyDetails'
        }
      },
      {
        $unwind: "$gourdTypeDetails"
      },
      {
        $unwind: "$varietyDetails"
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          variety: "$varietyDetails.name",
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

// Controller to fetch failed pollination data by Plot and week
exports.AdmingetFailedByWeek = async (req, res) => {
  try {
    const data = await Monitoring.aggregate([
      {
        $match: { status: "Failed" }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfFinalization" },
            year: { $year: "$dateOfFinalization" },
            plotNo: "$plotNo",
            gourdType: "$gourdType",
            variety: "$variety"
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
        $lookup: {
          from: "varieties",
          localField: "_id.variety",
          foreignField: "_id",
          as: "varietyDetails"
        }
      },
      {
        $unwind: {
          path: "$gourdTypeDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$varietyDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          variety: "$varietyDetails.name",
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
exports.getPollinationByWeekID = async (req, res) => {
  try {
    const userId = req.auth.userId; // Extract the authenticated user's ID

    const data = await Monitoring.aggregate([
      // Match only records that belong to the logged-in user
      {
        $match: { userID: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfPollination" },
            year: { $year: "$dateOfPollination" },
            plotNo: "$plotNo",
            gourdType: "$gourdType",
            variety: "$variety"
          },
          totalPollinated: { $sum: "$pollinatedFlowers" }
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
        $lookup: {
          from: "varieties",
          localField: "_id.variety",
          foreignField: "_id",
          as: "varietyDetails"
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: { $arrayElemAt: ["$gourdTypeDetails.name", 0] },
          variety: { $arrayElemAt: ["$varietyDetails.name", 0] },
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

// Controller to fetch completed pollination data by Plot and week for the current user
exports.getCompletedByWeekId = async (req, res) => {
  try {
    const userId = req.auth.userId; // Get the logged-in user's ID

    const data = await Monitoring.aggregate([
      {
        $match: {
          status: "Completed",
          userID: new mongoose.Types.ObjectId(userId) // Filter by user ID
        }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfFinalization" },
            year: { $year: "$dateOfFinalization" },
            plotNo: "$plotNo",
            gourdType: "$gourdType",
            variety: "$variety"
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
      {
        $lookup: {
          from: "varieties",
          localField: "_id.variety",
          foreignField: "_id",
          as: "varietyDetails"
        }
      },
      {
        $unwind: "$gourdTypeDetails"
      },
      {
        $unwind: "$varietyDetails"
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          variety: "$varietyDetails.name",
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

// Controller to fetch failed pollination data by Plot and week for the current user
exports.getFailedByWeekId = async (req, res) => {
  try {
    const userId = req.auth.userId; // Get the logged-in user's ID

    const data = await Monitoring.aggregate([
      {
        $match: {
          status: "Failed",
          userID: new mongoose.Types.ObjectId(userId) // Filter by current user ID
        }
      },
      {
        $group: {
          _id: {
            week: { $week: "$dateOfFinalization" },
            year: { $year: "$dateOfFinalization" },
            plotNo: "$plotNo",
            gourdType: "$gourdType",
            variety: "$variety"
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
        $lookup: {
          from: "varieties",
          localField: "_id.variety",
          foreignField: "_id",
          as: "varietyDetails"
        }
      },
      {
        $unwind: {
          path: "$gourdTypeDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$varietyDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          week: "$_id.week",
          year: "$_id.year",
          plotNo: "$_id.plotNo",
          gourdType: "$gourdTypeDetails.name",
          variety: "$varietyDetails.name",
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

