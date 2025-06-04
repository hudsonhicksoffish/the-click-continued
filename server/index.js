import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { 
  initDb, 
  getJackpot, 
  updateJackpot, 
  resetJackpot, 
  logJackpotHistory, 
  getOrCreateDailyTargetPixel,
  forceNewDailyTarget
} from './database.js';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Initialize the database
initDb();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set up heartbeat mechanism
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
let connectedClients = new Set();

io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connectedClients.add(socket.id);
  
  // Get the current target pixel for today
  const targetPixel = await getOrCreateDailyTargetPixel();
  console.log(`Current target for ${targetPixel.date}: (${targetPixel.x}, ${targetPixel.y})`);
  
  // Send current jackpot value on connection
  getJackpot().then(jackpot => {
    socket.emit('jackpot_update', { amount: jackpot.current_amount });
  });

  // Handle clicks - server calculates the distance
  socket.on('click', async (data) => {
    try {
      const userId = socket.id;
      const { x, y } = data;
      
      // Validate inputs
      if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || x > 999 || y < 0 || y > 999) {
        socket.emit('error', { message: 'Invalid coordinates' });
        return;
      }
      
      // Calculate distance to target
      const distance = Math.sqrt(Math.pow(targetPixel.x - x, 2) + Math.pow(targetPixel.y - y, 2));
      const roundedDistance = Math.round(distance * 1000) / 1000;
      
      // Get current jackpot value
      const currentJackpot = await getJackpot();
      
      // Check if it's a direct hit
      if (roundedDistance === 0) {
        // Winner! Reset the jackpot
        const baseAmount = 100.00;
        const updated = await resetJackpot(baseAmount, userId);
        
        if (updated) {
          // Log the jackpot win
          await logJackpotHistory(
            currentJackpot.current_amount,
            baseAmount,
            'JACKPOT_WIN',
            userId
          );
          
          // Generate a new target for tomorrow
          const newTarget = await forceNewDailyTarget();
          
          // Send result to client (including the target location)
          socket.emit('click_result', { 
            distance: roundedDistance,
            success: true
          });
          
          // Broadcast jackpot reset to all clients
          io.emit('jackpot_update', { amount: baseAmount });
          io.emit('jackpot_won', { 
            amount: currentJackpot.current_amount,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Missed the target - increment jackpot
        const newAmount = parseFloat(currentJackpot.current_amount) + 0.001;
        const roundedAmount = Math.round(newAmount * 1000) / 1000;
        
        const updated = await updateJackpot(roundedAmount, userId);
        
        if (updated) {
          // Log the change
          await logJackpotHistory(
            currentJackpot.current_amount,
            roundedAmount,
            'INCREMENT',
            userId
          );
          
          // Send result to client (including the target location)
          socket.emit('click_result', { 
            distance: roundedDistance,
            success: false
          });
          
          // Broadcast to all clients
          io.emit('jackpot_update', { amount: roundedAmount });
        }
      }
    } catch (error) {
      console.error('Error processing click:', error);
      socket.emit('error', { message: 'Failed to process click' });
    }
  });

  // Heartbeat to verify connection status
  const heartbeatInterval = setInterval(() => {
    socket.emit('heartbeat');
  }, HEARTBEAT_INTERVAL);

  socket.on('heartbeat_response', () => {
    // Client is still connected
    console.log(`Heartbeat received from ${socket.id}`);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    clearInterval(heartbeatInterval);
  });
});

// Periodic jackpot increment (micro-increments)
const AUTO_INCREMENT_INTERVAL = 300000; // 5 minutes
setInterval(async () => {
  try {
    const currentJackpot = await getJackpot();
    const newAmount = parseFloat(currentJackpot.current_amount) + 0.01;
    const roundedAmount = Math.round(newAmount * 1000) / 1000;
    
    const updated = await updateJackpot(roundedAmount, 'system');
    
    if (updated) {
      await logJackpotHistory(
        currentJackpot.current_amount,
        roundedAmount,
        'AUTO_INCREMENT',
        'system'
      );
      
      io.emit('jackpot_update', { amount: roundedAmount });
    }
  } catch (error) {
    console.error('Error in auto increment:', error);
  }
}, AUTO_INCREMENT_INTERVAL);

// API endpoints
app.get('/api/jackpot', async (req, res) => {
  try {
    const jackpot = await getJackpot();
    res.json({ amount: jackpot.current_amount });
  } catch (error) {
    console.error('Error fetching jackpot:', error);
    res.status(500).json({ error: 'Failed to fetch jackpot' });
  }
});

// System health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    clients: connectedClients.size,
    uptime: process.uptime()
  });
});

// Simple route to check if server is running
app.get('/', (req, res) => {
  res.send('The Click API Server is running');
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Active connections: ${connectedClients.size}`);
});