const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// 导入 CORS 配置
const { corsOptions, allowedOrigins } = require('./middleware/cors');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the queue timer after successful connection
    const { startQueueTimer, updateQueueTimes } = require('./utils/queueTimer');
    startQueueTimer();
    
    // Set up socket.io for real-time updates
    io.on('connection', (socket) => {
      console.log('New client connected');
      
      // Send initial queue data to client
      updateQueueTimes().then(queueData => {
        if (queueData) {
          socket.emit('queueUpdate', queueData);
        }
      });
      
      // Set up interval to send queue updates to client
      const updateInterval = setInterval(async () => {
        const queueData = await updateQueueTimes();
        if (queueData) {
          socket.emit('queueUpdate', queueData);
        }
      }, 1000);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
        clearInterval(updateInterval);
      });
    });
  })
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Import routes
const queueRoutes = require('./routes/queue');
const qrCodeRoutes = require('./routes/qrCode');

// Use routes
app.use('/api/queue', queueRoutes);
app.use('/api/qrcode', qrCodeRoutes);

// Set port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
