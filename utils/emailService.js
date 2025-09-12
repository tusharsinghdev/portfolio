const nodemailer = require('nodemailer');
const log = require('./logger');

/**
 * Email Service Module
 * 
 * This module provides email functionality using Nodemailer.
 * It includes templates for error notifications and enquiry confirmations.
 * 
 * Features:
 * - Reusable email utility for any recipient/cc
 * - Error email template with stack trace and request details
 * - Enquiry email template with clean formatting
 * - SMTP configuration from environment variables
 * - Automatic error handling and logging
 */

// Create transporter with SMTP configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Generic email sender function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.cc - CC email address (optional)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 */
const sendEmail = async ({ to, cc, subject, html, text }) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Portfolio <noreply@portfolio.com>',
            to,
            cc,
            subject,
            html,
            text
        };

        const result = await transporter.sendMail(mailOptions);
        log.email(`Email sent successfully to ${to}`, { messageId: result.messageId });
        return result;
    } catch (error) {
        log.error('Failed to send email', { 
            error: error.message,
            to,
            subject
        });
        throw error;
    }
};

/**
 * Error Email Template
 * Creates a clean HTML template for error notifications
 */
const createErrorEmailTemplate = ({ error, request }) => {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Encountered In Portfolio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #dc2626;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 {
            color: #dc2626;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }
        .detail-label {
            font-weight: 600;
            color: #555;
            min-width: 120px;
            margin-right: 10px;
        }
        .detail-value {
            color: #333;
            flex: 1;
            word-break: break-all;
        }
        .stack-trace {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                min-width: auto;
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🚨 Error Encountered In Portfolio</h1>
        </div>

        <div class="section">
            <h2>📅 Error Details</h2>
            <div class="detail-row">
                <div class="detail-label">Time:</div>
                <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Error Message:</div>
                <div class="detail-value">${error.message}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Error Type:</div>
                <div class="detail-value">${error.name || 'Error'}</div>
            </div>
        </div>

        <div class="section">
            <h2>🌐 Request Information</h2>
            <div class="detail-row">
                <div class="detail-label">URL:</div>
                <div class="detail-value">${request.url}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Method:</div>
                <div class="detail-value">${request.method}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">IP Address:</div>
                <div class="detail-value">${request.ip || 'Unknown'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Browser:</div>
                <div class="detail-value">${request.userAgent || 'Unknown'}</div>
            </div>
        </div>

        ${error.stack ? `
        <div class="section">
            <h2>🔍 Stack Trace</h2>
            <div class="stack-trace">${error.stack}</div>
        </div>
        ` : ''}

        <div class="footer">
            <p>This is an automated error notification from the Portfolio application.</p>
            <p>Please investigate and resolve the issue as soon as possible.</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Enquiry Email Template
 * Creates a clean HTML template for enquiry notifications
 */
const createEnquiryEmailTemplate = (enquiryData) => {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Enquiry - Portfolio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 {
            color: #2563eb;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }
        .detail-label {
            font-weight: 600;
            color: #555;
            min-width: 120px;
            margin-right: 10px;
        }
        .detail-value {
            color: #333;
            flex: 1;
        }
        .requirement-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                min-width: auto;
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📝 New Enquiry Received</h1>
        </div>

        <div class="section">
            <h2>👤 Contact Information</h2>
            <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${enquiryData.name}</div>
            </div>
            ${enquiryData.email ? `
            <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value"><a href="mailto:${enquiryData.email}">${enquiryData.email}</a></div>
            </div>
            ` : ''}
            ${enquiryData.phone ? `
            <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value"><a href="tel:${enquiryData.phone}">${enquiryData.phone}</a></div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Submitted:</div>
                <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Enquiry ID:</div>
                <div class="detail-value">${enquiryData._id || enquiryData.enquiryId || 'N/A'}</div>
            </div>
        </div>

        ${enquiryData.requirement ? `
        <div class="section">
            <h2>💼 Requirements</h2>
            <div class="requirement-box">
                ${enquiryData.requirement.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>🚀 Next Steps</h2>
            <p>A new enquiry has been submitted through your portfolio website. Please review the details above and respond promptly to maintain good client relationships.</p>
            
            <div style="text-align: center;">
                ${enquiryData.email ? `<a href="mailto:${enquiryData.email}?subject=Re: Your Portfolio Enquiry" class="cta-button">Reply to Enquiry</a>` : ''}
            </div>
        </div>

        <div class="footer">
            <p>This is an automated notification from the Portfolio application.</p>
            <p>Please respond to the enquiry within 24 hours for the best client experience.</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Send error notification email
 * @param {Object} errorData - Error and request information
 */
const sendErrorEmail = async (errorData) => {
    const subject = `Error Encountered In Portfolio - ${new Date().toLocaleDateString('en-GB')}`;
    const html = createErrorEmailTemplate(errorData);
    
    await sendEmail({
        to: process.env.ERROR_EMAIL_TO || 'ts360523@gmail.com',
        subject,
        html
    });
};

/**
 * Send enquiry notification email
 * @param {Object} enquiryData - Enquiry information
 */
const sendEnquiryEmail = async (enquiryData) => {
    const subject = `New Enquiry from ${enquiryData.name} - Portfolio`;
    const html = createEnquiryEmailTemplate(enquiryData);
    
    await sendEmail({
        to: process.env.ENQUIRY_EMAIL_TO || 'ts360523@gmail.com',
        subject,
        html
    });
};

module.exports = {
    sendEmail,
    sendErrorEmail,
    sendEnquiryEmail,
    createErrorEmailTemplate,
    createEnquiryEmailTemplate
};