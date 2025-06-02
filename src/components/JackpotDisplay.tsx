import { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { getTimeUntilTomorrow } from '../utils/dateUtils';
import { onJackpotUpdate, onConnectionChange } from '../services/socketService';
import { Activity } from 'lucide-react';

const JackpotDisplay = () => {
  const { jackpot, setJackpot } = useGameContext();
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState(getTimeUntilTomorrow());
  const [isConnected, setIsConnected] = useState(true);
  
  // Format jackpot to always show 2 decimal places
  const formattedJackpot = jackpot.toFixed(2);

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilTomorrow(getTimeUntilTomorrow());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // WebSocket updates for jackpot
  useEffect(() => {
    // Register for jackpot updates
    onJackpotUpdate((amount) => {
      setJackpot(amount);
    });
    
    // Register for connection status updates
    onConnectionChange((status) => {
      setIsConnected(status);
    });
  }, [setJackpot]);

  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-1">TODAY'S JACKPOT</h2>
        {!isConnected && (
          <div className="ml-2 flex items-center text-yellow-400\" title="Reconnecting...">
            <Activity size={18} className="animate-pulse" />
          </div>
        )}
      </div>
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