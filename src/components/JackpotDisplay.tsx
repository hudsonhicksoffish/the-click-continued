import { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { getTimeUntilTomorrow } from '../utils/dateUtils';

const JackpotDisplay = () => {
  const { jackpot } = useGameContext();
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState(getTimeUntilTomorrow());
  
  // Format jackpot to always show 2 decimal places
  const formattedJackpot = jackpot.toFixed(2);

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilTomorrow(getTimeUntilTomorrow());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-white mb-1">TODAY'S JACKPOT</h2>
      <div className="text-4xl font-bold text-emerald-400 mb-2">
        ${formattedJackpot}
      </div>
      <div className="text-sm text-gray-400">
        Next attempt in <span className="text-white">{timeUntilTomorrow}</span>
      </div>
    </div>
  );
};

export default JackpotDisplay;
