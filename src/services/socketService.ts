import { io, Socket } from 'socket.io-client';
import { formatDateKey } from '../utils/dateUtils';

// Socket.io connection
let socket: Socket | null = null;
let reconnectInterval: number | null = null;
const RECONNECT_DELAY = 5000; // 5 seconds

// Event callbacks
type JackpotCallback = (amount: number) => void;
const jackpotCallbacks: JackpotCallback[] = [];

type ConnectionCallback = (status: boolean) => void;
const connectionCallbacks: ConnectionCallback[] = [];

// Initialize WebSocket connection
export const initSocket = (): void => {
  if (socket) {
    socket.disconnect();
  }
  
  // Connect to the WebSocket server
  const socketUrl = import.meta.env.PROD 
    ? window.location.origin
    : 'http://localhost:3001';
  
  socket = io(socketUrl, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket']
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    notifyConnectionChange(true);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
    notifyConnectionChange(false);
    setupReconnect();
  });

  socket.on('connect_error', () => {
    console.log('WebSocket connection error');
    notifyConnectionChange(false);
    setupReconnect();
  });

  // Jackpot updates
  socket.on('jackpot_update', (data) => {
    if (typeof data.amount === 'number' || typeof data.amount === 'string') {
      const jackpotAmount = typeof data.amount === 'string' 
        ? parseFloat(data.amount) 
        : data.amount;
      notifyJackpotChange(jackpotAmount);
    }
  });

  // Heartbeat response
  socket.on('heartbeat', () => {
    socket?.emit('heartbeat_response');
  });
  
  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

// Reconnect logic
const setupReconnect = (): void => {
  if (reconnectInterval) return;

  reconnectInterval = window.setInterval(() => {
    console.log('Attempting to reconnect...');
    initSocket();
  }, RECONNECT_DELAY);
};

// Register for jackpot updates
export const onJackpotUpdate = (callback: JackpotCallback): void => {
  jackpotCallbacks.push(callback);
};

// Register for connection status updates
export const onConnectionChange = (callback: ConnectionCallback): void => {
  connectionCallbacks.push(callback);
};

// Notify all registered callbacks about jackpot changes
const notifyJackpotChange = (amount: number): void => {
  jackpotCallbacks.forEach(callback => callback(amount));
};

// Notify all registered callbacks about connection changes
const notifyConnectionChange = (status: boolean): void => {
  connectionCallbacks.forEach(callback => callback(status));
};

// Register incorrect click
export const registerIncorrectClick = (): void => {
  if (socket?.connected) {
    socket.emit('incorrect_click');
  } else {
    console.error('Cannot register click: socket not connected');
    // Queue for when connection is restored
    onConnectionChange((status) => {
      if (status) {
        socket?.emit('incorrect_click');
      }
    });
  }
};

// Register correct click
export const registerCorrectClick = (): void => {
  if (socket?.connected) {
    socket.emit('correct_click');
  } else {
    console.error('Cannot register click: socket not connected');
  }
};

// Check if today's click is already registered
export const checkTodaysClick = (): boolean => {
  const todayKey = formatDateKey(new Date());
  const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
  return attemptData !== null;
};

// Cleanup function
export const cleanupSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
};