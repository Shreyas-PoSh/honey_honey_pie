const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Very simple route to test
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API Test' });
});

app.listen(PORT, () => {
    console.log(`Minimal server running on port ${PORT}`);
});

module.exports = app;
