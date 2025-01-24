// const express = require('express');
// const Monitoring = require('../controllers/Dashboard');
// const authJwt = require('../middleware/auth');
// const router = express.Router();


// // Get dashboard data
// router.get('/data', authJwt.isAuthenticatedUser, Monitoring.getDashboardData);

// module.exports = router;


const express = require('express');
const authJwt = require('../middleware/auth');
const router = express.Router();
const { AdmingetPollinationByMonth, AdmingetCompletedByMonth, AdmingetFailedByMonth, getPollinationByMonthID, getCompletedByMonthId, getFailedByMonthId } = require('../controllers/Dashboard');

// Route to get pollination data by month
router.get('/Adminpollination/month',AdmingetPollinationByMonth);

// Route to get completed data by month
router.get('/Admincompleted/month',AdmingetCompletedByMonth);

// Route to get failed data by month
router.get('/Adminfailed/month',AdmingetFailedByMonth);

router.get('/pollination/month/:userId', authJwt.isAuthenticatedUser, getPollinationByMonthID);

router.get('/completed/month/:userId', authJwt.isAuthenticatedUser, getCompletedByMonthId);

router.get('/failed/month/:userId', authJwt.isAuthenticatedUser, getFailedByMonthId);


module.exports = router;
