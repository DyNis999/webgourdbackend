const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Define routes for categoryController
router.get('/getall', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/create', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;