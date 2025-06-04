import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { Share2, Copy, X, Twitter, Facebook, Linkedin, Mail, MessageSquare } from 'lucide-react';

const ClickFeedback = () => {
  const { lastClick, hasClicked, dayNumber, jackpot } = useGameContext();
  const [showShareModal, setShowShareModal] = useState(false);
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
    const width = 500;
    
    // Vertical spacing constant
    const verticalSpacing = 20;
    
    // First set canvas width
    canvas.width = width;
    
    // Define vertical positions dynamically
    // Title position
    const titleY = 40;
    
    // Grid parameters
    const gridSize = 200;
    const gridX = (width - gridSize) / 2;
    const gridY = titleY + 30; // Position after title
    
    // Calculate positions for text elements after the grid
    const distanceTextY = gridY + gridSize + verticalSpacing * 2;
    const jackpotTextY = distanceTextY + verticalSpacing * 2;
    
    // Website URL is positioned with enough space after jackpot
    const websiteTextY = jackpotTextY + verticalSpacing * 2;
    
    // Calculate total canvas height with padding at the bottom
    const totalHeight = websiteTextY + verticalSpacing * 2;
    
    // Set canvas height
    canvas.height = totalHeight;
    
    // Background
    ctx.fillStyle = '#000000'; // Black background to match app theme
    ctx.fillRect(0, 0, width, totalHeight);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
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
    ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw X in marker
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', markerX, markerY);
    
    // Reset textBaseline for subsequent text
    ctx.textBaseline = 'top';
    
    // Distance info
    const formattedDistance = Math.round(lastClick.distance);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Inter, sans-serif';
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
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('theclickgame.com', width / 2, websiteTextY);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    setShareImage(dataUrl);
  }, [lastClick, dayNumber, jackpot]);
  
  // Generate share image when modal opens
  useEffect(() => {
    if (showShareModal && canvasRef.current && !shareImage && lastClick) {
      generateShareImage();
    }

    // Cleanup when modal closes
    return () => {
      if (!showShareModal) {
        setShareImage(null);
      }
    };
  }, [showShareModal, shareImage, generateShareImage, lastClick]);

  if (!hasClicked || !lastClick) {
    return null;
  }

  const { distance } = lastClick;
  const formattedDistance = Math.round(distance);
  
  // Web Share API handler - FIXED to better handle permission issues
  const handleShare = async () => {
    if (!shareImage) return;
    
    try {
      // Convert data URL to blob for sharing
      const res = await fetch(shareImage);
      const blob = await res.blob();
      const file = new File([blob], 'the-click-result.png', { type: 'image/png' });
      
      // First try with file sharing if supported
      if (navigator.share && 
          navigator.canShare && 
          navigator.canShare({ files: [file] })) {
        try {
          // Try file sharing
          await navigator.share({
            title: 'The Click - Daily Pixel Challenge',
            text: generateShareText(),
            files: [file]
          });
          setShowShareModal(false);
          return; // Exit if successful
        } catch (fileShareError) {
          console.error('File sharing failed:', fileShareError);
          // Continue to text-only sharing
        }
      }
      
      // If file sharing failed or isn't available, try text-only sharing
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'The Click - Daily Pixel Challenge',
            text: generateShareText(),
            url: 'https://theclickgame.com'
          });
          setShowShareModal(false);
          return; // Exit if successful
        } catch (textShareError) {
          console.error('Text sharing failed:', textShareError);
          // Fall through to platform options
        }
      }
      
      // If we reach here, all Web Share API attempts failed or weren't available
      setShowPlatformOptions(true);
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
    setShowShareModal(false);
  };

  const shareToFacebook = () => {
    // Using simple Facebook sharer to avoid issues
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + 
      encodeURIComponent('https://theclickgame.com'), 
      '_blank', 'noopener,noreferrer');
    setShowShareModal(false);
  };

  const shareToLinkedIn = () => {
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + 
      encodeURIComponent('https://theclickgame.com'), 
      '_blank', 'noopener,noreferrer');
    setShowShareModal(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('The Click - Daily Pixel Challenge');
    const body = encodeURIComponent(generateShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    setShowShareModal(false);
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
    // For Discord we'll download the image
    if (downloadImage()) {
      // Show success message
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowShareModal(false);
  };

  const shareToSlack = () => {
    // For Slack we'll download the image
    if (downloadImage()) {
      // Show success message
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowShareModal(false);
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

  // Save the result image
  const saveImage = () => {
    if (downloadImage()) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowShareModal(false);
    setShowPlatformOptions(false);
    setShareImage(null); // Clear image to ensure fresh generation next time
  };

  return (
    <div className="text-center mt-6">
      <h2 className={`text-2xl font-bold ${colorClass} mb-2`}>
        {formattedDistance} PIXELS AWAY
      </h2>
      <p className={`${colorClass} font-medium`}>{feedbackMessage}</p>
      
      <button
        onClick={() => setShowShareModal(true)}
        className="mt-4 bg-[#FF0000] hover:bg-red-700 text-white py-2 px-6 rounded-lg transition-colors inline-flex items-center"
        aria-label="Share your result"
      >
        <Share2 className="h-5 w-5 mr-2" />
        Share Result
      </button>
      
      {/* Hidden canvas for generating the share image */}
      <canvas 
        ref={canvasRef} 
        className="hidden" 
        aria-hidden="true"
      />
      
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] rounded-lg p-6 max-w-md w-full border border-[#333333]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                Share Your Result
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-[#FF0000] transition-colors p-1 rounded-full hover:bg-[#222222]"
                aria-label="Close sharing dialog"
              >
                <X size={20} />
              </button>
            </div>
            
            {shareImage && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={shareImage} 
                  alt="Your click result" 
                  className="rounded-lg border border-[#333333] max-w-full h-auto"
                />
              </div>
            )}
            
            {!showPlatformOptions ? (
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleShare}
                  className="flex-1 bg-[#FF0000] hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Share to platforms"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                
                <button 
                  onClick={saveImage}
                  className="flex-1 bg-[#222222] hover:bg-[#333333] text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Save image"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Save Image
                </button>
                
                <button 
                  onClick={handleCloseModal}
                  className="bg-[#333333] hover:bg-[#444444] text-white py-2 px-4 rounded-lg transition-colors"
                  aria-label="Close sharing dialog"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-sm text-gray-300 mb-3">Share via:</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    onClick={shareToTwitter}
                    className="bg-[#222222] hover:bg-[#1DA1F2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Twitter"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    X (Twitter)
                  </button>
                  
                  <button 
                    onClick={shareToFacebook}
                    className="bg-[#222222] hover:bg-[#1877F2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Facebook"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </button>
                  
                  <button 
                    onClick={shareToLinkedIn}
                    className="bg-[#222222] hover:bg-[#0A66C2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to LinkedIn"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </button>
                  
                  <button 
                    onClick={shareViaEmail}
                    className="bg-[#222222] hover:bg-[#333333] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share via Email"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </button>
                  
                  <button 
                    onClick={shareToDiscord}
                    className="bg-[#222222] hover:bg-[#5865F2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Discord"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discord
                  </button>
                  
                  <button 
                    onClick={shareToSlack}
                    className="bg-[#222222] hover:bg-[#4A154B] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Slack"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Slack
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={saveImage}
                    className={`flex-1 bg-[#222222] hover:bg-[#333333] text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      copySuccess ? 'bg-[#FF0000]' : ''
                    }`}
                    aria-label="Save image"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copySuccess ? 'Saved!' : 'Save Image'}
                  </button>
                  
                  <button 
                    onClick={() => setShowPlatformOptions(false)}
                    className="bg-[#333333] hover:bg-[#444444] text-white py-2 px-4 rounded-lg transition-colors"
                    aria-label="Go back"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClickFeedback;