// const express = require('express');
// const Monitoring = require('../controllers/Dashboard');
// const authJwt = require('../middleware/auth');
// const router = express.Router();


// // Get dashboard data
// router.get('/data', authJwt.isAuthenticatedUser, Monitoring.getDashboardData);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { getPollinationByMonth, getCompletedByMonth, getFailedByMonth } = require('../controllers/Dashboard');

// Route to get pollination data by month
router.get('/pollination/month', getPollinationByMonth);

// Route to get completed data by month
router.get('/completed/month', getCompletedByMonth);

// Route to get failed data by month
router.get('/failed/month', getFailedByMonth);

module.exports = router;
