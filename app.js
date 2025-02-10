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
const invitationRoutes = require('./routes/invitation');
const uploadRoutes = require('./routes/upload');

const {
  User,
  Group,
  Message,
  GroupMember,
  GroupInvitation,
  UserGroup,
} = require('./models/associations');

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, 'public/html')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
app.use('/chat', chatRoutes);
app.use('/groups', groupActionRoutes);
app.use('/invitations', invitationRoutes);
app.use('/upload', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinGroup', (data) => {
    const { groupId, username } = data;
    socket.join(`group_${groupId}`);
    socket.groupId = groupId;
    socket.username = username;
    socket.to(`group_${groupId}`).emit('userJoined', { username });
    console.log(
      `Socket ${socket.id} joined room group_${groupId} as ${username}`
    );
  });

  socket.on('leaveGroup', (data) => {
    const { groupId, username } = data;
    socket.leave(`group_${groupId}`);
    socket.to(`group_${groupId}`).emit('userLeft', { username });
    console.log(`Socket ${socket.id} left room group_${groupId}`);
  });

  socket.on('disconnect', () => {
    if (socket.groupId && socket.username) {
      socket
        .to(`group_${socket.groupId}`)
        .emit('userLeft', { username: socket.username });
      console.log(
        `User ${socket.username} disconnected from room group_${socket.groupId}`
      );
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

require('./cron/archiveChats');

const PORT = process.env.PORT || 3000;
sequelize
  .sync({ alter: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });
