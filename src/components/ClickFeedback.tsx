import { useState } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { Share2, Copy, X, Twitter, Facebook, Linkedin, Mail, MessageSquare } from 'lucide-react';

const ClickFeedback = () => {
  const { lastClick, hasClicked, dayNumber, jackpot } = useGameContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlatformOptions, setShowPlatformOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
          row += 'X'; // Using uppercase X as requested
        } else {
          row += ' ';
        }
      }
      row += '│';
      boxRows.push(row);
    }
    
    boxRows.push(`└─────────────┘`); // Bottom border with box-drawing characters
    
    return `The Click: Day ${dayNumber}
${boxRows.join('\n')}
 Distance: ${formattedDistance}px
Jackpot: $${formattedJackpot} 
theclickgame.com`;
  };
  
  // Web Share API handler
  const handleShare = async () => {
    const shareText = generateShareText();
    const shareData = {
      title: 'The Click - Daily Pixel Challenge',
      text: shareText,
      url: 'https://theclickgame.com'
    };

    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } catch (err) {
        console.error('Error sharing:', err);
        // Fall back to platform options if sharing fails
        setShowPlatformOptions(true);
      }
    } else {
      // Show platform options for unsupported browsers
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
    // This just copies the text since Discord doesn't have a direct share API
    navigator.clipboard.writeText(generateShareText());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    setShowPlatformOptions(false);
  };

  const shareToSlack = () => {
    // This just copies the text since Slack doesn't have a direct share API
    navigator.clipboard.writeText(generateShareText());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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
    navigator.clipboard.writeText(generateShareText());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    setShowShareModal(false);
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
            
            <div className="bg-slate-700 p-4 rounded-lg mb-4 font-mono whitespace-pre overflow-x-auto">
              {generateShareText()}
            </div>
            
            {!showPlatformOptions ? (
              <div className="flex gap-3">
                <button 
                  onClick={handleShare}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Share to platforms"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Copy to clipboard"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
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
                    onClick={copyToClipboard}
                    className={`flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      copySuccess ? 'bg-green-600' : ''
                    }`}
                    aria-label="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copySuccess ? 'Copied!' : 'Copy Text'}
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