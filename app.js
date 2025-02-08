require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Create Express app and HTTP server
const app = express();
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.IO and attach it to the HTTP server
const socketIo = require('socket.io');
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Database connection
const sequelize = require('./utils/database');

// Import routes
const signupRoutes = require('./routes/signup');
const loginRoutes = require('./routes/login');
const chatRoutes = require('./routes/chat');
const groupActionRoutes = require('./routes/groupAction');
const invitationRoutes = require('./routes/invitation');

// Import associations (this will create and set up your models and relationships)
const {
  User,
  Group,
  Message,
  GroupMember,
  UserGroup,
} = require('./models/associations');

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Middleware for serving static files and parsing JSON/URL-encoded data
app.use(express.static(path.join(__dirname, 'public/html')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount routes
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
app.use('/chat', chatRoutes);
app.use('/groups', groupActionRoutes);
app.use('/invitations', invitationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Make Socket.IO instance available to controllers via app.set
app.set('io', io);

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Listen for joining a group room
  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined room group_${groupId}`);
  });

  // Optionally, listen for leaving a group
  socket.on('leaveGroup', (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left room group_${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start the server after syncing the database
const PORT = process.env.PORT || 3000;
sequelize
  .sync() // For production, consider using { alter: true } or proper migrations instead of force
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });
