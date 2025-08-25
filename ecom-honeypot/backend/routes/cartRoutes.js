const express = require('express');
const {
    getCartItems,
    addToCart,
    removeFromCart,
    updateCartItem
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
.get(getCartItems)
.post(addToCart);

router.route('/:productId')
.delete(removeFromCart)
.put(updateCartItem);

module.exports = router;
