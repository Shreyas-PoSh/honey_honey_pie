const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger'); // Add this line

// @desc    Get cart items
// @route   GET /api/cart
// @access  Public
const getCartItems = async (req, res) => {
    try {
        let cart;

        // Check if user is logged in
        if (req.user) {
            // Get user's cart
            cart = await Cart.findOne({ where: { userId: req.user.id } });
            // Log cart access
            logger.logCartOperation('VIEW', null, null, req.user.id, null, req);
        } else if (req.headers['x-session-id']) {
            // Get guest cart by session ID
            cart = await Cart.findOne({ where: { sessionId: req.headers['x-session-id'] } });
            // Log cart access
            logger.logCartOperation('VIEW', null, null, null, req.headers['x-session-id'], req);
        } else {
            // No cart found
            return res.json({ cartItems: [] });
        }

        if (cart) {
            res.json({ cartItems: cart.items || [] });
        } else {
            res.json({ cartItems: [] });
        }
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Public
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Validate product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            logger.logSuspiciousActivity('ADD_TO_CART_INVALID_PRODUCT', { productId }, req);
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check stock
        if (product.stock < quantity) {
            logger.logSuspiciousActivity('ADD_TO_CART_INSUFFICIENT_STOCK', { productId, quantity, stock: product.stock }, req);
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        let cart;
        let isNewCart = false;

        // Check if user is logged in
        if (req.user) {
            // Find or create user's cart
            [cart, created] = await Cart.findOrCreate({
                where: { userId: req.user.id },
                defaults: { userId: req.user.id, items: [] }
            });
            isNewCart = created;
            // Log cart operation
            logger.logCartOperation('ADD', productId, quantity, req.user.id, null, req);
        } else {
            // Handle guest cart
            const sessionId = req.headers['x-session-id'] || require('crypto').randomBytes(16).toString('hex');

            [cart, created] = await Cart.findOrCreate({
                where: { sessionId: sessionId },
                defaults: { sessionId: sessionId, items: [] }
            });
            isNewCart = created;

            // Send session ID back to client
            res.header('x-session-id', sessionId);
            // Log cart operation
            logger.logCartOperation('ADD', productId, quantity, null, sessionId, req);
        }

        // Get current items
        let items = cart.items || [];

        // Check if product already in cart
        const existingItemIndex = items.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
            // Update quantity
            items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            items.push({
                productId: product.id,
                name: product.name,
                image: product.images ? product.images[0] : '',
                price: parseFloat(product.price),
                       quantity: quantity
            });
        }

        // Update cart
        cart.items = items;
        await cart.save();

        res.status(201).json({
            message: 'Item added to cart',
            cartItems: cart.items,
            sessionId: cart.sessionId
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        logger.logSuspiciousActivity('ADD_TO_CART_ERROR', { error: error.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Public
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        let cart;

        // Check if user is logged in
        if (req.user) {
            cart = await Cart.findOne({ where: { userId: req.user.id } });
            // Log cart operation
            logger.logCartOperation('REMOVE', productId, null, req.user.id, null, req);
        } else if (req.headers['x-session-id']) {
            cart = await Cart.findOne({ where: { sessionId: req.headers['x-session-id'] } });
            // Log cart operation
            logger.logCartOperation('REMOVE', productId, null, null, req.headers['x-session-id'], req);
        }

        if (!cart) {
            logger.logSuspiciousActivity('REMOVE_FROM_CART_NOT_FOUND', { productId }, req);
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Remove item from cart
        let items = cart.items || [];
        items = items.filter(item => item.productId !== parseInt(productId));

        cart.items = items;
        await cart.save();

        res.json({ message: 'Item removed from cart', cartItems: cart.items });
    } catch (error) {
        console.error('Remove from cart error:', error);
        logger.logSuspiciousActivity('REMOVE_FROM_CART_ERROR', { error: error.message, productId: req.params.productId }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Public
const updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity <= 0) {
            logger.logSuspiciousActivity('UPDATE_CART_INVALID_QUANTITY', { productId, quantity }, req);
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        let cart;

        // Check if user is logged in
        if (req.user) {
            cart = await Cart.findOne({ where: { userId: req.user.id } });
            // Log cart operation
            logger.logCartOperation('UPDATE', productId, quantity, req.user.id, null, req);
        } else if (req.headers['x-session-id']) {
            cart = await Cart.findOne({ where: { sessionId: req.headers['x-session-id'] } });
            // Log cart operation
            logger.logCartOperation('UPDATE', productId, quantity, null, req.headers['x-session-id'], req);
        }

        if (!cart) {
            logger.logSuspiciousActivity('UPDATE_CART_NOT_FOUND', { productId, quantity }, req);
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Validate product exists and check stock
        const product = await Product.findByPk(productId);
        if (!product) {
            logger.logSuspiciousActivity('UPDATE_CART_INVALID_PRODUCT', { productId, quantity }, req);
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < quantity) {
            logger.logSuspiciousActivity('UPDATE_CART_INSUFFICIENT_STOCK', { productId, quantity, stock: product.stock }, req);
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Update item quantity
        let items = cart.items || [];
        const itemIndex = items.findIndex(item => item.productId === parseInt(productId));

        if (itemIndex > -1) {
            items[itemIndex].quantity = quantity;
        } else {
            logger.logSuspiciousActivity('UPDATE_CART_ITEM_NOT_FOUND', { productId, quantity }, req);
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cart.items = items;
        await cart.save();

        res.json({ message: 'Cart updated', cartItems: cart.items });
    } catch (error) {
        console.error('Update cart error:', error);
        logger.logSuspiciousActivity('UPDATE_CART_ERROR', { error: error.message, productId: req.params.productId }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCartItems,
    addToCart,
    removeFromCart,
    updateCartItem
};
