// const Monitoring = require('../models/Monitoring');

// // Dashboard data controller
// const getDashboardData = async (req, res) => {
//     try {
//         // Aggregate data by year, month, gourd variety, and pollination status
//         const dashboardData = await Monitoring.aggregate([
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: "$dateOfPollination" },
//                         month: { $month: "$dateOfPollination" },
//                         day: { $dayOfMonth: "$dateOfPollination" }, // Extract day of the month
//                         gourd: "$gourdType",   // Add gourd variety
//                         variety: "$variety",    // Add gourd variety
//                     },
//                     totalPollinated: { $sum: "$pollinatedFlowers" },
//                     completed: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
//                         },
//                     },
//                     failed: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "Failed"] }, 1, 0],
//                         },
//                     },
//                     dateOfFinalization: { $max: "$dateOfFinalization" }, // Get the latest finalization date for the gourd
//                 },
//             },
//             {
//                 $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.gourd": 1, "_id.variety": 1 },
//             },
//         ]);

//         // Array of month names
//         const monthNames = [
//             "January", "February", "March", "April", "May", "June",
//             "July", "August", "September", "October", "November", "December"
//         ];

//         // Format the response with full date and include the completed gourd count and dateOfFinalization
//         const formattedData = dashboardData.map((data) => {
//             const monthName = monthNames[data._id.month - 1]; // Month is 1-based in MongoDB

//             // Construct a full date (e.g., "2025-01-15")
//             const date = new Date(data._id.year, data._id.month - 1, data._id.day).toISOString().split('T')[0];

//             // Check for invalid date
//             if (!date || isNaN(new Date(date).getTime())) {
//                 console.error('Invalid date format in record:', data);
//                 return null; // Skip invalid records
//             }

//             return {
//                 year: data._id.year,
//                 month: monthName,
//                 day: data._id.day,
//                 date: date,  // Include formatted date
//                 gourd: data._id.gourd, // Include gourd type
//                 variety: data._id.variety, // Include variety
//                 totalPollinated: data.totalPollinated,
//                 completed: data.completed,
//                 failed: data.failed,
//                 dateOfFinalization: data.dateOfFinalization, // Include dateOfFinalization
//             };
//         }).filter(record => record !== null); // Remove any invalid records

//         res.status(200).json(formattedData);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Failed to fetch dashboard data", error: err.message });
//     }
// };

// module.exports = {
//     getDashboardData,
// };


// PollinationController.js

const Monitoring = require('../models/Monitoring');

// Controller to fetch pollination data by GourdType and Variety grouped by month
exports.getPollinationByMonth = async (req, res) => {
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
exports.getCompletedByMonth = async (req, res) => {
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
exports.getFailedByMonth = async (req, res) => {
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
  