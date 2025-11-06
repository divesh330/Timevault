# TimeVault - Luxury Watch Marketplace

A sophisticated e-commerce platform for luxury watches built with modern web technologies. TimeVault provides a premium shopping experience for watch enthusiasts and collectors.

## 🌟 Features

### User Features
- **User Authentication**: Secure registration, login, and email verification
- **Profile Management**: Edit personal information with secure reauthentication
- **Product Browsing**: Responsive grid layout with detailed product views
- **Shopping Cart**: Real-time cart updates and management
- **Secure Checkout**: PayPal integration for safe transactions
- **Order Tracking**: Complete order history and delivery tracking
- **Wishlist**: Save favorite watches for later

### Admin Features
- **Admin Dashboard**: Comprehensive system management
- **Product Management**: Add watches with dual image input (URL/Upload)
- **User Management**: Monitor and manage user accounts
- **Order Management**: Process and track all orders
- **Role-based Access**: Secure admin-only functionality

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **React Hot Toast** - Elegant notifications

### Backend
- **Express.js** - Web application framework
- **Firebase Admin** - Server-side Firebase integration
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Database & Services
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication service
- **Firebase Storage** - File storage for images
- **PayPal API** - Payment processing

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- PayPal developer account

### Client Setup
```bash
cd client
npm install
npm run dev
```

### Server Setup
```bash
cd server
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both client and server directories:

**Client (.env):**
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Server (.env):**
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## 📱 Application Structure

```
TimeVault/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── index.js       # Server entry point
│   └── package.json
└── README.md
```

## 🎨 Design Features

- **Luxury Theme**: Elegant black and gold color scheme
- **Responsive Design**: Optimized for all device sizes
- **Smooth Animations**: Framer Motion powered transitions
- **Professional UI**: Modern and intuitive user interface
- **Loading States**: Visual feedback for all user actions

## 🔒 Security Features

- **Firebase Authentication**: Secure user management
- **Email Verification**: Required for account activation
- **Role-based Access Control**: Admin and user permissions
- **Input Validation**: Comprehensive form validation
- **Secure Routes**: Protected pages and API endpoints
- **Reauthentication**: Required for sensitive operations

## 📊 Database Schema

### Collections
- **users**: User profiles and roles
- **watches**: Product information and metadata
- **carts**: User shopping cart items
- **orders**: Transaction records and order details
- **transactions**: Payment processing records

## 🚀 Deployment

The application is designed for easy deployment on modern cloud platforms:

- **Frontend**: Vercel, Netlify, or Firebase Hosting
- **Backend**: Heroku, Railway, or Google Cloud Run
- **Database**: Firebase Firestore (cloud-native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Divesh Patel**
- Final Year Project - Computer Science
- Coventry University

## 🙏 Acknowledgments

- Firebase for providing excellent backend services
- PayPal for secure payment processing
- React community for amazing libraries and tools
- Tailwind CSS for the utility-first approach
