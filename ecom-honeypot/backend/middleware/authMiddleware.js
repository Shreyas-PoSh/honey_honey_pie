const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger'); // Add this line

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Check if token exists and is not empty
            if (!token || token === '') {
                logger.logSuspiciousActivity('AUTH_MISSING_TOKEN', { ip: req.ip, url: req.originalUrl }, req);
                return res.status(401).json({ message: 'Not authorized, no token provided' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                logger.logSuspiciousActivity('AUTH_USER_NOT_FOUND', { token: token.substring(0, 10) + '...' }, req);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Log API access
            logger.logApiAccess(req.originalUrl, req.method, req.user.id, null, req);

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            logger.logSuspiciousActivity('AUTH_TOKEN_ERROR', { error: error.name, token: token ? token.substring(0, 10) + '...' : 'none' }, req);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token invalid' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        logger.logSuspiciousActivity('AUTH_NO_TOKEN', { ip: req.ip, url: req.originalUrl }, req);
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
