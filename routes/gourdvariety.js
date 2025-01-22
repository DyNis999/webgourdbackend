const express = require('express');
const createGourdVariety = require('../controllers/GourdVarietyController');

const router = express.Router();

// Define routes for categoryController
router.get('/getall',createGourdVariety.getAllVarieties);
router.get('/:id ', createGourdVariety.getVarietyById);
router.post('/create', createGourdVariety.createVariety);
router.put('/:id', createGourdVariety.updateVariety);
router.delete('/:id', createGourdVariety.deleteVariety);

module.exports = router;