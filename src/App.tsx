import { useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import Header from './components/Header';
import Grid from './components/Grid';
import JackpotDisplay from './components/JackpotDisplay';
import ClickFeedback from './components/ClickFeedback';
import { formatDateKey } from './utils/dateUtils';

function App() {
  const [hasAttemptedToday, setHasAttemptedToday] = useState<boolean>(false);

  useState(() => {
    const todayKey = formatDateKey(new Date());
    const attemptData = localStorage.getItem(`click_attempt_${todayKey}`);
    
    if (attemptData) {
      setHasAttemptedToday(true);
    }
  });

  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen bg-slate-900 text-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <JackpotDisplay />
          <Grid disabled={hasAttemptedToday} />
          <ClickFeedback />
        </main>
        <footer className="py-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} The Click • Daily Pixel Challenge</p>
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
