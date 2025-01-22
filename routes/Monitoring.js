const express = require('express');
const Monitoring = require('../controllers/MonitoringController');
const authJwt = require('../middleware/auth');
const upload = require('../utils/multer');
const router = express.Router();

// Get all monitoring records
router.get('/', Monitoring.getMonitorings);

// Get a monitoring record by user ID
router.get('/:userId', authJwt.isAuthenticatedUser, Monitoring.getMonitoringByUserId);

// Create a new monitoring record
// router.post('/',  [authJwt.isAuthenticatedUser, upload.array('pollinatedFlowerImages')], Monitoring.createMonitoring);
router.post(
    "/",
    (req, res, next) => {
        upload.array("pollinatedFlowerImages")(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },
    authJwt.isAuthenticatedUser,
    Monitoring.createMonitoring
);
// Update a monitoring record by ID
router.put('/:id',  [authJwt.isAuthenticatedUser, upload.array('fruitHarvestedImages')], Monitoring.updateMonitoring);

// Delete a monitoring record by ID
router.delete('/:id', authJwt.isAuthenticatedUser, Monitoring.deleteMonitoring);

module.exports = router;
