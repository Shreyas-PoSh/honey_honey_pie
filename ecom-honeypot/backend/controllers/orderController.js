const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const logger = require('../utils/logger'); // Add this line

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            logger.logSuspiciousActivity('CREATE_ORDER_EMPTY', { userId: req.user.id }, req);
            return res.status(400).json({ message: 'No order items' });
        }

        // Create order
        const order = await Order.create({
            userId: req.user.id,
            items: orderItems,
            shippingStreet: shippingAddress.street,
            shippingCity: shippingAddress.city,
            shippingState: shippingAddress.state,
            shippingZipCode: shippingAddress.postalCode,
            shippingCountry: shippingAddress.country,
            paymentMethod: paymentMethod,
            itemsPrice: itemsPrice,
            taxPrice: taxPrice,
            shippingPrice: shippingPrice,
            totalPrice: totalPrice
        });

        // Log order creation
        logger.logOrderCreated(order.id, req.user.id, totalPrice, null, req);

        // Update product stock
        for (const item of orderItems) {
            const product = await Product.findByPk(item.productId);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }

        // Clear user's cart
        await Cart.destroy({ where: { userId: req.user.id } });

        res.status(201).json(order);
    } catch (error) {
        console.error('Create order error:', error);
        logger.logSuspiciousActivity('CREATE_ORDER_ERROR', { error: error.message, userId: req.user.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (order) {
            // Check if user is authorized to view this order
            if (order.userId !== req.user.id) {
                logger.logSuspiciousActivity('GET_ORDER_UNAUTHORIZED', { orderId: req.params.id, userId: req.user.id }, req);
                return res.status(401).json({ message: 'Not authorized' });
            }

            logger.logApiAccess(`/api/orders/${req.params.id}`, 'GET', req.user.id, null, req);
            res.json(order);
        } else {
            logger.logSuspiciousActivity('GET_ORDER_NOT_FOUND', { orderId: req.params.id }, req);
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Get order error:', error);
        logger.logSuspiciousActivity('GET_ORDER_ERROR', { error: error.message, orderId: req.params.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (order) {
            // Check if user is authorized to update this order
            if (order.userId !== req.user.id) {
                logger.logSuspiciousActivity('UPDATE_ORDER_PAID_UNAUTHORIZED', { orderId: req.params.id, userId: req.user.id }, req);
                return res.status(401).json({ message: 'Not authorized' });
            }

            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentResultId = req.body.id || '';
            order.paymentResultStatus = req.body.status || '';
            order.paymentResultUpdateTime = req.body.update_time || '';

            const updatedOrder = await order.save();
            logger.logApiAccess(`/api/orders/${req.params.id}/pay`, 'PUT', req.user.id, null, req);
            res.json(updatedOrder);
        } else {
            logger.logSuspiciousActivity('UPDATE_ORDER_PAID_NOT_FOUND', { orderId: req.params.id }, req);
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Update order to paid error:', error);
        logger.logSuspiciousActivity('UPDATE_ORDER_PAID_ERROR', { error: error.message, orderId: req.params.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = new Date();

            const updatedOrder = await order.save();
            logger.logApiAccess(`/api/orders/${req.params.id}/deliver`, 'PUT', req.user.id, null, req);
            res.json(updatedOrder);
        } else {
            logger.logSuspiciousActivity('UPDATE_ORDER_DELIVERED_NOT_FOUND', { orderId: req.params.id }, req);
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Update order to delivered error:', error);
        logger.logSuspiciousActivity('UPDATE_ORDER_DELIVERED_ERROR', { error: error.message, orderId: req.params.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        logger.logApiAccess('/api/orders/myorders', 'GET', req.user.id, null, req);
        res.json(orders);
    } catch (error) {
        console.error('Get my orders error:', error);
        logger.logSuspiciousActivity('GET_MY_ORDERS_ERROR', { error: error.message, userId: req.user.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            order: [['createdAt', 'DESC']]
        });
        logger.logApiAccess('/api/orders', 'GET', req.user.id, null, req);
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        logger.logSuspiciousActivity('GET_ORDERS_ERROR', { error: error.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders
};
