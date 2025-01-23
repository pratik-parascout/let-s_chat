const path = require('path');

const express = require('express');
const app = express();

const signupRoutes = require('./routes/signup');

// Middleware
app.use(express.static(path.join(__dirname, 'public/html')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/signup', signupRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server
const PORT = process.env.PORT || 3000;
app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  })
  .on('error', (err) => {
    console.error('Server failed to start:', err);
  });
