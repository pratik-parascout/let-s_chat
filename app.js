require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const http = require('http');
const server = http.createServer(app);

const socketIo = require('socket.io');
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const sequelize = require('./utils/database');

// Routes
const signupRoutes = require('./routes/signup');
const loginRoutes = require('./routes/login');
const chatRoutes = require('./routes/chat');
const groupActionRoutes = require('./routes/groupAction');
// Update the following if your file is named "invitations.js" instead of "invitation.js"
const invitationRoutes = require('./routes/invitation');

const {
  User,
  Group,
  Message,
  GroupMember,
  UserGroup,
} = require('./models/associations');

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Middleware: Serve static files and parse JSON / URL-encoded data
app.use(express.static(path.join(__dirname, 'public/html')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount Routes
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

// Expose Socket.IO instance to controllers via app.set
app.set('io', io);

// Socket.IO Event Handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Listen for joinGroup event with an object { groupId, username }
  socket.on('joinGroup', (data) => {
    const { groupId, username } = data;
    socket.join(`group_${groupId}`);
    // Save data on the socket for later use (e.g., on disconnect)
    socket.groupId = groupId;
    socket.username = username;
    // Broadcast to others in the room that this user has joined
    socket.to(`group_${groupId}`).emit('userJoined', { username });
    console.log(
      `Socket ${socket.id} joined room group_${groupId} as ${username}`
    );
  });

  // Listen for leaveGroup event
  socket.on('leaveGroup', (data) => {
    const { groupId, username } = data;
    socket.leave(`group_${groupId}`);
    socket.to(`group_${groupId}`).emit('userLeft', { username });
    console.log(`Socket ${socket.id} left room group_${groupId}`);
  });

  // On disconnect, if the socket was in a group, notify others
  socket.on('disconnect', () => {
    if (socket.groupId && socket.username) {
      socket
        .to(`group_${socket.groupId}`)
        .emit('userLeft', { username: socket.username });
      console.log(
        `User ${socket.username} disconnected from group_${socket.groupId}`
      );
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
sequelize
  .sync() // In production, consider using migrations or { alter: true }
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });
