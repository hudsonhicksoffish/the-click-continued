import { useState, useRef, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';
import ShareCard from './ShareCard';

interface GridProps {
  disabled?: boolean;
}

const Grid = ({ disabled = false }: GridProps) => {
  const { registerClick, hasClicked, lastClick, setHasClicked, devMode } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [showShareCard, setShowShareCard] = useState(false);
  
  // Setup and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateCanvasSize = () => {
      // Get container width
      const parentWidth = canvas.parentElement?.clientWidth || 500;
      // Make canvas square
      const size = Math.min(parentWidth, 500);
      
      // Set displayed size (CSS)
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      
      // Set actual canvas size (with higher resolution for better rendering)
      const scale = window.devicePixelRatio || 1;
      canvas.width = size * scale;
      canvas.height = size * scale;
      
      // Store grid size for calculations
      setGridSize({ width: size, height: size });
      
      // Scale the drawing context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
      }
      
      // Redraw canvas
      drawCanvas();
    };
    
    // Initial setup
    updateCanvasSize();
    
    // Add resize listener
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  // Redraw canvas when game state changes
  useEffect(() => {
    drawCanvas();
  }, [hasClicked, lastClick, disabled, gridSize]);

  // Show share card automatically after unsuccessful click
  useEffect(() => {
    if (hasClicked && lastClick && lastClick.distance !== -1) {
      // Check if it was unsuccessful (distance > 0)
      if (lastClick.distance > 0) {
        // Small delay to let the click marker render first
        const timer = setTimeout(() => {
          setShowShareCard(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [hasClicked, lastClick]);

  // Reset canvas for dev mode when double-clicked
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (devMode && hasClicked) {
      e.preventDefault();
      setHasClicked(false);
      setShowShareCard(false);
      drawCanvas();
    }
  };
  
  // Draw the canvas based on game state
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const displayWidth = gridSize.width;
    const displayHeight = gridSize.height;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // If user has clicked, draw only the click marker
    if (hasClicked && lastClick) {
      // Draw user's click marker
      const normalizedX = (lastClick.x / 1000) * displayWidth;
      const normalizedY = (lastClick.y / 1000) * displayHeight;
      
      drawPixelatedX(ctx, normalizedX, normalizedY, '#FF0000');
    }
    
    // Draw border LAST so it's on top and outside the game area
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, displayWidth - 3, displayHeight - 3);
  };
  
  // Draw a pixelated 'X' marker - increased size for better visibility
  const drawPixelatedX = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    color: string
  ) => {
    const pixelSize = 4; // Increased from 2 to 4 for better visibility
    ctx.fillStyle = color;
    
    // Draw a 5x5 pixel X
    const pattern = [
      [1, 0, 0, 0, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1]
    ];
    
    const offsetX = x - (pattern[0].length * pixelSize) / 2;
    const offsetY = y - (pattern.length * pixelSize) / 2;
    
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        if (pattern[py][px] === 1) {
          ctx.fillRect(
            offsetX + px * pixelSize, 
            offsetY + py * pixelSize, 
            pixelSize, 
            pixelSize
          );
        }
      }
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || (hasClicked && !devMode)) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Get click position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to 0-1000 range
    const gridX = Math.floor((x / rect.width) * 1000);
    const gridY = Math.floor((y / rect.height) * 1000);
    
    // If in dev mode and already clicked, reset state first
    if (devMode && hasClicked) {
      setHasClicked(false);
      setShowShareCard(false);
    }
    
    // Register click
    registerClick(gridX, gridY);
  };

  const handleCloseShareCard = () => {
    setShowShareCard(false);
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Show share card instead of canvas when appropriate */}
      {showShareCard && hasClicked && lastClick ? (
        <div className="w-full aspect-square flex items-center justify-center">
          <ShareCard onClose={handleCloseShareCard} />
        </div>
      ) : (
        <>
          <canvas 
            ref={canvasRef}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            className={`w-full aspect-square ${
              disabled ? 'opacity-75 cursor-not-allowed' : hasClicked && !devMode ? 'cursor-default' : 'cursor-pointer'
            }`}
          />
          
          {/* Only show helper text when canvas is visible and not clicked */}
          {!hasClicked && (
            <>
              {devMode && (
                <div className="text-xs text-[#FF0000] mt-2 text-center">
                  Developer mode: Unlimited attempts enabled
                </div>
              )}
              
              {!devMode && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                  One attempt per day. Choose wisely!
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Grid;