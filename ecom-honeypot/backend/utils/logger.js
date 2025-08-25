const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

class HoneypotLogger {
    constructor() {
        this.logFile = path.join(logsDir, 'honeypot_activity.log');
        this.splunkFile = path.join(logsDir, 'splunk_input.log');
    }

    // Format date to ISO string
    formatISO(date) {
        return date.toISOString();
    }

    // Log activity in structured format for Splunk
    logActivity(activityType, details, req) {
        const timestamp = new Date().toISOString();
        const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';

        // Handle user agent correctly - check if req.get exists (Express) or use headers (HTTP)
        let userAgent = 'unknown';
        if (req?.get && typeof req.get === 'function') {
            userAgent = req.get('User-Agent') || 'unknown';
        } else if (req?.headers) {
            userAgent = req.headers['user-agent'] || 'unknown';
        }

        const method = req?.method || 'unknown';
        const url = req?.originalUrl || req?.url || 'unknown';

        // Create structured log entry
        const logEntry = {
            timestamp,
            activity_type: activityType,
            ip_address: ip,
            user_agent: userAgent,
            http_method: method,
            url: url,
            details: details,
            session_id: details.sessionId || 'unknown',
            user_id: details.userId || 'unknown'
        };

        // Write to general log file
        const logMessage = `${timestamp} [${activityType}] ${ip} ${method} ${url} ${JSON.stringify(details)}\n`;
        fs.appendFileSync(this.logFile, logMessage);

        // Write to Splunk input file (JSON format)
        const splunkMessage = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.splunkFile, splunkMessage);

        console.log(`[HONEYPOT] ${activityType}:`, JSON.stringify(logEntry));
    }

    // Log authentication attempts
    logAuthAttempt(email, success, userId, req) {
        this.logActivity('AUTH_ATTEMPT', {
            email: email,
            success: success,
            userId: userId,
            sessionId: req?.sessionID
        }, req);
    }

    // Log cart operations
    logCartOperation(operation, productId, quantity, userId, sessionId, req) {
        this.logActivity('CART_OPERATION', {
            operation: operation,
            product_id: productId,
            quantity: quantity,
            user_id: userId,
            session_id: sessionId
        }, req);
    }

    // Log product views
    logProductView(productId, userId, sessionId, req) {
        this.logActivity('PRODUCT_VIEW', {
            product_id: productId,
            user_id: userId,
            session_id: sessionId
        }, req);
    }

    // Log order creation
    logOrderCreated(orderId, userId, totalAmount, sessionId, req) {
        this.logActivity('ORDER_CREATED', {
            order_id: orderId,
            user_id: userId,
            total_amount: totalAmount,
            session_id: sessionId
        }, req);
    }

    // Log suspicious activities
    logSuspiciousActivity(activity, details, req) {
        this.logActivity('SUSPICIOUS_ACTIVITY', {
            activity: activity,
            details: details,
            sessionId: req?.sessionID
        }, req);
    }

    // Log API access
    logApiAccess(endpoint, method, userId, sessionId, req) {
        this.logActivity('API_ACCESS', {
            endpoint: endpoint,
            method: method,
            user_id: userId,
            session_id: sessionId
        }, req);
    }
}

module.exports = new HoneypotLogger();
