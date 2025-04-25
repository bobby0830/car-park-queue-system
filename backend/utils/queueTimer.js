const Queue = require('../models/Queue');

/**
 * Updates the queue times every second
 * - Updates current_time for all entries
 * - Decrements usage_time for in_use entries
 * - Updates waiting_time for waiting entries
 * - Handles status transitions
 */
const updateQueueTimes = async () => {
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
    
    return await Queue.find().sort({ id: 1 });
  } catch (err) {
    console.error('Error updating queue times:', err);
    return null;
  }
};

/**
 * Start the queue timer to update times every second
 */
const startQueueTimer = () => {
  console.log('Starting queue timer...');
  setInterval(updateQueueTimes, 1000);
};

module.exports = {
  updateQueueTimes,
  startQueueTimer
};
