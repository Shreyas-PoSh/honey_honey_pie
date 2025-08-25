const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    items: {
        type: DataTypes.TEXT, // Store as JSON string
        get() {
            const rawValue = this.getDataValue('items');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('items', JSON.stringify(value));
        }
    },
    shippingStreet: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shippingCity: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shippingState: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shippingZipCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shippingCountry: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paymentResultId: {
        type: DataTypes.STRING
    },
    paymentResultStatus: {
        type: DataTypes.STRING
    },
    paymentResultUpdateTime: {
        type: DataTypes.STRING
    },
    itemsPrice: {
        type: DataTypes.DECIMAL(10, 2),
                               defaultValue: 0.00
    },
    taxPrice: {
        type: DataTypes.DECIMAL(10, 2),
                               defaultValue: 0.00
    },
    shippingPrice: {
        type: DataTypes.DECIMAL(10, 2),
                               defaultValue: 0.00
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
                               defaultValue: 0.00
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    paidAt: {
        type: DataTypes.DATE
    },
    isDelivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deliveredAt: {
        type: DataTypes.DATE
    }
});

module.exports = Order;
