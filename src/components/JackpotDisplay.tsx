import { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { onJackpotUpdate, onConnectionChange } from '../services/socketService';

const JackpotDisplay = () => {
  const { jackpot, setJackpot } = useGameContext();
  const [isConnected, setIsConnected] = useState(true);
  
  // Format jackpot to fixed display format (e.g., 0,001,000.00)
  const formatJackpotForDisplay = () => {
    // Format with commas and 2 decimal places
    const formatted = jackpot.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Pad with leading zeros if needed to ensure consistent format
    const parts = formatted.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Ensure integer part is at least 7 digits (for 0,000,000)
    const paddedIntegerPart = integerPart.padStart(7, '0');
    
    // Format with commas
    let result = '';
    let counter = 0;
    
    for (let i = paddedIntegerPart.length - 1; i >= 0; i--) {
      if (counter === 3 && paddedIntegerPart[i] !== ',') {
        result = ',' + result;
        counter = 0;
      }
      result = paddedIntegerPart[i] + result;
      counter++;
    }
    
    return [result, decimalPart];
  };

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

  const [integerPart, decimalPart] = formatJackpotForDisplay();
  
  // Split the formatted jackpot into individual digits for display
  const jackpotDigits = integerPart.split('');

  return (
    <div className="text-center mb-6">
      {/* Digital Jackpot Display */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-white text-4xl mr-2">$</div>
        <div className="inline-flex">
          {jackpotDigits.map((digit, index) => 
            digit === ',' ? (
              <div key={`sep-${index}`} className="separator">,</div>
            ) : (
              <div key={`digit-${index}`} className="digit-container">
                <div className="digit">{digit}</div>
              </div>
            )
          )}
          <div className="separator">.</div>
          {decimalPart.split('').map((digit, index) => (
            <div key={`decimal-${index}`} className="digit-container">
              <div className="digit">{digit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JackpotDisplay;