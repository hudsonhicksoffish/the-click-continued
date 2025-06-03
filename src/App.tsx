import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import Header from './components/Header';
import Grid from './components/Grid';
import JackpotDisplay from './components/JackpotDisplay';
import { formatDateKey } from './utils/dateUtils';

function App() {
  const [hasAttemptedToday, setHasAttemptedToday] = useState<boolean>(false);

  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
    
    if (attemptData) {
      setHasAttemptedToday(true);
    }
  }, []);

  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <JackpotDisplay />
          <Grid disabled={hasAttemptedToday} />
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