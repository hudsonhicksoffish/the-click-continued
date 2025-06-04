import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import Header from './components/Header';
import Grid from './components/Grid';
import JackpotDisplay from './components/JackpotDisplay';
import { formatDateKey } from './utils/dateUtils';

function App() {
  const [hasAttemptedToday, setHasAttemptedToday] = useState<boolean>(false);
  const [devMode, setDevMode] = useState<boolean>(false);

  useEffect(() => {
    // Check for developer mode in URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const isDevMode = queryParams.get('dev') === 'true';
    setDevMode(isDevMode);
    
    // Only check for previous attempts if not in dev mode
    if (!isDevMode) {
      const todayKey = formatDateKey(new Date());
      const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
      
      if (attemptData) {
        setHasAttemptedToday(true);
      }
    }
  }, []);

  // Allow clearing the attempt in dev mode
  const clearAttempt = () => {
    if (devMode) {
      const todayKey = formatDateKey(new Date());
      localStorage.removeItem(`click_attempt_${todayKey}`);
      setHasAttemptedToday(false);
    }
  };

  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <JackpotDisplay />
          <Grid disabled={devMode ? false : hasAttemptedToday} />
          
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
    </GameProvider>
  );
}

export default App;