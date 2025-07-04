import { useState, useEffect } from 'react';
import { GameProvider, useGameContext } from './contexts/GameContext';
import Header from './components/Header';
import Grid from './components/Grid';
import JackpotDisplay from './components/JackpotDisplay';
import { formatDateKey, getTimeUntilTomorrow } from './utils/dateUtils';

// Define MainApp component to consume the context
function MainApp() {
  const { devMode, setHasClicked, hasClicked } = useGameContext();
  const [hasAttemptedToday, setHasAttemptedToday] = useState<boolean>(false);
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState(getTimeUntilTomorrow());

  useEffect(() => {
    // Only check for previous attempts if not in dev mode
    if (!devMode) {
      const todayKey = formatDateKey(new Date());
      try {
        const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
        if (attemptData) {
          setHasAttemptedToday(true);
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error);
      }
    } else {
      setHasAttemptedToday(false);
    }
  }, [devMode]);

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilTomorrow(getTimeUntilTomorrow());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Allow clearing the attempt in dev mode
  const clearAttempt = () => {
    if (devMode) {
      const todayKey = formatDateKey(new Date());
      try {
        localStorage.removeItem(`click_attempt_${todayKey}`);
        setHasAttemptedToday(false);
        setHasClicked(false);
      } catch (error) {
        console.error("Error removing item from localStorage:", error);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <JackpotDisplay />
        
        {/* Only show Grid - it handles its own post-click state */}
        <Grid disabled={devMode ? false : hasAttemptedToday} />

        {/* Countdown Timer - Only show if clicked and not in dev mode and not showing share card */}
        {hasAttemptedToday && !devMode && !hasClicked && (
          <div className="mt-8 mb-4">
            <div className="text-gray-400 text-xl mb-2">Next click in:</div>
            <div className="flex items-center justify-center text-white text-5xl font-mono">
              {timeUntilTomorrow.split(':').map((part, index) => (
                <span key={index}>
                  {part}
                  {index < timeUntilTomorrow.split(':').length - 1 && <span className="mx-1">:</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Developer mode indicator and controls */}
        {devMode && (
          <div className="mt-4 bg-[#222222] p-3 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#FF0000] font-bold">DEV MODE ACTIVE</span>
              <button
                onClick={clearAttempt}
                className="bg-[#FF0000] text-white px-2 py-1 rounded text-xs"
              >
                Reset Today's Click
              </button>
            </div>
          </div>
        )}
      </main>
      <footer className="py-4 text-center flex flex-col items-center justify-center">
        <p className="text-[#FF0000] text-xl">www.theclick.game</p>
        <p className="text-white text-xs">© HunterSees 2025 All rights reserved.</p>
      </footer>
    </div>
  );
}

// App component now just sets up the provider and renders MainApp
function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}

export default App;