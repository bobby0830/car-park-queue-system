const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Get all queue entries
router.get('/', queueController.getAllEntries);

// Get a specific queue entry by user_id (保留向後兼容)
router.get('/user/:userId', queueController.getUserEntry);

// Get all queue entries for a specific user
router.get('/user/:userId/all', queueController.getUserEntries);

// Add a new user to the queue
router.post('/', queueController.addToQueue);

// Update queue status (for admin or system use)
router.put('/status/:id', queueController.updateStatus);

// Update all queue entries (for time updates)
router.put('/update-times', queueController.updateTimes);

// Remove a user from the queue
router.delete('/:id', queueController.removeFromQueue);

module.exports = router;
