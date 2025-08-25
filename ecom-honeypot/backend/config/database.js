const { Sequelize } = require('sequelize');
const path = require('path');

// Ensure database directory exists
const fs = require('fs');
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite configuration
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dbDir, 'ecommerce_honeypot.sqlite'),
                                logging: false // Set to console.log for debugging
});

module.exports = sequelize;
