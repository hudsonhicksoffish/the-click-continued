import { useState } from 'react';
import { useGameContext } from '../contexts/GameContext';

const ClickFeedback = () => {
  const { lastClick, hasClicked, dayNumber, jackpot } = useGameContext();
  const [showShareModal, setShowShareModal] = useState(false);

  if (!hasClicked || !lastClick) {
    return null;
  }

  const { distance } = lastClick;
  const formattedDistance = Math.round(distance);
  
  // Generate share text with dynamic X position
  const generateShareText = () => {
    // Format jackpot with commas and 2 decimal places
    const formattedJackpot = jackpot.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Create a box with the X positioned based on click coordinates
    const boxWidth = 13; // Width to match the example (between the │ characters)
    const boxHeight = 5;
    
    // Normalize coordinates to fit within the box dimensions
    // Assuming the game area is 1000x1000 pixels as seen in GameContext
    const normalizedX = Math.min(Math.max(Math.floor((lastClick.x / 1000) * boxWidth), 0), boxWidth - 1);
    const normalizedY = Math.min(Math.max(Math.floor((lastClick.y / 1000) * boxHeight), 0), boxHeight - 1);
    
    // Create the rows of the box
    let boxRows = [];
    boxRows.push(`┌─────────────┐`); // Top border with box-drawing characters
    
    for (let y = 0; y < boxHeight; y++) {
      let row = '│';
      for (let x = 0; x < boxWidth; x++) {
        if (x === normalizedX && y === normalizedY) {
          row += 'x'; // Using lowercase x as requested
        } else {
          row += ' ';
        }
      }
      row += '│';
      boxRows.push(row);
    }
    
    boxRows.push(`└─────────────┘`); // Bottom border with box-drawing characters
    
    return `Pot: $${formattedJackpot}
${boxRows.join('\n')}
Day ${dayNumber} · Off by: ${formattedDistance}px
theclickgame.com`;
  };
  
  // Determine feedback message based on distance
  let feedbackMessage = '';
  let colorClass = '';
  
  if (distance === 0) {
    feedbackMessage = 'JACKPOT! You found the exact pixel!';
    colorClass = 'text-yellow-400';
  } else if (distance < 5) {
    feedbackMessage = 'Incredibly close!';
    colorClass = 'text-emerald-400';
  } else if (distance < 20) {
    feedbackMessage = 'Very close!';
    colorClass = 'text-emerald-500';
  } else if (distance < 50) {
    feedbackMessage = 'Getting closer!';
    colorClass = 'text-blue-400';
  } else if (distance < 100) {
    feedbackMessage = 'Not bad!';
    colorClass = 'text-blue-500';
  } else {
    feedbackMessage = 'Try again tomorrow!';
    colorClass = 'text-gray-400';
  }

  return (
    <div className="text-center mt-6">
      <h2 className={`text-2xl font-bold ${colorClass} mb-2`}>
        {formattedDistance} PIXELS AWAY
      </h2>
      <p className={`${colorClass} font-medium`}>{feedbackMessage}</p>
      
      <button
        onClick={() => setShowShareModal(true)}
        className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded-lg transition-colors inline-flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
        Share Result
      </button>
      
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Share Your Result</h2>
            
            <div className="bg-slate-700 p-4 rounded-lg mb-4 font-mono whitespace-pre overflow-x-auto">
              {generateShareText()}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generateShareText());
                  alert('Copied to clipboard!');
                  setShowShareModal(false);
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Copy
              </button>
              <button 
                onClick={() => setShowShareModal(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClickFeedback;
