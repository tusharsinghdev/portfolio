const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// Import logging and utilities
const log = require('./utils/logger');
const { initializeDatabase } = require('./db/connection');
const { errorMiddleware } = require('./utils/apiWrapper');

// Import routes
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection - always connect regardless of environment
initializeDatabase().catch(error => {
    log.error('Failed to initialize database', { error: error.message });
    process.exit(1);
});

/**
 * Security Middleware - Helmet Configuration
 * 
 * Helmet helps secure Express apps by setting various HTTP headers.
 * This configuration is specifically tailored for the portfolio application
 * to allow Font Awesome CDN, inline styles, and necessary script sources.
 * 
 * Use Case:
 * - Protects against common vulnerabilities (XSS, clickjacking, MIME sniffing)
 * - Allows Font Awesome CDN for icons (https://cdnjs.cloudflare.com)
 * - Permits inline styles for embedded CSS in index.html
 * - Enables self-hosted JavaScript execution
 * - Allows images from any HTTPS source and data URIs
 * - Supports self-hosted and CDN fonts
 * 
 * This configuration ensures the portfolio functions correctly while
 * maintaining strong security posture for production deployment.
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// CORS middleware
app.use(cors());

/**
 * Winston HTTP Request Logging Middleware
 * 
 * Custom middleware to log HTTP requests using Winston instead of Morgan.
 * This provides consistent logging format and integrates with our
 * daily rotating log files.
 */
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const method = req.method;
        const url = req.url;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        
        // Log request with appropriate level based on status code
        const logLevel = statusCode >= 400 ? 'warn' : 'info';
        const message = `${method} ${url} ${statusCode} - ${duration}ms`;
        
        log[logLevel](message, {
            method,
            url,
            statusCode,
            duration,
            userAgent,
            ip,
            timestamp: new Date().toISOString()
        });
    });
    
    next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware - serve from root directory since index.html is there
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api', contactRoutes);

// Serve index.html for all routes (SPA behavior)
// Updated path to correctly reference index.html in root directory
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
    log.server(`Portfolio server running on http://localhost:${PORT}`);
    log.server(`Serving static files from: ${__dirname}`);
    log.server(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log.info('All systems operational - ready to handle requests');
});

module.exports = app;