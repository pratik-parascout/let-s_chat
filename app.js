require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

const sequelize = require('./utils/database');

const signupRoutes = require('./routes/signup');
const loginRoutes = require('./routes/login');
const chatRoutes = require('./routes/chat');

const Message = require('./models/chat');
const User = require('./models/user');

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Add this
  })
);

// Middleware
app.use(express.static(path.join(__dirname, 'public/html')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
app.use('/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Table relations

// Server
const PORT = process.env.PORT || 3000;
sequelize
  .sync()
  .then(() => {
    app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });
