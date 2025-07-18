const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const askRoute = require('./routes/ask');
const config = require('./config/config');

const app = express();

// Middleware untuk keamanan
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware untuk logging request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/ask', askRoute);

// Route untuk health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'igimonAi is running!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong!' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: 'Endpoint not found' 
    });
});

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🤖 igimonAi server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🎯 Ask endpoint: http://localhost:${PORT}/ask`);
});