import { useState, useRef, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';

interface GridProps {
  disabled?: boolean;
}

const Grid = ({ disabled = false }: GridProps) => {
  const { registerClick, hasClicked, lastClick, revealedTargetPixel, setHasClicked } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  
  // Check for developer mode
  const isDevMode = new URLSearchParams(window.location.search).get('dev') === 'true';
  
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
  }, [hasClicked, lastClick, revealedTargetPixel, disabled]);

  // Reset canvas for dev mode when double-clicked
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDevMode && hasClicked) {
      e.preventDefault();
      setHasClicked(false);
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
    
    // Draw border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, displayWidth - 3, displayHeight - 3);
    
    // If user has clicked, draw the post-click state
    if (hasClicked && lastClick) {
      // Draw user's click marker
      const normalizedX = (lastClick.x / 1000) * displayWidth;
      const normalizedY = (lastClick.y / 1000) * displayHeight;
      
      drawPixelatedX(ctx, normalizedX, normalizedY, '#FF0000');
      
      // Draw "SEE YOU TMRW" pixel art
      drawSeeYouTomorrow(ctx, displayWidth, displayHeight);
    }
    
    // If target is revealed, draw target marker
    if (revealedTargetPixel) {
      const targetX = (revealedTargetPixel.x / 1000) * displayWidth;
      const targetY = (revealedTargetPixel.y / 1000) * displayHeight;
      
      drawPixelatedX(ctx, targetX, targetY, '#FF0000');
    }
  };
  
  // Draw a pixelated 'X' marker
  const drawPixelatedX = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    color: string
  ) => {
    const pixelSize = 2;
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
  
  // Draw "SEE YOU TMRW" pixel art
  const drawSeeYouTomorrow = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Define pixel art for "SEE YOU TMRW" text
    const pixelArt = [
      [0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0],
      [0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
      [0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      [0,0,0,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      [0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
      [0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
      [1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
      [0,1,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
      [0,1,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
      [0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
      [0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
      [0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,1,1,0,1,0],
      [1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      [1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      [1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      [1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      [1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      [0,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,1,0]
    ];
    
    const pixelSize = 4;
    const artWidth = pixelArt[0].length * pixelSize;
    const artHeight = pixelArt.length * pixelSize;
    
    // Calculate center position
    const startX = (width - artWidth) / 2;
    const startY = (height - artHeight) / 2;
    
    // Draw darker background for pixel art
    ctx.fillStyle = '#111111';
    ctx.fillRect(
      startX - pixelSize,
      startY - pixelSize,
      artWidth + pixelSize * 2,
      artHeight + pixelSize * 2
    );
    
    // Draw the pixel art
    ctx.fillStyle = '#222222'; // Dark gray for the text
    
    for (let y = 0; y < pixelArt.length; y++) {
      for (let x = 0; x < pixelArt[y].length; x++) {
        if (pixelArt[y][x] === 1) {
          // Randomly colorize some pixels red (X in SEE)
          const isRedPixel = x === 6 && y >= 0 && y <= 6;
          
          ctx.fillStyle = isRedPixel ? '#FF0000' : '#222222';
          
          ctx.fillRect(
            startX + x * pixelSize, 
            startY + y * pixelSize, 
            pixelSize, 
            pixelSize
          );
        }
      }
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || (hasClicked && !isDevMode)) return;
    
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
    if (isDevMode && hasClicked) {
      setHasClicked(false);
    }
    
    // Register click
    registerClick(gridX, gridY);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <canvas 
        ref={canvasRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`w-full aspect-square ${
          disabled ? 'opacity-75 cursor-not-allowed' : hasClicked && !isDevMode ? 'cursor-default' : 'cursor-pointer'
        }`}
      />
      
      {isDevMode && (
        <div className="text-xs text-[#FF0000] mt-2 text-center">
          Developer mode: {hasClicked ? "Click again to retry" : "Unlimited attempts enabled"}
        </div>
      )}
      
      {!isDevMode && (
        <div className="text-xs text-gray-400 mt-2 text-center">
          One attempt per day. Choose wisely!
        </div>
      )}
    </div>
  );
};

export default Grid;