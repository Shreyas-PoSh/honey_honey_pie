const express = require('express');
const {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
.get(getProducts)
.post(protect, createProduct);

router.route('/:id')
.get(getProductById)
.delete(protect, deleteProduct)
.put(protect, updateProduct);

module.exports = router;
