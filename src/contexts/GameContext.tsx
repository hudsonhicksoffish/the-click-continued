import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { formatDateKey, getCurrentDayNumber } from '../utils/dateUtils';
import { 
  initSocket, 
  registerClick as socketRegisterClick,
  onJackpotUpdate, 
  onClickResult,
  onConnectionChange 
} from '../services/socketService';

interface Click {
  x: number;
  y: number;
  distance: number;
  timestamp: string;
}

interface GameContextType {
  jackpot: number;
  setJackpot: (value: number) => void;
  lastClick: Click | null;
  hasClicked: boolean;
  setHasClicked: (value: boolean) => void; // Added to allow resetting in dev mode
  dayNumber: number;
  registerClick: (x: number, y: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [jackpot, setJackpot] = useState(100.00); // Starting jackpot value of $100
  const [dayNumber] = useState(getCurrentDayNumber());
  const [lastClick, setLastClick] = useState<Click | null>(null);
  const [hasClicked, setHasClicked] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    initSocket();
  }, []);

  // Check if user has clicked today
  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
    
    if (attemptData) {
      const parsedData = JSON.parse(attemptData);
      setLastClick(parsedData);
      setHasClicked(true);
    }
  }, []);

  // Listen for jackpot updates
  useEffect(() => {
    onJackpotUpdate((amount) => {
      setJackpot(amount);
    });

    // Listen for click results from server
    onClickResult((distance, success) => { // targetX and targetY removed
      // Update revealed target
      // setRevealedTargetPixel({ x: targetX, y: targetY }); // Line removed
      
      // Update last click with the server-calculated distance
      if (lastClick) {
        const updatedClick = {
          ...lastClick,
          distance: distance
        };
        setLastClick(updatedClick);
        
        // Update localStorage with the new distance
        const todayKey = formatDateKey(new Date());
        localStorage.setItem(`click_attempt_${todayKey}`, JSON.stringify(updatedClick));
      }
    });
    
    // Monitor connection status
    onConnectionChange((status) => {
      console.log(`Connection status: ${status ? 'connected' : 'disconnected'}`);
    });
  }, [lastClick]);

  const registerClick = useCallback((x: number, y: number) => {
    // Check for dev mode
    const queryParams = new URLSearchParams(window.location.search);
    const isDevMode = queryParams.get('dev') === 'true';
    
    // Create initial click data without distance (server will calculate it)
    const clickData: Click = {
      x,
      y,
      distance: -1, // Placeholder until server responds
      timestamp: new Date().toISOString(),
    };
    
    setLastClick(clickData);
    setHasClicked(true);
    
    // In dev mode, don't persist to localStorage to allow for multiple clicks
    if (!isDevMode) {
      const todayKey = formatDateKey(new Date());
      localStorage.setItem(`click_attempt_${todayKey}`, JSON.stringify(clickData));
    }
    
    // Send click to server for processing
    socketRegisterClick(x, y);
  }, []);

  const value = {
    jackpot,
    setJackpot,
    lastClick,
    hasClicked,
    setHasClicked, // Expose this for dev mode
    dayNumber,
    registerClick,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}