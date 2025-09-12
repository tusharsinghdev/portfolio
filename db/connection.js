const mongoose = require('mongoose');

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
 */

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
        
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
     * @returns {Promise<void>}
     */
    async connect() {
        try {
            if (this.isConnected) {
                console.log('🔄 Database already connected');
                return;
            }

            console.log('🔗 Connecting to MongoDB...');
            console.log(`📍 Connection string: ${this.connectionString.replace(/\/\/.*@/, '//<credentials>@')}`);

            await mongoose.connect(this.connectionString, this.connectionOptions);
            
            this.isConnected = true;
            console.log('✅ Successfully connected to MongoDB');
            console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
            
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            console.error('🔧 Please check your MongoDB connection string and ensure MongoDB is running');
            
            // In development, we might want to continue without DB
            if (process.env.NODE_ENV !== 'production') {
                console.log('⚠️  Continuing in development mode without database...');
                return;
            }
            
            // In production, exit the process
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
            console.log('🔌 MongoDB connection closed');
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error.message);
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
            console.log('📡 Mongoose connected to MongoDB');
            this.isConnected = true;
        });

        // Connection error
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err.message);
            this.isConnected = false;
        });

        // Connection disconnected
        mongoose.connection.on('disconnected', () => {
            console.log('🔌 Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });

        // MongoDB server reconnected
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 Mongoose reconnected to MongoDB');
            this.isConnected = true;
        });

        // If Node process ends, close mongoose connection
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT. Gracefully closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM. Gracefully closing MongoDB connection...');
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