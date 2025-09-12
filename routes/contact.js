const express = require('express');
const Enquiry = require('../db/models/Enquiry');
const { getDbConnection } = require('../db/connection');
const { asyncWrapper, createValidationError } = require('../utils/apiWrapper');
const { sendEnquiryEmail } = require('../utils/emailService');
const log = require('../utils/logger');

const router = express.Router();

/**
 * Contact Form Submission API
 * 
 * POST /api/contact
 * 
 * This endpoint handles contact form submissions from the portfolio website.
 * It validates the form data, saves it to MongoDB, and sends email notifications.
 * 
 * Features:
 * - Input validation and sanitization
 * - MongoDB integration with error handling
 * - Email notifications for enquiries
 * - Graceful error handling with appropriate HTTP status codes
 * - Uses API wrapper for consistent error handling
 */

/**
 * Submit contact form data
 * @route POST /api/contact
 * @description Save contact form submission to database and send notifications
 * @access Public
 */
router.post('/contact', asyncWrapper(async (req, res) => {
    log.form('Received contact form submission');

    // Validate required fields
    const { name, email, phone, requirement, submittedAt } = req.body;

    if (!name || name.trim().length === 0) {
        throw createValidationError('name', 'Name is required');
    }

    if (!email && !phone) {
        const error = new Error('Either email or phone number must be provided');
        error.name = 'ValidationError';
        error.errors = {
            email: { message: 'Either email or phone number must be provided' },
            phone: { message: 'Either email or phone number must be provided' }
        };
        throw error;
    }

    // Additional validation
    if (name.length > 50) {
        throw createValidationError('name', 'Name cannot exceed 50 characters');
    }

    if (requirement && requirement.length > 500) {
        throw createValidationError('requirement', 'Requirement description cannot exceed 500 characters');
    }

    // Email validation if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw createValidationError('email', 'Please provide a valid email address');
        }
    }

    // Phone validation if provided
    if (phone) {
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/;
        if (!phoneRegex.test(phone)) {
            throw createValidationError('phone', 'Please provide a valid phone number');
        }
    }

    // Check if database is available
    const dbConnection = getDbConnection();
    if (!dbConnection.isDbConnected()) {
        log.warn('Database not connected, unable to save enquiry');
        throw new Error('Database service temporarily unavailable. Please try again later.');
    }

    // Create new enquiry
    const enquiryData = {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        requirement: requirement?.trim() || null,
        submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
        status: 'new'
    };

    log.database('Saving enquiry to database...');
    const enquiry = new Enquiry(enquiryData);
    const savedEnquiry = await enquiry.save();

    log.success('Enquiry saved successfully');
    log.database(`Enquiry ID: ${savedEnquiry._id}`);

    // Send enquiry notification email
    try {
        await sendEnquiryEmail(savedEnquiry);
        log.email('Enquiry notification email sent successfully');
    } catch (emailError) {
        log.error('Failed to send enquiry notification email', { error: emailError.message });
        // Don't throw error here - enquiry is saved, email is secondary
    }

    // Success response
    res.status(201).json({
        success: true,
        message: 'Thank you for your message! We have received your enquiry and will get back to you soon.',
        enquiryId: savedEnquiry._id,
        submittedAt: savedEnquiry.submittedAt
    });
}));

/**
 * Get enquiry statistics (for admin/dashboard purposes)
 * @route GET /api/contact/stats
 * @description Get basic statistics about enquiries
 * @access Private (could be protected with auth middleware)
 */
router.get('/contact/stats', asyncWrapper(async (req, res) => {
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
}));

module.exports = router;