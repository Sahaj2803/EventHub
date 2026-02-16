<<<<<<< HEAD
# Event Management System

A comprehensive event management platform built with the MERN stack (MongoDB, Express.js, React, Node.js). This application allows users to create, manage, and book events with a professional and modern interface.

## 🚀 Features

### For Users
- **Browse Events**: Search and filter events by category, location, date, and more
- **Event Details**: View comprehensive event information including venue, pricing, and organizer details
- **Booking System**: Book tickets with secure payment processing
- **User Dashboard**: Manage bookings, view event history, and update profile
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### For Organizers
- **Event Creation**: Create and manage events with detailed information
- **Dashboard**: View event analytics, manage bookings, and track revenue
- **Event Management**: Edit, update, and manage event details
- **Booking Management**: Handle attendee check-ins and booking management

### For Administrators
- **User Management**: Manage user accounts, roles, and permissions
- **Event Oversight**: Monitor all events and manage content
- **Analytics**: View system-wide statistics and performance metrics
- **Category Management**: Create and manage event categories

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd event-management-system
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd client
npm install --legacy-peer-deps
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/eventmanagement
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
NODE_ENV=development
```

### 5. Database Setup
Make sure MongoDB is running on your system, then seed the database with initial data:

```bash
node seedData.js
```

### 6. Start the Application

#### Development Mode
```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
npm run client
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔑 Demo Accounts

The seed data includes demo accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Organizer | organizer@example.com | organizer123 |
| User | user@example.com | user123 |

## 📁 Project Structure

```
event-management-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── models/                 # MongoDB models
├── routes/                 # Express routes
├── middleware/             # Custom middleware
├── server.js              # Main server file
├── seedData.js            # Database seeding script
└── package.json
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Events
- `GET /api/events` - Get all events (with filtering)
- `GET /api/events/featured` - Get featured events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Organizer/Admin)
- `PUT /api/events/:id` - Update event (Organizer/Admin)
- `DELETE /api/events/:id` - Delete event (Organizer/Admin)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/confirm` - Confirm booking
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/role` - Update user role (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

## 🎨 Key Features

### Event Management
- **Rich Event Creation**: Detailed event forms with venue, pricing, and scheduling
- **Image Upload**: Support for multiple event images with primary image selection
- **Pricing Tiers**: Flexible pricing structure with multiple ticket types
- **Capacity Management**: Track ticket sales and availability
- **Event Status**: Draft, published, cancelled, and completed states

### Booking System
- **Secure Booking**: JWT-based authentication for secure transactions
- **Payment Integration**: Ready for Stripe payment processing
- **QR Code Support**: Generate QR codes for event check-ins
- **Booking Management**: View, cancel, and manage bookings
- **Attendee Information**: Collect and manage attendee details

### User Experience
- **Responsive Design**: Mobile-first approach with Material-UI
- **Search & Filter**: Advanced filtering by category, location, date, and price
- **Real-time Updates**: Live data updates with React Query
- **Professional UI**: Modern, clean interface with smooth animations
- **Accessibility**: WCAG compliant components

## 🔧 Customization

### Adding New Features
1. Create new routes in the `routes/` directory
2. Add corresponding models in the `models/` directory
3. Create API services in `client/src/services/`
4. Build UI components in `client/src/components/`
5. Add new pages in `client/src/pages/`

### Styling
The application uses Material-UI theming. Customize the theme in `client/src/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    // ... other theme options
  },
});
```

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect your GitHub repository
4. Deploy the main branch

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `client/build` directory
3. Set environment variables for API URL

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Update `MONGODB_URI` in environment variables
3. Configure network access and database user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the demo accounts for testing

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Email marketing integration
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Social media integration
- [ ] Event recommendation system
- [ ] Advanced search with AI

---

**Built with ❤️ using the MERN stack**


=======
# EventHub
>>>>>>> 0c4d50e6c2d73d277e1e5f317a5d4c7ce6d9ed73
