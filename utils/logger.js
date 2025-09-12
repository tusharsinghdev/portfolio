const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Winston Logger Configuration
 * 
 * This module sets up Winston logging with daily rotating files.
 * Log files are created daily with format: logs-DD-MM-YYYY.log
 * 
 * Features:
 * - Daily log rotation
 * - Console logging in development
 * - File logging for all environments
 * - Custom date format for log file names
 * - Different log levels (error, warn, info, debug)
 */

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Custom format for log file names (DD-MM-YYYY format)
const getLogFileName = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `logs-${day}-${month}-${year}.log`;
};

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
        })
    ),
    transports: [
        // Daily rotating file transport
        new DailyRotateFile({
            dirname: logsDir,
            filename: 'logs-%DATE%.log',
            datePattern: 'DD-MM-YYYY',
            maxSize: '20m',
            maxFiles: '30d',
            auditFile: path.join(logsDir, 'audit.json'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Error file transport
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
                format: 'HH:mm:ss'
            }),
            winston.format.printf(({ timestamp, level, message, stack }) => {
                return `${timestamp} ${level}: ${stack || message}`;
            })
        )
    }));
}

/**
 * Enhanced logging methods with emojis for better readability
 */
const log = {
    error: (message, meta = {}) => logger.error(`❌ ${message}`, meta),
    warn: (message, meta = {}) => logger.warn(`⚠️ ${message}`, meta),
    info: (message, meta = {}) => logger.info(`ℹ️ ${message}`, meta),
    debug: (message, meta = {}) => logger.debug(`🐛 ${message}`, meta),
    success: (message, meta = {}) => logger.info(`✅ ${message}`, meta),
    database: (message, meta = {}) => logger.info(`🗄️ ${message}`, meta),
    server: (message, meta = {}) => logger.info(`🚀 ${message}`, meta),
    email: (message, meta = {}) => logger.info(`📧 ${message}`, meta),
    form: (message, meta = {}) => logger.info(`📝 ${message}`, meta)
};

module.exports = log;