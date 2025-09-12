const mongoose = require('mongoose');
const log = require('../utils/logger');

/**
 * Database Connection Module
 * 
 * This module handles the MongoDB connection for the portfolio application.
 * It uses Mongoose ODM to interact with MongoDB and provides connection
 * management with proper error handling and retry logic.
 * 
 * Key Features:
 * - Automatic reconnection on connection loss
 * - Connection pooling for better performance
 * - Graceful shutdown handling
 * - Environment-based configuration
 * - Always connects to database in all environments (no dev mode skip)
 */

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/Portfolio';
        
        // Connection options for better performance and reliability
        this.connectionOptions = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        // Bind event handlers
        this.setupEventHandlers();
    }

    /**
     * Establish connection to MongoDB
     * Always attempts to connect regardless of environment
     * @returns {Promise<void>}
     */
    async connect() {
        try {
            if (this.isConnected) {
                log.database('Database already connected');
                return;
            }

            log.database('Connecting to MongoDB...');
            log.database(`Connection string: ${this.connectionString.replace(/\/\/.*@/, '//<credentials>@')}`);

            await mongoose.connect(this.connectionString, this.connectionOptions);
            
            this.isConnected = true;
            log.success('Successfully connected to MongoDB');
            log.database(`Database: ${mongoose.connection.db.databaseName}`);
            
        } catch (error) {
            log.error('MongoDB connection error', { error: error.message });
            log.error('Please check your MongoDB connection string and ensure MongoDB is running');
            
            // Always exit on connection failure to ensure database is available
            process.exit(1);
        }
    }

    /**
     * Close database connection
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            if (!this.isConnected) {
                return;
            }

            await mongoose.connection.close();
            this.isConnected = false;
            log.database('MongoDB connection closed');
        } catch (error) {
            log.error('Error closing MongoDB connection', { error: error.message });
        }
    }

    /**
     * Check if database is connected
     * @returns {boolean}
     */
    isDbConnected() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get connection status string
     * @returns {string}
     */
    getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }

    /**
     * Setup event handlers for connection monitoring
     */
    setupEventHandlers() {
        // Connection successful
        mongoose.connection.on('connected', () => {
            log.database('Mongoose connected to MongoDB');
            this.isConnected = true;
        });

        // Connection error
        mongoose.connection.on('error', (err) => {
            log.error('Mongoose connection error', { error: err.message });
            this.isConnected = false;
        });

        // Connection disconnected
        mongoose.connection.on('disconnected', () => {
            log.database('Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });

        // MongoDB server reconnected
        mongoose.connection.on('reconnected', () => {
            log.database('Mongoose reconnected to MongoDB');
            this.isConnected = true;
        });

        // If Node process ends, close mongoose connection
        process.on('SIGINT', async () => {
            log.info('Received SIGINT. Gracefully closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            log.info('Received SIGTERM. Gracefully closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });
    }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

/**
 * Initialize database connection
 * This function should be called when starting the application
 */
async function initializeDatabase() {
    await dbConnection.connect();
}

/**
 * Get the database connection instance
 * @returns {DatabaseConnection}
 */
function getDbConnection() {
    return dbConnection;
}

module.exports = {
    initializeDatabase,
    getDbConnection,
    DatabaseConnection
};