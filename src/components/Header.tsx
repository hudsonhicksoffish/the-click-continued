import { useState } from 'react';
import { HelpCircle, User } from 'lucide-react';
import HowToPlayModal from './HowToPlayModal';

// Pixelated X component to match the click marker styling
const PixelatedX = () => {
  // Define the same 5x5 pixel pattern used in Grid component
  const pattern = [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1]
  ];
  
  const pixelSize = 3; // Size of each pixel square
  const width = pattern[0].length * pixelSize;
  const height = pattern.length * pixelSize;
  
  return (
    <div 
      className="inline-block mx-1" 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        position: 'relative',
        bottom: '-4px' // Adjusted to align with the bottom of THE and CLICK
      }}
      aria-label="Pixelated X"
    >
      {pattern.map((row, y) => 
        row.map((pixel, x) => 
          pixel === 1 ? (
            <div 
              key={`${x}-${y}`} 
              className="absolute bg-[#FF0000]" 
              style={{
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
                top: `${y * pixelSize}px`,
                left: `${x * pixelSize}px`
              }}
            />
          ) : null
        )
      )}
    </div>
  );
};

const Header = () => {
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  return (
    <header className="py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex-1">
          <button className="text-white" aria-label="Open menu">
            <span className="text-2xl">☰</span>
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-white flex items-center">
            <span>THE</span>
            <PixelatedX />
            <span>CLICK</span>
          </div>
          <p className="text-sm text-white mt-1">One shot. Every day. Jackpot.</p>
        </div>
        
        <div className="flex-1 flex items-center justify-end gap-4">
          <button 
            onClick={() => setIsHowToPlayOpen(true)}
            className="text-white"
            aria-label="How to Play"
          >
            <HelpCircle size={24} />
          </button>
          
          <button 
            className="text-white"
            aria-label="User Profile"
          >
            <User size={24} />
          </button>
        </div>
      </div>
      
      <HowToPlayModal 
        isOpen={isHowToPlayOpen} 
        onClose={() => setIsHowToPlayOpen(false)} 
      />
    </header>
  );
};

export default Header;