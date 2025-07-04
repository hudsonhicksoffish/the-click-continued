import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { Share2, Copy, X, Twitter, Facebook, Linkedin, Mail, MessageSquare } from 'lucide-react';

interface ShareCardProps {
  onClose: () => void;
}

const ShareCard = ({ onClose }: ShareCardProps) => {
  const { lastClick, dayNumber, jackpot } = useGameContext();
  const [showPlatformOptions, setShowPlatformOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate share text for fallback and clipboard
  const generateShareText = useCallback(() => {
    if (!lastClick) return '';
    
    const formattedJackpot = jackpot.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `The Click: Day ${dayNumber}\nDistance: ${Math.round(lastClick.distance)}px\nJackpot: $${formattedJackpot}\ntheclickgame.com`;
  }, [lastClick, dayNumber, jackpot]);
  
  // Generate image for sharing with dynamic sizing
  const generateShareImage = useCallback(() => {
    if (!lastClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas width is fixed
    const width = 400;
    
    // Vertical spacing constant
    const verticalSpacing = 16;
    
    // First set canvas width
    canvas.width = width;
    
    // Define vertical positions dynamically
    // Title position
    const titleY = 30;
    
    // Grid parameters
    const gridSize = 160;
    const gridX = (width - gridSize) / 2;
    const gridY = titleY + 25; // Position after title
    
    // Calculate positions for text elements after the grid
    const distanceTextY = gridY + gridSize + verticalSpacing * 1.5;
    const jackpotTextY = distanceTextY + verticalSpacing * 1.5;
    
    // Website URL is positioned with enough space after jackpot
    const websiteTextY = jackpotTextY + verticalSpacing * 1.5;
    
    // Calculate total canvas height with padding at the bottom
    const totalHeight = websiteTextY + verticalSpacing * 1.5;
    
    // Set canvas height
    canvas.height = totalHeight;
    
    // Background
    ctx.fillStyle = '#000000'; // Black background to match app theme
    ctx.fillRect(0, 0, width, totalHeight);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`THE CLICK: DAY ${dayNumber}`, width / 2, titleY);
    
    // Draw grid
    ctx.fillStyle = '#111111'; // Dark background
    ctx.fillRect(gridX, gridY, gridSize, gridSize);
    
    // Grid border
    ctx.strokeStyle = '#ffffff'; // White border to match game
    ctx.lineWidth = 2;
    ctx.strokeRect(gridX, gridY, gridSize, gridSize);
    
    // Calculate normalized position within grid
    const normalizedX = Math.min(Math.max(lastClick.x / 1000, 0), 1);
    const normalizedY = Math.min(Math.max(lastClick.y / 1000, 0), 1);
    
    // Draw user's click marker
    const markerX = gridX + normalizedX * gridSize;
    const markerY = gridY + normalizedY * gridSize;
    
    ctx.fillStyle = '#FF0000'; // Red X to match theme
    ctx.beginPath();
    ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw X in marker
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', markerX, markerY);
    
    // Reset textBaseline for subsequent text
    ctx.textBaseline = 'top';
    
    // Distance info
    const formattedDistance = Math.round(lastClick.distance);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distance: ${formattedDistance}px`, width / 2, distanceTextY);
    
    // Jackpot info
    const formattedJackpot = jackpot.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    ctx.fillText(`Jackpot: $${formattedJackpot}`, width / 2, jackpotTextY);
    
    // Website URL
    ctx.fillStyle = '#FF0000'; // Red to match theme
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('theclickgame.com', width / 2, websiteTextY);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    setShareImage(dataUrl);
  }, [lastClick, dayNumber, jackpot]);
  
  // Generate share image when component mounts
  useEffect(() => {
    if (canvasRef.current && !shareImage && lastClick) {
      generateShareImage();
    }
  }, [shareImage, generateShareImage, lastClick]);

  if (!lastClick) {
    return null;
  }

  const { distance } = lastClick;
  const formattedDistance = Math.round(distance);
  
  // Utility function to convert data URL to Blob synchronously
  const dataURLtoBlob = (dataURL: string) => {
    // Convert base64 to raw binary data held in a string
    const byteString = atob(dataURL.split(',')[1]);
    
    // Separate out the mime component
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    
    // Write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    // Create a blob with the ArrayBuffer and mime type
    return new Blob([ab], { type: mimeString });
  };
  
  // Web Share API handler
  const handleShare = () => {
    if (!shareImage) return;
    
    try {
      // Convert data URL to blob synchronously (no async fetch)
      const blob = dataURLtoBlob(shareImage);
      const file = new File([blob], 'the-click-result.png', { type: 'image/png' });
      
      // First try with file sharing if supported
      if (navigator.share && 
          navigator.canShare && 
          navigator.canShare({ files: [file] })) {
        navigator.share({
          title: 'The Click - Daily Pixel Challenge',
          text: generateShareText(),
          files: [file]
        }).then(() => {
          onClose();
        }).catch((fileShareError) => {
          console.error('File sharing failed:', fileShareError);
          setShowPlatformOptions(true);
        });
      } else if (navigator.share) {
        // If file sharing isn't available, try text-only sharing
        navigator.share({
          title: 'The Click - Daily Pixel Challenge',
          text: generateShareText(),
          url: 'https://theclickgame.com'
        }).then(() => {
          onClose();
        }).catch((err) => {
          console.error('Text sharing failed:', err);
          setShowPlatformOptions(true);
        });
      } else {
        // Web Share API not available
        setShowPlatformOptions(true);
      }
    } catch (err) {
      console.error('Error in share process:', err);
      // Fall back to platform options
      setShowPlatformOptions(true);
    }
  };

  // Platform-specific share handlers
  const shareToTwitter = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareToFacebook = () => {
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + 
      encodeURIComponent('https://theclickgame.com'), 
      '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareToLinkedIn = () => {
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + 
      encodeURIComponent('https://theclickgame.com'), 
      '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('The Click - Daily Pixel Challenge');
    const body = encodeURIComponent(generateShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const downloadImage = () => {
    if (shareImage) {
      const link = document.createElement('a');
      link.href = shareImage;
      link.download = `the-click-day-${dayNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    return false;
  };

  const shareToDiscord = () => {
    if (downloadImage()) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    onClose();
  };

  const shareToSlack = () => {
    if (downloadImage()) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    onClose();
  };

  const saveImage = () => {
    if (downloadImage()) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="bg-[#111111] rounded-lg p-4 max-w-xs w-full border border-[#333333] shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">
          {formattedDistance} pixels away
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-[#FF0000] transition-colors p-1 rounded-full hover:bg-[#222222]"
          aria-label="Close sharing dialog"
        >
          <X size={16} />
        </button>
      </div>
      
      {shareImage && (
        <div className="mb-3 flex justify-center">
          <img 
            src={shareImage} 
            alt="Your click result" 
            className="rounded-lg border border-[#333333] max-w-full h-auto"
          />
        </div>
      )}
      
      {/* Hidden canvas for generating the share image */}
      <canvas 
        ref={canvasRef} 
        className="hidden" 
        aria-hidden="true"
      />
      
      {!showPlatformOptions ? (
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleShare}
            className="flex-1 bg-[#FF0000] hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
            aria-label="Share to platforms"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </button>
          
          <button 
            onClick={saveImage}
            className="flex-1 bg-[#222222] hover:bg-[#333333] text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
            aria-label="Save image"
          >
            <Copy className="h-3 w-3 mr-1" />
            Save
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-xs text-gray-300 mb-2">Share via:</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button 
              onClick={shareToTwitter}
              className="bg-[#222222] hover:bg-[#1DA1F2] text-white py-2 px-2 rounded-lg transition-colors flex items-center text-xs"
              aria-label="Share to Twitter"
            >
              <Twitter className="h-3 w-3 mr-1" />
              X
            </button>
            
            <button 
              onClick={shareToFacebook}
              className="bg-[#222222] hover:bg-[#1877F2] text-white py-2 px-2 rounded-lg transition-colors flex items-center text-xs"
              aria-label="Share to Facebook"
            >
              <Facebook className="h-3 w-3 mr-1" />
              FB
            </button>
            
            <button 
              onClick={shareToLinkedIn}
              className="bg-[#222222] hover:bg-[#0A66C2] text-white py-2 px-2 rounded-lg transition-colors flex items-center text-xs"
              aria-label="Share to LinkedIn"
            >
              <Linkedin className="h-3 w-3 mr-1" />
              LI
            </button>
            
            <button 
              onClick={shareViaEmail}
              className="bg-[#222222] hover:bg-[#333333] text-white py-2 px-2 rounded-lg transition-colors flex items-center text-xs"
              aria-label="Share via Email"
            >
              <Mail className="h-3 w-3 mr-1" />
              Email
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={saveImage}
              className={`flex-1 bg-[#222222] hover:bg-[#333333] text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-xs ${
                copySuccess ? 'bg-[#FF0000]' : ''
              }`}
              aria-label="Save image"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copySuccess ? 'Saved!' : 'Save'}
            </button>
            
            <button 
              onClick={() => setShowPlatformOptions(false)}
              className="bg-[#333333] hover:bg-[#444444] text-white py-2 px-3 rounded-lg transition-colors text-xs"
              aria-label="Go back"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareCard;