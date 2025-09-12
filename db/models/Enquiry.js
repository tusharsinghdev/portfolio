const mongoose = require('mongoose');

/**
 * Enquiry Schema Definition
 * 
 * This schema defines the structure for storing contact form submissions
 * in the Portfolio database under the "Enquiry" collection.
 * 
 * Collection: Portfolio.Enquiry
 * Purpose: Store contact form submissions from website visitors
 */

const enquirySchema = new mongoose.Schema({
    // Name field - required, trimmed, max 50 characters
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
        minlength: [1, 'Name cannot be empty']
    },
    
    // Email field - optional but validated if provided
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                // If email is provided, it must be valid
                if (!email) return true; // Allow empty
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: 'Please provide a valid email address'
        }
    },
    
    // Phone field - optional but validated if provided
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function(phone) {
                // If phone is provided, it must be valid
                if (!phone) return true; // Allow empty
                const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/;
                return phoneRegex.test(phone);
            },
            message: 'Please provide a valid phone number'
        }
    },
    
    // Requirement description - optional, max 500 characters
    requirement: {
        type: String,
        trim: true,
        maxlength: [500, 'Requirement description cannot exceed 500 characters']
    },
    
    // Submission timestamp
    submittedAt: {
        type: Date,
        default: Date.now,
        index: true // Index for better query performance
    },
    
    // IP address of the submitter (for analytics/security)
    ipAddress: {
        type: String,
        trim: true
    },
    
    // User agent information
    userAgent: {
        type: String,
        trim: true
    },
    
    // Status of the enquiry (for follow-up tracking)
    status: {
        type: String,
        enum: ['new', 'contacted', 'in_progress', 'resolved', 'closed'],
        default: 'new',
        index: true
    },
    
    // Notes for follow-up (internal use)
    notes: {
        type: String,
        trim: true
    },
    
    // Follow-up date
    followUpDate: {
        type: Date
    }
}, {
    // Schema options
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false, // Disable __v field
    collection: 'Enquiry' // Explicit collection name
});

// Indexes for better query performance
enquirySchema.index({ submittedAt: -1 }); // Most recent first
enquirySchema.index({ status: 1 }); // Filter by status
enquirySchema.index({ email: 1 }); // Find by email
enquirySchema.index({ createdAt: -1 }); // Sort by creation date

// Validation for "either email or phone required"
enquirySchema.pre('save', function(next) {
    if (!this.email && !this.phone) {
        const error = new Error('Either email or phone number must be provided');
        error.name = 'ValidationError';
        return next(error);
    }
    next();
});

// Virtual for formatted submission date
enquirySchema.virtual('formattedSubmissionDate').get(function() {
    return this.submittedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Virtual for days since submission
enquirySchema.virtual('daysSinceSubmission').get(function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.submittedAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to mark as contacted
enquirySchema.methods.markAsContacted = function() {
    this.status = 'contacted';
    return this.save();
};

// Static method to get recent enquiries
enquirySchema.statics.getRecentEnquiries = function(limit = 10) {
    return this.find()
        .sort({ submittedAt: -1 })
        .limit(limit)
        .lean();
};

// Static method to get enquiries by status
enquirySchema.statics.getByStatus = function(status) {
    return this.find({ status })
        .sort({ submittedAt: -1 })
        .lean();
};

// Export the model
module.exports = mongoose.model('Enquiry', enquirySchema);