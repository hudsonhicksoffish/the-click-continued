import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file paths
const DB_DIR = join(__dirname, 'data');
const JACKPOT_STATE_FILE = join(DB_DIR, 'jackpot_state.json');
const JACKPOT_HISTORY_FILE = join(DB_DIR, 'jackpot_history.json');

// Ensure database directory exists
const initDb = async () => {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    
    // Initialize jackpot_state if it doesn't exist
    try {
      await fs.access(JACKPOT_STATE_FILE);
    } catch (error) {
      // File doesn't exist, create it with default values
      await fs.writeFile(
        JACKPOT_STATE_FILE,
        JSON.stringify({
          current_amount: 100.00,
          last_update: new Date().toISOString(),
          last_modified_by: 'system',
          version: 1  // For optimistic locking
        }, null, 2)
      );
      console.log('Initialized jackpot_state.json with default values');
    }
    
    // Initialize jackpot_history if it doesn't exist
    try {
      await fs.access(JACKPOT_HISTORY_FILE);
    } catch (error) {
      // File doesn't exist, create it with empty array
      await fs.writeFile(
        JACKPOT_HISTORY_FILE,
        JSON.stringify([], null, 2)
      );
      console.log('Initialized jackpot_history.json with empty array');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// File locking mechanism
const locks = {
  state: false,
  history: false
};

// Helper function to acquire lock with timeout and retries
const acquireLock = async (lockType, maxRetries = 5, retryDelay = 100) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    if (!locks[lockType]) {
      locks[lockType] = true;
      return true;
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    retries++;
  }
  
  throw new Error(`Failed to acquire ${lockType} lock after ${maxRetries} attempts`);
};

// Helper function to release lock
const releaseLock = (lockType) => {
  locks[lockType] = false;
};

// Get current jackpot value
const getJackpot = async () => {
  try {
    const data = await fs.readFile(JACKPOT_STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading jackpot state:', error);
    throw error;
  }
};

// Update jackpot value with optimistic locking
const updateJackpot = async (newAmount, userId) => {
  try {
    await acquireLock('state');
    
    // Read current state
    const data = await fs.readFile(JACKPOT_STATE_FILE, 'utf8');
    const currentState = JSON.parse(data);
    
    // Validate amount is within expected range
    if (newAmount < 0 || newAmount > 10000000) { // $10M max for safety
      throw new Error('Invalid jackpot amount');
    }
    
    // Round to 3 decimal places to ensure precision
    const roundedAmount = Math.round(newAmount * 1000) / 1000;
    
    // Update state with version increment for optimistic locking
    const updatedState = {
      current_amount: roundedAmount,
      last_update: new Date().toISOString(),
      last_modified_by: userId,
      version: currentState.version + 1
    };
    
    // Write updated state
    await fs.writeFile(
      JACKPOT_STATE_FILE,
      JSON.stringify(updatedState, null, 2)
    );
    
    return true;
  } catch (error) {
    console.error('Error updating jackpot:', error);
    return false;
  } finally {
    releaseLock('state');
  }
};

// Reset jackpot to base amount
const resetJackpot = async (baseAmount, userId) => {
  return updateJackpot(baseAmount, userId);
};

// Log jackpot history
const logJackpotHistory = async (previousAmount, newAmount, actionType, userId) => {
  try {
    await acquireLock('history');
    
    // Read current history
    const data = await fs.readFile(JACKPOT_HISTORY_FILE, 'utf8');
    const history = JSON.parse(data);
    
    // Add new entry
    history.push({
      timestamp: new Date().toISOString(),
      previous_amount: previousAmount,
      new_amount: newAmount,
      action_type: actionType,
      user_id: userId
    });
    
    // Limit history size if needed
    const MAX_HISTORY = 1000;
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }
    
    // Write updated history
    await fs.writeFile(
      JACKPOT_HISTORY_FILE,
      JSON.stringify(history, null, 2)
    );
    
    return true;
  } catch (error) {
    console.error('Error logging jackpot history:', error);
    return false;
  } finally {
    releaseLock('history');
  }
};

export {
  initDb,
  getJackpot,
  updateJackpot,
  resetJackpot,
  logJackpotHistory
};