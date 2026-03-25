const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const defaultLocalMongoUri = 'mongodb://localhost:27017/eventmanagement';

const buildMongoCandidates = () => {
  const orderedUris = isProduction
    ? [
        process.env.DB_URI,
        process.env.ATLAS_DB_URI,
        process.env.MONGODB_URI,
        defaultLocalMongoUri,
      ]
    : [
        process.env.DB_URI,
        process.env.MONGODB_URI,
        process.env.ATLAS_DB_URI,
        defaultLocalMongoUri,
      ];

  return [...new Set(orderedUris.filter(Boolean))];
};

const maskMongoUri = (uri) => {
  if (!uri) {
    return 'N/A';
  }

  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
};

const connectToDatabase = async () => {
  const mongoCandidates = buildMongoCandidates();
  let lastError;

  for (const mongoUri of mongoCandidates) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB connected using ${maskMongoUri(mongoUri)}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection failed for ${maskMongoUri(mongoUri)}: ${error.message}`);
    }
  }

  throw lastError;
};

console.log('Email service configured:', Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api', require('./routes/dashboard'));

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server because MongoDB connection failed.');
    console.error(error);
    process.exit(1);
  }
};

startServer();
