import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDb, getJackpot, updateJackpot, resetJackpot, logJackpotHistory } from './database.js';
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

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connectedClients.add(socket.id);
  
  // Send current jackpot value on connection
  getJackpot().then(jackpot => {
    socket.emit('jackpot_update', { amount: jackpot.current_amount });
  });

  // Handle incorrect clicks - increment jackpot
  socket.on('incorrect_click', async () => {
    try {
      const userId = socket.id;
      const previousAmount = await getJackpot();
      const newAmount = parseFloat(previousAmount.current_amount) + 0.001;
      const roundedAmount = Math.round(newAmount * 1000) / 1000;
      
      // Update jackpot with optimistic locking
      const updated = await updateJackpot(roundedAmount, userId);
      
      if (updated) {
        // Log the change
        await logJackpotHistory(
          previousAmount.current_amount,
          roundedAmount,
          'INCREMENT',
          userId
        );
        
        // Broadcast to all clients
        io.emit('jackpot_update', { amount: roundedAmount });
      }
    } catch (error) {
      console.error('Error processing incorrect click:', error);
      socket.emit('error', { message: 'Failed to update jackpot' });
    }
  });

  // Handle correct clicks - reset jackpot
  socket.on('correct_click', async () => {
    try {
      const userId = socket.id;
      const previousAmount = await getJackpot();
      const baseAmount = 100.00;
      
      // Reset jackpot with optimistic locking
      const updated = await resetJackpot(baseAmount, userId);
      
      if (updated) {
        // Log the change
        await logJackpotHistory(
          previousAmount.current_amount,
          baseAmount,
          'RESET',
          userId
        );
        
        // Broadcast to all clients
        io.emit('jackpot_update', { amount: baseAmount });
        io.emit('jackpot_won', { 
          amount: previousAmount.current_amount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error processing correct click:', error);
      socket.emit('error', { message: 'Failed to reset jackpot' });
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