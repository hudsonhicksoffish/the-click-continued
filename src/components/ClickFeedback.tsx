import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { Share2, Copy, X, Twitter, Facebook, Linkedin, Mail, MessageSquare } from 'lucide-react';
import { formatDateKey } from '../utils/dateUtils';

const ClickFeedback = () => {
  const { lastClick, hasClicked, dayNumber, jackpot } = useGameContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlatformOptions, setShowPlatformOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate share text for fallback and clipboard
  const generateShareText = useCallback(() => {
    const formattedJackpot = jackpot.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `The Click: Day ${dayNumber}\nDistance: ${lastClick ? Math.round(lastClick.distance) : '?'}px\nJackpot: $${formattedJackpot}\ntheclickgame.com`;
  }, [lastClick, dayNumber, jackpot]);
  
  // Generate image for sharing
  const generateShareImage = useCallback(() => {
    if (!lastClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas dimensions
    const width = 500;
    const height = 350;
    canvas.width = width;
    canvas.height = height;
    
    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`The Click: Day ${dayNumber}`, width / 2, 40);
    
    // Draw grid
    const gridSize = 200;
    const gridX = (width - gridSize) / 2;
    const gridY = 70;
    
    // Grid background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(gridX, gridY, gridSize, gridSize);
    
    // Grid border
    ctx.strokeStyle = '#475569'; // slate-600
    ctx.lineWidth = 2;
    ctx.strokeRect(gridX, gridY, gridSize, gridSize);
    
    // Grid lines
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 1; x < 4; x++) {
      const lineX = gridX + (gridSize * x) / 4;
      ctx.beginPath();
      ctx.moveTo(lineX, gridY);
      ctx.lineTo(lineX, gridY + gridSize);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 1; y < 4; y++) {
      const lineY = gridY + (gridSize * y) / 4;
      ctx.beginPath();
      ctx.moveTo(gridX, lineY);
      ctx.lineTo(gridX + gridSize, lineY);
      ctx.stroke();
    }
    
    // Calculate normalized position within grid
    const normalizedX = Math.min(Math.max(lastClick.x / 1000, 0), 1);
    const normalizedY = Math.min(Math.max(lastClick.y / 1000, 0), 1);
    
    // Draw user's click marker
    const markerX = gridX + normalizedX * gridSize;
    const markerY = gridY + normalizedY * gridSize;
    
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.beginPath();
    ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw X in marker
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', markerX, markerY);
    
    // Distance and jackpot info
    const formattedJackpot = jackpot.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const formattedDistance = Math.round(lastClick.distance);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distance: ${formattedDistance}px`, width / 2, gridY + gridSize + 40);
    ctx.fillText(`Jackpot: $${formattedJackpot}`, width / 2, gridY + gridSize + 70);
    
    // Website URL
    ctx.fillStyle = '#3b82f6'; // blue-500
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('theclickgame.com', width / 2, height - 30);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    setShareImage(dataUrl);
  }, [lastClick, dayNumber, jackpot]);
  
  // Generate share image when modal opens
  useEffect(() => {
    if (showShareModal && canvasRef.current && !shareImage && lastClick) {
      generateShareImage();
    }
  }, [showShareModal, shareImage, generateShareImage, lastClick]);

  if (!hasClicked || !lastClick) {
    return null;
  }

  const { distance } = lastClick;
  const formattedDistance = Math.round(distance);
  
  // Web Share API handler
  const handleShare = async () => {
    if (!shareImage) return;
    
    try {
      // Convert data URL to blob for sharing
      const res = await fetch(shareImage);
      const blob = await res.blob();
      const file = new File([blob], 'the-click-result.png', { type: 'image/png' });
      
      const shareData: any = {
        title: 'The Click - Daily Pixel Challenge',
        text: generateShareText(),
      };
      
      // Add image file if supported by the browser
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      } else {
        shareData.url = 'https://theclickgame.com';
      }

      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else {
        // Fall back to platform options if sharing fails
        setShowPlatformOptions(true);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fall back to platform options if sharing fails
      setShowPlatformOptions(true);
    }
  };

  // Platform-specific share handlers
  const shareToTwitter = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setShowPlatformOptions(false);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://theclickgame.com')}`, '_blank');
    setShowPlatformOptions(false);
  };

  const shareToLinkedIn = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent('https://theclickgame.com')}&title=${encodeURIComponent('The Click - Daily Pixel Challenge')}&summary=${text}`, '_blank');
    setShowPlatformOptions(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('The Click - Daily Pixel Challenge');
    const body = encodeURIComponent(generateShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowPlatformOptions(false);
  };

  const shareToDiscord = () => {
    // For Discord we'll download the image
    if (shareImage) {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = shareImage;
      link.download = `the-click-day-${dayNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setShowPlatformOptions(false);
  };

  const shareToSlack = () => {
    // For Slack we'll download the image
    if (shareImage) {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = shareImage;
      link.download = `the-click-day-${dayNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setShowPlatformOptions(false);
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

  const copyToClipboard = () => {
    if (shareImage) {
      // For clipboard we'll download the image
      const link = document.createElement('a');
      link.href = shareImage;
      link.download = `the-click-day-${dayNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowShareModal(false);
  };

  // Save the result to the device
  const saveImage = () => {
    if (shareImage) {
      const link = document.createElement('a');
      link.href = shareImage;
      link.download = `the-click-day-${dayNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="text-center mt-6">
      <h2 className={`text-2xl font-bold ${colorClass} mb-2`}>
        {formattedDistance} PIXELS AWAY
      </h2>
      <p className={`${colorClass} font-medium`}>{feedbackMessage}</p>
      
      <button
        onClick={() => setShowShareModal(true)}
        className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded-lg transition-colors inline-flex items-center"
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Share Your Result</h2>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setShowPlatformOptions(false);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
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
                  className="rounded-lg border border-slate-700 max-w-full h-auto"
                />
              </div>
            )}
            
            {!showPlatformOptions ? (
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleShare}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Share to platforms"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                
                <button 
                  onClick={saveImage}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Save image"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Save Image
                </button>
                
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
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
                    className="bg-slate-700 hover:bg-[#1DA1F2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Twitter"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    X (Twitter)
                  </button>
                  
                  <button 
                    onClick={shareToFacebook}
                    className="bg-slate-700 hover:bg-[#1877F2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Facebook"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </button>
                  
                  <button 
                    onClick={shareToLinkedIn}
                    className="bg-slate-700 hover:bg-[#0A66C2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to LinkedIn"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </button>
                  
                  <button 
                    onClick={shareViaEmail}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share via Email"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </button>
                  
                  <button 
                    onClick={shareToDiscord}
                    className="bg-slate-700 hover:bg-[#5865F2] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Discord"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discord
                  </button>
                  
                  <button 
                    onClick={shareToSlack}
                    className="bg-slate-700 hover:bg-[#4A154B] text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                    aria-label="Share to Slack"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Slack
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={saveImage}
                    className={`flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      copySuccess ? 'bg-green-600' : ''
                    }`}
                    aria-label="Save image"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copySuccess ? 'Saved!' : 'Save Image'}
                  </button>
                  
                  <button 
                    onClick={() => setShowPlatformOptions(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
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