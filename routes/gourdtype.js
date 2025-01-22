const express = require('express');
const createGourdType = require('../controllers/GourdTypeController');

const router = express.Router();

// Define routes for categoryController
router.get('/getall',createGourdType.getAllGourdTypes);
router.get('/:id ', createGourdType.getGourdTypeById);
router.post('/create', createGourdType.createGourdType);
router.put('/:id', createGourdType.updateGourdType);
router.delete('/:id', createGourdType.deleteGourdType);

module.exports = router;