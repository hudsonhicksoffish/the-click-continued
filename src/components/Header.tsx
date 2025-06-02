import { useState } from 'react';
import { Target } from 'lucide-react';
import HowToPlayModal from './HowToPlayModal';

const Header = () => {
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  return (
    <header className="bg-slate-800 border-b border-slate-700 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Target size={24} className="text-emerald-500 mr-2" />
          <h1 className="text-xl font-bold text-white">THE CLICK</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHowToPlayOpen(true)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            How to Play
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