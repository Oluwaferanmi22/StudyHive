const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/hives', require('./routes/hives'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/messages', require('./routes/messages'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a study hive room
  socket.on('join-hive', (hiveId) => {
    socket.join(hiveId);
    socket.to(hiveId).emit('user-joined', { userId: socket.userId });
    console.log(`User ${socket.id} joined hive ${hiveId}`);
  });

  // Leave a study hive room
  socket.on('leave-hive', (hiveId) => {
    socket.leave(hiveId);
    socket.to(hiveId).emit('user-left', { userId: socket.userId });
    console.log(`User ${socket.id} left hive ${hiveId}`);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    socket.to(data.hiveId).emit('new-message', data);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.hiveId).emit('user-typing', { userId: socket.userId });
  });

  socket.on('typing-stop', (data) => {
    socket.to(data.hiveId).emit('user-stop-typing', { userId: socket.userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'StudyHive API is running!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 StudyHive server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
