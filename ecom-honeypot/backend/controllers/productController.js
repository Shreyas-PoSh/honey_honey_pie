const Product = require('../models/Product');
const logger = require('../utils/logger'); // Add this line

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = 10;
        const page = Number(req.query.pageNumber) || 1;

        const keyword = req.query.keyword
        ? {
            name: {
                [Product.sequelize.Op.like]: `%${req.query.keyword}%`
            }
        }
        : {};

        const count = await Product.count({ where: keyword });
        const products = await Product.findAll({
            where: keyword,
            limit: pageSize,
            offset: pageSize * (page - 1),
                                               order: [['createdAt', 'DESC']]
        });

        // Log product listing access
        logger.logApiAccess('/api/products', 'GET', req.user?.id || null, req.headers['x-session-id'], req);

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
                 total: count
        });
    } catch (error) {
        console.error('Get products error:', error);
        logger.logSuspiciousActivity('GET_PRODUCTS_ERROR', { error: error.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (product) {
            // Log product view
            logger.logProductView(req.params.id, req.user?.id || null, req.headers['x-session-id'], req);
            res.json(product);
        } else {
            logger.logSuspiciousActivity('GET_PRODUCT_NOT_FOUND', { productId: req.params.id }, req);
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Get product error:', error);
        logger.logSuspiciousActivity('GET_PRODUCT_ERROR', { error: error.message, productId: req.params.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (product) {
            await product.destroy();
            logger.logApiAccess(`/api/products/${req.params.id}`, 'DELETE', req.user?.id || null, null, req);
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Delete product error:', error);
        logger.logSuspiciousActivity('DELETE_PRODUCT_ERROR', { error: error.message, productId: req.params.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const product = await Product.create({
            name: 'Sample Name',
            price: 0,
            user: req.user.id,
            image: '/images/sample.jpg',
            brand: 'Sample Brand',
            category: 'Sample Category',
            countInStock: 0,
            numReviews: 0,
            description: 'Sample Description'
        });

        logger.logApiAccess('/api/products', 'POST', req.user?.id || null, null, req);
        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        logger.logSuspiciousActivity('CREATE_PRODUCT_ERROR', { error: error.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            image,
            brand,
            category,
            countInStock
        } = req.body;

        const product = await Product.findByPk(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price || product.price;
            product.description = description || product.description;
            product.image = image || product.image;
            product.brand = brand || product.brand;
            product.category = category || product.category;
            product.countInStock = countInStock || product.countInStock;

            const updatedProduct = await product.save();
            logger.logApiAccess(`/api/products/${req.params.id}`, 'PUT', req.user?.id || null, null, req);
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Update product error:', error);
        logger.logSuspiciousActivity('UPDATE_PRODUCT_ERROR', { error: error.message, productId: req.params.id }, req);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
};
