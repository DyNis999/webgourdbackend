const express = require('express');
const authJwt = require('../middleware/auth');
const router = express.Router();
const { 
  AdmingetPollinationByWeek,
  AdmingetCompletedByWeek,
  AdmingetFailedByWeek,
  getPollinationByWeekID,
  getCompletedByWeekId,
  getFailedByWeekId,
  getGourdTypeUserSummary,
  getUserCount,
  getPostCount,
  getOverallPollinationStats
} = require('../controllers/Dashboard');

router.get('/overall-stats', getOverallPollinationStats);

router.get('/Adminpollination/week', AdmingetPollinationByWeek);

// Route to get completed data by week
router.get('/Admincompleted/week', AdmingetCompletedByWeek);

// Route to get failed data by week
router.get('/Adminfailed/week', AdmingetFailedByWeek);

router.get('/users/count', getUserCount);
router.get('/posts/count', getPostCount);

router.get('/GourdTypeUserSummary', getGourdTypeUserSummary);// Route to get pollination data by week


router.get('/pollination/week/:userId', authJwt.isAuthenticatedUser, getPollinationByWeekID);

router.get('/completed/week/:userId', authJwt.isAuthenticatedUser, getCompletedByWeekId);

router.get('/failed/week/:userId', authJwt.isAuthenticatedUser, getFailedByWeekId);



module.exports = router;