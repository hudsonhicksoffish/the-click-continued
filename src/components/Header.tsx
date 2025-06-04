import { useState } from 'react';
import { HelpCircle, User } from 'lucide-react';
import HowToPlayModal from './HowToPlayModal';

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
            <span className="mx-2 text-[#FF0000]">x</span>
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