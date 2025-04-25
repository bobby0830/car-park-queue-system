const Queue = require('../models/Queue');

// Get all queue entries
exports.getAllEntries = async (req, res) => {
  try {
    const queueEntries = await Queue.find().sort({ id: 1 });
    res.json(queueEntries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific queue entry by user_id
exports.getUserEntry = async (req, res) => {
  try {
    const queueEntry = await Queue.findOne({ user_id: req.params.userId });
    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }
    res.json(queueEntry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all queue entries for a specific user
exports.getUserEntries = async (req, res) => {
  try {
    const queueEntries = await Queue.find({ 
      user_id: req.params.userId 
    }).sort({ id: 1 });
    
    res.json(queueEntries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new user to the queue
exports.addToQueue = async (req, res) => {
  try {
    const { user_id, reserved_time, parking_space } = req.body;
    
    if (!user_id || !reserved_time || !parking_space) {
      return res.status(400).json({ message: 'User ID, reserved time, and parking space are required' });
    }
    
    // Validate parking space is between 1-10
    if (parking_space < 1 || parking_space > 10) {
      return res.status(400).json({ message: 'Parking space must be between 1 and 10' });
    }
    
    // 檢查該車位是否已被佔用（非完成狀態）
    const existingParkingSpace = await Queue.findOne({ 
      parking_space: parking_space, 
      status: { $ne: 'completed' } 
    });
    
    if (existingParkingSpace) {
      return res.status(400).json({ message: `車位 #${parking_space} 已被佔用，請選擇其他車位` });
    }
    
    // 注意：不再限制同一用戶只能有一個排隊記錄
    
    // Find the highest ID in the queue
    const highestIdEntry = await Queue.findOne().sort({ id: -1 });
    const newId = highestIdEntry ? highestIdEntry.id + 1 : 1;
    
    // Calculate waiting time based on users ahead in the queue
    const usersAhead = await Queue.find({ 
      status: { $in: ['waiting', 'in_use'] }
    });
    
    let waitingTime = 0;
    for (const user of usersAhead) {
      if (user.status === 'in_use') {
        waitingTime += user.usage_time;
      } else {
        waitingTime += user.reserved_time;
      }
    }
    
    const newQueueEntry = new Queue({
      id: newId,
      user_id,
      parking_space,
      reserved_time,
      waiting_time: waitingTime,
      status: 'waiting',
      usage_time: 0
    });
    
    const savedEntry = await newQueueEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update queue status (for admin or system use)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const queueEntry = await Queue.findOne({ id: req.params.id });
    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }
    
    queueEntry.status = status;
    if (status === 'in_use') {
      queueEntry.usage_time = queueEntry.reserved_time;
      queueEntry.waiting_time = 0;
    } else if (status === 'completed') {
      queueEntry.usage_time = 0;
    }
    
    const updatedEntry = await queueEntry.save();
    res.json(updatedEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update all queue entries (for time updates)
exports.updateTimes = async (req, res) => {
  try {
    // Update current_time for all entries
    await Queue.updateMany({}, { current_time: new Date() });
    
    // Get all active queue entries
    const queueEntries = await Queue.find({
      status: { $in: ['waiting', 'in_use'] }
    }).sort({ id: 1 });
    
    // Find the first in_use entry
    const inUseEntry = queueEntries.find(entry => entry.status === 'in_use');
    
    // Update usage_time for in_use entry
    if (inUseEntry) {
      inUseEntry.usage_time = Math.max(0, inUseEntry.usage_time - 1);
      
      // Check if usage time is over
      if (inUseEntry.usage_time <= 0) {
        inUseEntry.status = 'completed';
        await inUseEntry.save();
        
        // Find the next waiting user
        const nextWaitingUser = await Queue.findOne({ 
          status: 'waiting' 
        }).sort({ id: 1 });
        
        if (nextWaitingUser) {
          nextWaitingUser.status = 'in_use';
          nextWaitingUser.waiting_time = 0;
          nextWaitingUser.usage_time = nextWaitingUser.reserved_time;
          await nextWaitingUser.save();
        }
      } else {
        await inUseEntry.save();
      }
    } else {
      // If no in_use entry, make the first waiting entry in_use
      const firstWaitingUser = queueEntries.find(entry => entry.status === 'waiting');
      if (firstWaitingUser) {
        firstWaitingUser.status = 'in_use';
        firstWaitingUser.waiting_time = 0;
        firstWaitingUser.usage_time = firstWaitingUser.reserved_time;
        await firstWaitingUser.save();
      }
    }
    
    // Update waiting times for all waiting entries
    let cumulativeWaitingTime = 0;
    if (inUseEntry && inUseEntry.status === 'in_use') {
      cumulativeWaitingTime = inUseEntry.usage_time;
    }
    
    for (const entry of queueEntries) {
      if (entry.status === 'waiting') {
        entry.waiting_time = cumulativeWaitingTime;
        cumulativeWaitingTime += entry.reserved_time;
        await entry.save();
      }
    }
    
    // Get updated queue
    const updatedQueue = await Queue.find().sort({ id: 1 });
    res.json(updatedQueue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a user from the queue
exports.removeFromQueue = async (req, res) => {
  try {
    const queueEntry = await Queue.findOne({ id: req.params.id });
    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }
    
    await Queue.deleteOne({ id: req.params.id });
    res.json({ message: 'Deleted queue entry' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
