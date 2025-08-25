const sequelize = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const bcrypt = require('bcryptjs');

// Sample users
const users = [
    {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        street: '123 Admin St',
        city: 'Adminville',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        phone: '555-1234'
    },
{
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    street: '456 Main St',
    city: 'Anytown',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phone: '555-5678'
},
{
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'securepassword',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
    street: '789 Oak Ave',
    city: 'Somewhere',
    state: 'TX',
    zipCode: '75001',
    country: 'USA',
    phone: '555-9012'
}
];

// Sample products
const products = [
    {
        name: 'Smartphone X Pro',
        description: 'Latest smartphone with advanced features and high-resolution camera',
        price: 899.99,
        category: 'Electronics',
        brand: 'TechBrand',
        stock: 25,
        images: ['https://via.placeholder.com/300x300?text=Smartphone'],
        specifications: {
            'Screen Size': '6.7 inches',
            'Storage': '128GB',
            'Camera': '48MP',
            'Battery': '5000mAh'
        },
        ratingAverage: 4.5,
        ratingCount: 128,
        isFeatured: true
    },
{
    name: 'Wireless Headphones',
    description: 'Premium wireless headphones with noise cancellation',
    price: 199.99,
    category: 'Electronics',
    brand: 'SoundMax',
    stock: 50,
    images: ['https://via.placeholder.com/300x300?text=Headphones'],
    specifications: {
        'Battery Life': '30 hours',
        'Connectivity': 'Bluetooth 5.0',
        'Weight': '250g',
        'Color': 'Black'
    },
    ratingAverage: 4.2,
    ratingCount: 89,
    isFeatured: true
},
{
    name: 'Laptop Ultra Slim',
    description: 'Ultra-slim laptop with powerful performance',
    price: 1299.99,
    category: 'Computers',
    brand: 'TechBrand',
    stock: 15,
    images: ['https://via.placeholder.com/300x300?text=Laptop'],
    specifications: {
        'Processor': 'Intel i7',
        'RAM': '16GB',
        'Storage': '512GB SSD',
        'Screen': '14 inch'
    },
    ratingAverage: 4.7,
    ratingCount: 67,
    isFeatured: true
},
{
    name: 'Smart Watch Series 5',
    description: 'Advanced smartwatch with health monitoring',
    price: 299.99,
    category: 'Wearables',
    brand: 'WatchCorp',
    stock: 30,
    images: ['https://via.placeholder.com/300x300?text=Smartwatch'],
    specifications: {
        'Display': 'AMOLED',
        'Water Resistance': '50m',
        'Battery': '18 hours',
        'Health Features': 'Heart Rate, GPS'
    },
    ratingAverage: 4.0,
    ratingCount: 156,
    isFeatured: false
},
{
    name: 'Gaming Console',
    description: 'Next-generation gaming console with 4K support',
    price: 499.99,
    category: 'Gaming',
    brand: 'GameTech',
    stock: 10,
    images: ['https://via.placeholder.com/300x300?text=Gaming+Console'],
    specifications: {
        'Storage': '1TB SSD',
        'Resolution': '4K',
        'Frame Rate': '120fps',
        'Controllers': '2 included'
    },
    ratingAverage: 4.8,
    ratingCount: 203,
    isFeatured: true
},
{
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 360-degree sound',
    price: 89.99,
    category: 'Audio',
    brand: 'SoundMax',
    stock: 40,
    images: ['https://via.placeholder.com/300x300?text=Speaker'],
    specifications: {
        'Power': '20W',
        'Battery': '12 hours',
        'Waterproof': 'IPX7',
        'Connectivity': 'Bluetooth 5.2'
    },
    ratingAverage: 4.1,
    ratingCount: 74,
    isFeatured: false
}
];

async function seedDatabase() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected successfully');

        // Sync models
        console.log('Syncing models...');
        await sequelize.sync({ force: true }); // This will drop and recreate tables
        console.log('Models synced successfully');

        // Create users
        console.log('Creating users...');
        const createdUsers = [];
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            const createdUser = await User.create({
                ...user,
                password: hashedPassword
            });
            createdUsers.push(createdUser);
            console.log(`Created user: ${user.username}`);
        }

        // Create products
        console.log('Creating products...');
        for (const product of products) {
            await Product.create(product);
            console.log(`Created product: ${product.name}`);
        }

        console.log('Sample data created successfully!');
        console.log(`${createdUsers.length} users and ${products.length} products added.`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
