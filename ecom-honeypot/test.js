const { match } = require('path-to-regexp');

// Test basic functionality
try {
    const fn = match('/user/:name');
    const result = fn('/user/john');
    console.log('path-to-regexp working:', result);
} catch (error) {
    console.error('path-to-regexp error:', error);
}

console.log('Test completed');
