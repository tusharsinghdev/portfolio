const log = require('./logger');
const { sendErrorEmail } = require('./emailService');

/**
 * API Wrapper for Error Handling
 * 
 * This module provides a reusable wrapper for API endpoints to handle
 * errors consistently across the application. It eliminates the need
 * for repetitive try/catch blocks in every route handler.
 * 
 * Features:
 * - Centralized error handling
 * - Automatic error logging with Winston
 * - Error email notifications
 * - Consistent error responses
 * - Request context preservation
 */

/**
 * Wraps an async function to handle errors automatically
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncWrapper = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            await handleError(error, req, res);
        }
    };
};

/**
 * Centralized error handling function
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleError = async (error, req, res) => {
    // Log the error with Winston
    log.error('API Error occurred', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress
    });

    // Send error email notification
    try {
        await sendErrorEmail({
            error,
            request: {
                url: req.url,
                method: req.method,
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection.remoteAddress,
                timestamp: new Date().toISOString()
            }
        });
    } catch (emailError) {
        log.error('Failed to send error email', { emailError: emailError.message });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
        const errors = {};
        Object.keys(error.errors).forEach(key => {
            errors[key] = error.errors[key].message;
        });

        return res.status(400).json({
            success: false,
            message: 'Please check your form data',
            errors
        });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry detected',
            errors: { general: 'This entry appears to be a duplicate' }
        });
    }

    // Handle MongoDB cast errors
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid data format',
            errors: { [error.path]: 'Invalid format for this field' }
        });
    }

    // Handle JWT errors (if using authentication)
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    // Handle rate limiting errors
    if (error.name === 'TooManyRequests') {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }

    // Generic server error
    return res.status(500).json({
        success: false,
        message: 'There was an error processing your request. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

/**
 * Express error handling middleware
 * Use this as the last middleware in your Express app
 */
const errorMiddleware = async (err, req, res, next) => {
    await handleError(err, req, res);
};

/**
 * Validation error helper
 * @param {string} field - Field name
 * @param {string} message - Error message
 */
const createValidationError = (field, message) => {
    const error = new Error(message);
    error.name = 'ValidationError';
    error.errors = {
        [field]: { message }
    };
    return error;
};

/**
 * Not found error helper
 * @param {string} resource - Resource name
 */
const createNotFoundError = (resource = 'Resource') => {
    const error = new Error(`${resource} not found`);
    error.status = 404;
    return error;
};

/**
 * Authentication error helper
 * @param {string} message - Error message
 */
const createAuthError = (message = 'Authentication required') => {
    const error = new Error(message);
    error.status = 401;
    return error;
};

/**
 * Authorization error helper
 * @param {string} message - Error message
 */
const createForbiddenError = (message = 'Access forbidden') => {
    const error = new Error(message);
    error.status = 403;
    return error;
};

module.exports = {
    asyncWrapper,
    handleError,
    errorMiddleware,
    createValidationError,
    createNotFoundError,
    createAuthError,
    createForbiddenError
};