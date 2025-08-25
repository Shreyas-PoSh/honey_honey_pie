const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');
const logger = require('./utils/logger');

// Load routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
    logger.logActivity('HTTP_REQUEST', {
        method: req.method,
        url: req.url,
        query: req.query
    }, req);
    next();
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes - Keep these simple and clear
app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
    logger.logApiAccess('/api/health', 'GET', null, null, req);
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
             uptime: process.uptime(),
             database: 'SQLite'
    });
});

// Serve specific HTML files
app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});

app.get('/cart.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cart.html'));
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    // Make sure API routes return 404 if not found
    if (req.path.startsWith('/api/')) {
        logger.logSuspiciousActivity('API_NOT_FOUND', { path: req.path }, req);
        return res.status(404).json({ message: 'API route not found' });
    }
    // Serve the main HTML file for all other routes
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Test database connection and sync models
sequelize.authenticate()
.then(() => {
    console.log('SQLite database connected successfully');
    logger.logActivity('SYSTEM_STARTUP', { event: 'DATABASE_CONNECTED' }, {
        ip: 'localhost',
        method: 'SYSTEM',
        url: '/system/startup'
    });
    return sequelize.sync({ alter: true });
})
.then(() => {
    console.log('All models synced successfully');
    logger.logActivity('SYSTEM_STARTUP', { event: 'MODELS_SYNCED' }, {
        ip: 'localhost',
        method: 'SYSTEM',
        url: '/system/startup'
    });
})
.catch(err => {
    console.error('Database error:', err);
    logger.logActivity('SYSTEM_ERROR', { event: 'DATABASE_ERROR', error: err.message }, {
        ip: 'localhost',
        method: 'SYSTEM',
        url: '/system/error'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    logger.logSuspiciousActivity('GLOBAL_ERROR', { error: err.message, stack: err.stack }, req);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏠 Frontend: http://localhost:${PORT}`);

    // Log server startup with proper request-like object
    logger.logActivity('SYSTEM_STARTUP', {
        event: 'SERVER_STARTED',
        port: PORT,
        timestamp: new Date().toISOString()
    }, {
        ip: 'localhost',
        method: 'SYSTEM',
        url: '/system/startup',
        headers: {}
    });
});

module.exports = app;
