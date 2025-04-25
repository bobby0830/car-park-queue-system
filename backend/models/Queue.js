const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true
  },
  parking_space: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // Assuming we have 10 parking spaces
  },
  current_time: {
    type: Date,
    default: Date.now
  },
  waiting_time: {
    type: Number,
    default: 0 // in seconds
  },
  reserved_time: {
    type: Number,
    required: true // in seconds
  },
  status: {
    type: String,
    enum: ['waiting', 'in_use', 'completed'],
    default: 'waiting'
  },
  usage_time: {
    type: Number,
    default: 0 // in seconds
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Queue', QueueSchema);
