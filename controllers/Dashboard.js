const Monitoring = require('../models/Monitoring');
const mongoose = require("mongoose");
// Controller to fetch pollination data by GourdType and Variety grouped by month
exports.AdmingetPollinationByMonth = async (req, res) => {
    try {
      const data = await Monitoring.aggregate([
        {
          $group: {
            _id: { 
              month: { $month: "$dateOfPollination" },
              year: { $year: "$dateOfPollination" },
              day: { $dayOfMonth: "$dateOfPollination" },
              gourdType: "$gourdType",
              variety: "$variety"
            },
            totalPollinated: { $sum: "$pollinatedFlowers" }
          }
        },
        {
          $lookup: {
            from: "gourdtypes", // The collection name where gourd types are stored
            localField: "_id.gourdType",
            foreignField: "_id",
            as: "gourdTypeDetails"
          }
        },
        {
          $lookup: {
            from: "varieties", // The collection name where varieties are stored
            localField: "_id.variety",
            foreignField: "_id",
            as: "varietyDetails"
          }
        },
        {
          $project: {
            month: "$_id.month",
            year: "$_id.year",
            day: "$_id.day",
            gourdType: { $arrayElemAt: ["$gourdTypeDetails.name", 0] }, // Extract the first element's name
            variety: { $arrayElemAt: ["$varietyDetails.name", 0] }, // Extract the first element's name
            totalPollinated: 1,
            _id: 0
          }
        },
        { $sort: { year: 1, month: 1, day: 1 } }
      ]);
  
      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching pollination data:", error);
      res.status(500).json({ message: "Error fetching pollination data" });
    }
  };
  


// PollinationController.js

// Controller to fetch completed pollination data by GourdType and Variety grouped by month
exports.AdmingetCompletedByMonth = async (req, res) => {
    try {
      const data = await Monitoring.aggregate([
        {
          $match: { status: "Completed" } // Filter by completed status
        },
        {
          $group: {
            _id: { 
              month: { $month: "$dateOfFinalization" }, // Group by month
              year: { $year: "$dateOfFinalization" },   // Group by year
              day: { $dayOfMonth: "$dateOfFinalization" }, // Group by day
              gourdType: "$gourdType", // Group by gourdType (ID)
              variety: "$variety" // Group by variety (ID)
            },
            totalCompleted: { $sum: 1 } // Count completed records
          }
        },
        {
          $lookup: {
            from: 'gourdtypes', // Name of the GourdType collection
            localField: '_id.gourdType', // The field from the Monitoring collection
            foreignField: '_id', // The field from the GourdType collection
            as: 'gourdTypeDetails' // The output array
          }
        },
        {
          $lookup: {
            from: 'varieties', // Name of the Variety collection
            localField: '_id.variety', // The field from the Monitoring collection
            foreignField: '_id', // The field from the Variety collection
            as: 'varietyDetails' // The output array
          }
        },
        {
          $unwind: "$gourdTypeDetails" // Unwind the gourdTypeDetails array
        },
        {
          $unwind: "$varietyDetails" // Unwind the varietyDetails array
        },
        {
          $project: {
            month: "$_id.month",
            year: "$_id.year",
            day: "$_id.day",
            gourdType: "$gourdTypeDetails.name", // Get the GourdType name
            variety: "$varietyDetails.name", // Get the Variety name
            totalCompleted: 1, // Return the total count of completed statuses
            _id: 0
          }
        },
        { $sort: { year: 1, month: 1, day: 1 } } // Sort by year, month, and day
      ]);
  
      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching completed data:", error);
      res.status(500).json({ message: "Error fetching completed data" });
    }
  };
  
  // PollinationController.js

// Controller to fetch failed pollination data by GourdType and Variety grouped by month
exports.AdmingetFailedByMonth = async (req, res) => {
    try {
      const data = await Monitoring.aggregate([
        {
          $match: { status: "Failed" }, // Filter by failed status
        },
        {
          $group: {
            _id: {
              month: { $month: "$dateOfFinalization" }, // Group by month
              year: { $year: "$dateOfFinalization" }, // Group by year
              day: { $dayOfMonth: "$dateOfFinalization" }, // Group by day
              gourdType: "$gourdType", // Group by gourdType (ID)
              variety: "$variety", // Group by variety (ID)
            },
            totalFailed: { $sum: 1 }, // Count failed records
          },
        },
        {
          $lookup: {
            from: "gourdtypes", // Name of the GourdType collection
            localField: "_id.gourdType", // The field from the Monitoring collection
            foreignField: "_id", // The field from the GourdType collection
            as: "gourdTypeDetails", // The output array
          },
        },
        {
          $lookup: {
            from: "varieties", // Name of the Variety collection
            localField: "_id.variety", // The field from the Monitoring collection
            foreignField: "_id", // The field from the Variety collection
            as: "varietyDetails", // The output array
          },
        },
        {
          $unwind: {
            path: "$gourdTypeDetails", // Unwind the gourdTypeDetails array
            preserveNullAndEmptyArrays: true, // Avoid errors if details are missing
          },
        },
        {
          $unwind: {
            path: "$varietyDetails", // Unwind the varietyDetails array
            preserveNullAndEmptyArrays: true, // Avoid errors if details are missing
          },
        },
        {
          $project: {
            month: "$_id.month",
            year: "$_id.year",
            day: "$_id.day",
            gourdType: "$gourdTypeDetails.name", // Get the GourdType name
            variety: "$varietyDetails.name", // Get the Variety name
            totalFailed: 1, // Include total failed count
            _id: 0,
          },
        },
        {
          $sort: { year: 1, month: 1, day: 1 }, // Sort by year, month, and day
        },
      ]);
  
      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching failed data:", error);
      res.status(500).json({ message: "Error fetching failed data" });
    }
  };


  
  //getPollinationByMonth by CurrentUser

exports.getPollinationByMonthID = async (req, res) => {
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
                      month: { $month: "$dateOfPollination" },
                      year: { $year: "$dateOfPollination" },
                      day: { $dayOfMonth: "$dateOfPollination" },
                      gourdType: "$gourdType",
                      variety: "$variety"
                  },
                  totalPollinated: { $sum: "$pollinatedFlowers" }
              }
          },
          {
              $lookup: {
                  from: "gourdtypes", // The collection name where gourd types are stored
                  localField: "_id.gourdType",
                  foreignField: "_id",
                  as: "gourdTypeDetails"
              }
          },
          {
              $lookup: {
                  from: "varieties", // The collection name where varieties are stored
                  localField: "_id.variety",
                  foreignField: "_id",
                  as: "varietyDetails"
              }
          },
          {
              $project: {
                  month: "$_id.month",
                  year: "$_id.year",
                  day: "$_id.day",
                  gourdType: { $arrayElemAt: ["$gourdTypeDetails.name", 0] }, // Extract the first element's name
                  variety: { $arrayElemAt: ["$varietyDetails.name", 0] }, // Extract the first element's name
                  totalPollinated: 1,
                  _id: 0
              }
          },
          { $sort: { year: 1, month: 1, day: 1 } }
      ]);

      res.status(200).json(data);
  } catch (error) {
      console.error("Error fetching pollination data:", error);
      res.status(500).json({ message: "Error fetching pollination data" });
  }
};

//User Completed pollination by month
exports.getCompletedByMonthId = async (req, res) => {
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
                      month: { $month: "$dateOfFinalization" }, 
                      year: { $year: "$dateOfFinalization" },
                      day: { $dayOfMonth: "$dateOfFinalization" },
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
                  month: "$_id.month",
                  year: "$_id.year",
                  day: "$_id.day",
                  gourdType: "$gourdTypeDetails.name",
                  variety: "$varietyDetails.name",
                  totalCompleted: 1,
                  _id: 0
              }
          },
          { $sort: { year: 1, month: 1, day: 1 } }
      ]);

      res.status(200).json(data);
  } catch (error) {
      console.error("Error fetching completed data:", error);
      res.status(500).json({ message: "Error fetching completed data" });
  }
};


//get failed pollination by user ID

exports.getFailedByMonthId = async (req, res) => {
  try {
      const userId = req.auth.userId; // Get the logged-in user's ID

      const data = await Monitoring.aggregate([
          {
              $match: { 
                  status: "Failed", 
                  userID: new mongoose.Types.ObjectId(userId) // Filter by current user ID
              },  
          },
          {
              $group: {
                  _id: {
                      month: { $month: "$dateOfFinalization" }, 
                      year: { $year: "$dateOfFinalization" }, 
                      day: { $dayOfMonth: "$dateOfFinalization" },
                      gourdType: "$gourdType",
                      variety: "$variety"
                  },
                  totalFailed: { $sum: 1 }
              },
          },
          {
              $lookup: {
                  from: "gourdtypes",
                  localField: "_id.gourdType",
                  foreignField: "_id",
                  as: "gourdTypeDetails"
              },
          },
          {
              $lookup: {
                  from: "varieties",
                  localField: "_id.variety",
                  foreignField: "_id",
                  as: "varietyDetails"
              },
          },
          {
              $unwind: {
                  path: "$gourdTypeDetails",
                  preserveNullAndEmptyArrays: true
              },
          },
          {
              $unwind: {
                  path: "$varietyDetails",
                  preserveNullAndEmptyArrays: true
              },
          },
          {
              $project: {
                  month: "$_id.month",
                  year: "$_id.year",
                  day: "$_id.day",
                  gourdType: "$gourdTypeDetails.name",
                  variety: "$varietyDetails.name",
                  totalFailed: 1,
                  _id: 0
              },
          },
          {
              $sort: { year: 1, month: 1, day: 1 },
          },
      ]);

      res.status(200).json(data);
  } catch (error) {
      console.error("Error fetching failed data:", error);
      res.status(500).json({ message: "Error fetching failed data" });
  }
};
