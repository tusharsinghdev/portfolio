# Portfolio - Node.js Application

This is the personal portfolio website of [Tushar Singh](https://github.com/tusharsingh3), transformed from a static HTML site to a modern Node.js application with MongoDB integration.

## 🚀 Features

### Frontend Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark/Light Theme Toggle**: User preference saved in localStorage
- **Interactive Animations**: Smooth scrolling, fade-in effects, and hover animations
- **Contact Form**: Comprehensive form with validation and real-time feedback
- **Modern Icons**: Font Awesome icons for better visual appeal
- **Performance Optimized**: Reduced section padding and fixed animation blur issues

### Backend Features
- **Node.js/Express Server**: Fast and scalable web server
- **MongoDB Integration**: Stores contact form submissions in `Portfolio.Enquiry` collection
- **RESTful API**: Clean API endpoints for form submission and data retrieval
- **Input Validation**: Comprehensive server-side validation with detailed error messages
- **Security**: Helmet.js for security headers, CORS support, and input sanitization
- **Logging**: Morgan logging middleware for request monitoring
- **Error Handling**: Graceful error handling with appropriate HTTP status codes

## 📋 Requirements Implemented

✅ **Contact Form** with validation:
- Name (required, max 50 characters)
- Email (validated format)
- Phone Number (validated format)
- Requirement Description (max 500 characters)
- Either Email or Phone must be provided

✅ **Font Awesome Icons**:
- LinkedIn: `fa-brands fa-linkedin`
- Email: `fa-solid fa-envelope`
- Phone: `fa-solid fa-phone`
- GitHub: `fa-brands fa-github`

✅ **Dark/Light Theme Toggle**:
- Sun icon for light theme
- Moon icon for dark theme
- Theme preference saved in localStorage

✅ **Reduced Section Padding**: Improved scrolling experience

✅ **Fixed Animation Blur**: Text remains crisp during card hover animations

✅ **Node.js Architecture**: Separated into modular components

✅ **MongoDB Integration**: Form data saved to `Portfolio.Enquiry` collection

✅ **Documentation**: Comprehensive documentation for complex features

## 🏗️ Project Structure

```
portfolio/
├── server.js                 # Main Express server
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── README.md               # This documentation
├── public/                 # Static files served by Express
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── styles.css     # All CSS styles
│   ├── js/
│   │   └── script.js      # Client-side JavaScript
│   └── images/
│       └── image.jpeg     # Profile image
├── db/                    # Database related files
│   ├── connection.js      # MongoDB connection manager
│   └── models/
│       └── Enquiry.js     # Mongoose model for form submissions
└── routes/
    └── contact.js         # API routes for contact form
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)
- Git

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tusharsinghdev/portfolio.git
   cd portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure MongoDB:**
   - Update the `MONGODB_URI` in `.env` file
   - For local MongoDB: `mongodb://localhost:27017/Portfolio`
   - For MongoDB Atlas: `mongodb+srv://<username>:<password>@cluster.mongodb.net/Portfolio`

4. **Start the development server:**
   ```bash
   npm run dev  # Uses nodemon for auto-restart
   # OR
   npm start    # Standard start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### Production Deployment

1. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your-production-mongodb-uri
   export PORT=3000
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 🗄️ Database Schema

### Portfolio.Enquiry Collection

The contact form submissions are stored in the `Enquiry` collection with the following schema:

```javascript
{
  name: String,              // Required, max 50 characters
  email: String,             // Optional, validated format
  phone: String,             // Optional, validated format  
  requirement: String,       // Optional, max 500 characters
  submittedAt: Date,         // Submission timestamp
  ipAddress: String,         // Client IP for analytics
  userAgent: String,         // Browser information
  status: String,            // 'new', 'contacted', 'in_progress', 'resolved', 'closed'
  notes: String,             // Internal follow-up notes
  followUpDate: Date,        // Scheduled follow-up date
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### Validation Rules
- **Name**: Required, 1-50 characters
- **Email**: Optional, must be valid email format if provided
- **Phone**: Optional, must be valid phone format if provided
- **Email or Phone**: At least one must be provided
- **Requirement**: Optional, max 500 characters

## 🔌 API Endpoints

### POST /api/contact
Submit a new contact form enquiry.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "requirement": "Looking for web development services"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Thank you for your message! We have received your enquiry and will get back to you soon.",
  "enquiryId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "submittedAt": "2023-09-12T10:30:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Please check your form data",
  "errors": {
    "name": "Name is required",
    "email": "Either email or phone number must be provided"
  }
}
```

### GET /api/contact/stats
Get basic statistics about enquiries (for admin purposes).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEnquiries": 25,
    "newEnquiries": 5,
    "contactedEnquiries": 15,
    "recentEnquiries": [...]
  }
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/Portfolio
```

### Security Features
- **Helmet.js**: Security headers for protection against common vulnerabilities
- **CORS**: Cross-Origin Resource Sharing configuration
- **Input Validation**: Server-side validation for all form inputs
- **Error Handling**: Detailed error messages in development, generic in production
- **Rate Limiting**: Can be added for API endpoints if needed

## 🧪 Testing the Application

### Manual Testing
1. **Theme Toggle**: Click the sun/moon button in the header
2. **Form Validation**: Try submitting empty form or invalid data
3. **Form Submission**: Fill the form correctly and submit
4. **Responsive Design**: Test on different screen sizes
5. **Navigation**: Test smooth scrolling between sections

### Database Testing
Check MongoDB for saved enquiries:
```bash
# MongoDB shell
use Portfolio
db.Enquiry.find().pretty()
```

## 🔍 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
❌ MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```
- Ensure MongoDB is running locally
- Check the MONGODB_URI in .env file
- Verify network connectivity for cloud databases

**2. Form Submission Not Working**
- Check browser console for JavaScript errors
- Verify API endpoint is accessible (`/api/contact`)
- Check server logs for backend errors

**3. Icons Not Loading**
- Font Awesome CDN might be blocked
- Check Content Security Policy settings
- Verify internet connection

**4. Theme Not Persisting**
- Check browser localStorage support
- Verify JavaScript is enabled
- Clear browser cache and cookies

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error messages and logs.

## 📈 Future Enhancements

- [ ] Admin dashboard for managing enquiries
- [ ] Email notifications for new submissions
- [ ] Advanced analytics and reporting
- [ ] Rate limiting for API endpoints
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Tushar Singh**
- GitHub: [@tusharsingh3](https://github.com/tusharsingh3)
- Email: ts360523@gmail.com
- LinkedIn: [tushar-singh-1a432a233](https://www.linkedin.com/in/tushar-singh-1a432a233)

---

## 📚 Technical Documentation

### Database Connection Logic (`db/connection.js`)

The database connection module implements a singleton pattern with the following features:

- **Connection Pooling**: Maintains up to 10 socket connections for better performance
- **Auto-Reconnection**: Automatically reconnects on connection loss
- **Graceful Shutdown**: Properly closes connections on process termination
- **Environment Support**: Works with both local and cloud MongoDB instances

### Form Validation Logic (`routes/contact.js`)

The contact form API implements multi-layer validation:

1. **Client-side Validation**: Real-time validation in the browser
2. **Server-side Validation**: Comprehensive validation in the API
3. **Database Validation**: Mongoose schema validation as final layer

### Error Handling Strategy

- **Development**: Detailed error messages for debugging
- **Production**: Generic error messages to prevent information leakage
- **Logging**: All errors logged for monitoring and debugging
- **Graceful Degradation**: Application continues to work even if database is offline

---

*This documentation is comprehensive and covers all aspects of the portfolio application. For questions or support, please contact the author.*
