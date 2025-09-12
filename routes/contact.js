const express = require('express');
const Enquiry = require('../db/models/Enquiry');
const { getDbConnection } = require('../db/connection');

const router = express.Router();

/**
 * Contact Form Submission API
 * 
 * POST /api/contact
 * 
 * This endpoint handles contact form submissions from the portfolio website.
 * It validates the form data, saves it to MongoDB, and returns appropriate responses.
 * 
 * Features:
 * - Input validation and sanitization
 * - MongoDB integration with error handling
 * - IP address and user agent tracking
 * - Graceful error handling with appropriate HTTP status codes
 */

/**
 * Submit contact form data
 * @route POST /api/contact
 * @description Save contact form submission to database
 * @access Public
 */
router.post('/contact', async (req, res) => {
    try {
        console.log('📝 Received contact form submission');
        console.log('📊 Form data:', {
            name: req.body.name,
            email: req.body.email || '[not provided]',
            phone: req.body.phone || '[not provided]',
            requirementLength: req.body.requirement?.length || 0
        });

        // Extract client information
        const clientIP = req.ip || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                        req.headers['x-forwarded-for']?.split(',')[0];
                        
        const userAgent = req.headers['user-agent'] || 'Unknown';

        // Validate required fields
        const { name, email, phone, requirement, submittedAt } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Name is required',
                errors: { name: 'Name is required' }
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Either email or phone number must be provided',
                errors: { 
                    email: 'Either email or phone number must be provided',
                    phone: 'Either email or phone number must be provided'
                }
            });
        }

        // Additional validation
        if (name.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Name cannot exceed 50 characters',
                errors: { name: 'Name cannot exceed 50 characters' }
            });
        }

        if (requirement && requirement.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Requirement description cannot exceed 500 characters',
                errors: { requirement: 'Requirement description cannot exceed 500 characters' }
            });
        }

        // Email validation if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address',
                    errors: { email: 'Please provide a valid email address' }
                });
            }
        }

        // Phone validation if provided
        if (phone) {
            const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid phone number',
                    errors: { phone: 'Please provide a valid phone number' }
                });
            }
        }

        // Check if database is available
        const dbConnection = getDbConnection();
        if (!dbConnection.isDbConnected()) {
            console.log('⚠️  Database not connected, storing form data in logs');
            
            // Log the form submission for manual processing
            console.log('📋 FORM SUBMISSION (DB Offline):', {
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                requirement: requirement?.trim() || null,
                submittedAt: submittedAt || new Date().toISOString(),
                clientIP,
                userAgent,
                timestamp: new Date().toISOString()
            });

            return res.json({
                success: true,
                message: 'Thank you for your message! We have received your enquiry and will get back to you soon.',
                enquiryId: `offline_${Date.now()}`
            });
        }

        // Create new enquiry
        const enquiryData = {
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            requirement: requirement?.trim() || null,
            submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
            ipAddress: clientIP,
            userAgent: userAgent,
            status: 'new'
        };

        console.log('💾 Saving enquiry to database...');
        const enquiry = new Enquiry(enquiryData);
        const savedEnquiry = await enquiry.save();

        console.log('✅ Enquiry saved successfully');
        console.log('🆔 Enquiry ID:', savedEnquiry._id);

        // Success response
        res.status(201).json({
            success: true,
            message: 'Thank you for your message! We have received your enquiry and will get back to you soon.',
            enquiryId: savedEnquiry._id,
            submittedAt: savedEnquiry.submittedAt
        });

    } catch (error) {
        console.error('❌ Error processing contact form:', error);

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

        // Handle duplicate key errors (if any unique constraints exist)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate entry detected',
                errors: { general: 'This enquiry appears to be a duplicate' }
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'There was an error processing your request. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Get enquiry statistics (for admin/dashboard purposes)
 * @route GET /api/contact/stats
 * @description Get basic statistics about enquiries
 * @access Private (could be protected with auth middleware)
 */
router.get('/contact/stats', async (req, res) => {
    try {
        const dbConnection = getDbConnection();
        
        if (!dbConnection.isDbConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database not available'
            });
        }

        const totalEnquiries = await Enquiry.countDocuments();
        const newEnquiries = await Enquiry.countDocuments({ status: 'new' });
        const recentEnquiries = await Enquiry.getRecentEnquiries(5);

        res.json({
            success: true,
            data: {
                totalEnquiries,
                newEnquiries,
                contactedEnquiries: await Enquiry.countDocuments({ status: 'contacted' }),
                recentEnquiries: recentEnquiries.map(enquiry => ({
                    id: enquiry._id,
                    name: enquiry.name,
                    email: enquiry.email,
                    phone: enquiry.phone,
                    submittedAt: enquiry.submittedAt,
                    status: enquiry.status
                }))
            }
        });

    } catch (error) {
        console.error('❌ Error fetching enquiry stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router;