import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { formatDateKey, getCurrentDayNumber } from '../utils/dateUtils';

interface Click {
  x: number;
  y: number;
  distance: number;
  timestamp: string;
}

interface GameContextType {
  jackpot: number;
  targetPixel: { x: number; y: number };
  lastClick: Click | null;
  hasClicked: boolean;
  dayNumber: number;
  registerClick: (x: number, y: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Generate target pixel based on the current day
const generateTargetPixel = () => {
  // Use the day number to ensure all users get the same target on the same day
  const dayNumber = getCurrentDayNumber();
  const seed = dayNumber * 9301 + 49297;
  const pseudoRandom = (seed * 9301 + 49297) % 233280;
  const rnd = pseudoRandom / 233280;
  
  return {
    x: Math.floor(rnd * 1000),
    y: Math.floor((pseudoRandom / 1000) % 1000),
  };
};

const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [jackpot, setJackpot] = useState(100.00); // Starting jackpot value of $100
  const [dayNumber] = useState(getCurrentDayNumber());
  const [targetPixel] = useState(generateTargetPixel());
  const [lastClick, setLastClick] = useState<Click | null>(null);
  const [hasClicked, setHasClicked] = useState(false);

  // Check if user has clicked today
  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
    
    if (attemptData) {
      const parsedData = JSON.parse(attemptData);
      setLastClick(parsedData);
      setHasClicked(true);
    }
    
    // Simulate jackpot increasing over time
    const jackpotInterval = setInterval(() => {
      setJackpot(prev => {
        // Increase by a small amount each interval
        const newValue = prev + 0.01;
        // Format to 2 decimal places
        return Math.round(newValue * 100) / 100;
      });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(jackpotInterval);
  }, []);

  const registerClick = useCallback((x: number, y: number) => {
    const distance = calculateDistance(x, y, targetPixel.x, targetPixel.y);
    
    const clickData: Click = {
      x,
      y,
      distance,
      timestamp: new Date().toISOString(),
    };
    
    setLastClick(clickData);
    setHasClicked(true);
    
    // Store attempt in localStorage
    const todayKey = formatDateKey(new Date());
    localStorage.setItem(`click_attempt_${todayKey}`, JSON.stringify(clickData));
    
    // Check if we have a winner (direct hit)
    if (distance === 0) {
      // Reset jackpot to $100 on a direct hit
      setJackpot(100.00);
      console.log('JACKPOT WINNER!');
    }
  }, [targetPixel]);

  const value = {
    jackpot,
    targetPixel,
    lastClick,
    hasClicked,
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
