import { useState, useRef, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';

interface GridProps {
  disabled?: boolean;
}

const Grid = ({ disabled = false }: GridProps) => {
  const { registerClick, hasClicked, lastClick, targetPixel } = useGameContext();
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [showTarget, setShowTarget] = useState(false);

  useEffect(() => {
    const updateGridSize = () => {
      if (gridRef.current) {
        const { width, height } = gridRef.current.getBoundingClientRect();
        setGridSize({ width, height });
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);

    return () => {
      window.removeEventListener('resize', updateGridSize);
    };
  }, []);

  useEffect(() => {
    // Show target after click with a slight delay
    if (hasClicked && lastClick) {
      const timer = setTimeout(() => {
        setShowTarget(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasClicked, lastClick]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || hasClicked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 1000);
    
    // Record click position for animation
    setClickPosition({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
    
    // Register click with the game context
    registerClick(x, y);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        ref={gridRef}
        className={`relative aspect-square w-full border border-gray-700 bg-slate-800 rounded-lg overflow-hidden ${
          disabled ? 'opacity-75 cursor-not-allowed' : hasClicked ? 'cursor-default' : 'cursor-pointer'
        }`}
        onClick={handleClick}
      >
        {/* Grid lines - subtle background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Click marker */}
        {clickPosition && hasClicked && lastClick && (
          <div
            className="absolute w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
            style={{
              left: clickPosition.x,
              top: clickPosition.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-white font-bold text-xs">X</span>
          </div>
        )}
        
        {/* Target marker (only shown after click) */}
        {showTarget && hasClicked && (
          <div
            className="absolute w-6 h-6 rounded-full border-2 border-emerald-400"
            style={{
              left: `${(targetPixel.x / 1000) * gridSize.width}px`,
              top: `${(targetPixel.y / 1000) * gridSize.height}px`,
              transform: 'translate(-50%, -50%)'
            }}
          ></div>
        )}
        
        {/* Overlay for disabled state */}
        {disabled && (
          <div className="absolute inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center">
            <div className="bg-slate-800 rounded-lg p-4 shadow-lg max-w-xs text-center">
              <p className="text-lg font-medium">You've already clicked today!</p>
              <p className="text-sm text-gray-400 mt-2">Come back tomorrow for another chance.</p>
            </div>
          </div>
        )}
        
        {/* Initial state message */}
        {!hasClicked && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-70">
            <p className="font-medium">CLICK ANYWHERE</p>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-400 mt-2 text-center">
        One attempt per day. Choose wisely!
      </div>
    </div>
  );
};

export default Grid;
