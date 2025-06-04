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
  revealedTargetPixel: { x: number; y: number } | null;
  lastClick: Click | null;
  hasClicked: boolean;
  setHasClicked: (value: boolean) => void; // Added to allow resetting in dev mode
  dayNumber: number;
  registerClick: (x: number, y: number) => void;
  devMode: boolean;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [jackpot, setJackpot] = useState(100.00); // Starting jackpot value of $100
  const [dayNumber] = useState(getCurrentDayNumber());
  const [revealedTargetPixel, setRevealedTargetPixel] = useState<{ x: number; y: number } | null>(null);
  const [lastClick, setLastClick] = useState<Click | null>(null);
  const [hasClicked, setHasClicked] = useState(false);
  const [devMode, setDevMode] = useState(false);

  // Initialize WebSocket connection and set devMode
  useEffect(() => {
    initSocket();
    const queryParams = new URLSearchParams(window.location.search);
    setDevMode(queryParams.get('dev') === 'true');
  }, []);

  // Check if user has clicked today
  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    try {
      const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
      if (attemptData) {
        const parsedData = JSON.parse(attemptData);
        setLastClick(parsedData);
        setHasClicked(true);
      }
    } catch (error) {
      console.error("Error reading from localStorage in GameContext:", error);
    }
  }, []);

  // Listen for jackpot updates
  useEffect(() => {
    onJackpotUpdate((amount) => {
      setJackpot(amount);
    });

    // Listen for click results from server
    onClickResult((distance, targetX, targetY, success) => {
      // Update revealed target
      setRevealedTargetPixel({ x: targetX, y: targetY });
      
      // Update last click with the server-calculated distance
      if (lastClick) {
        const updatedClick = {
          ...lastClick,
          distance: distance
        };
        setLastClick(updatedClick);
        
        // Update localStorage with the new distance
        const todayKey = formatDateKey(new Date());
        try {
          localStorage.setItem(`click_attempt_${todayKey}`, JSON.stringify(updatedClick));
        } catch (error) {
          console.error("Error writing to localStorage in onClickResult:", error);
        }
      }
    });
    
    // Monitor connection status
    onConnectionChange((status) => {
      console.log(`Connection status: ${status ? 'connected' : 'disconnected'}`);
    });
  }, [lastClick]);

  const registerClick = useCallback((x: number, y: number) => {
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
    if (!devMode) {
      const todayKey = formatDateKey(new Date());
      try {
        localStorage.setItem(`click_attempt_${todayKey}`, JSON.stringify(clickData));
      } catch (error) {
        console.error("Error writing to localStorage in registerClick:", error);
      }
    }
    
    // Send click to server for processing
    socketRegisterClick(x, y);
  }, []);

  const value = {
    jackpot,
    setJackpot,
    revealedTargetPixel,
    lastClick,
    hasClicked,
    setHasClicked, // Expose this for dev mode
    dayNumber,
    registerClick,
    devMode,
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