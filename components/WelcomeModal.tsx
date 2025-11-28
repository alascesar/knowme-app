import React from 'react';
import { Button } from './Button';
import { IconUser, SparklesIcon } from './Icons';

interface WelcomeModalProps {
  onCompleteProfile: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onCompleteProfile, onSkip }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative">
        {/* Decorative Background Header */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-20 bg-white rounded-full p-1 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-indigo-500">
                 <SparklesIcon className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 pb-8 px-8 text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome Aboard!</h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Your account has been created. Would you like to set up your profile photo and details now?
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              fullWidth 
              size="lg" 
              onClick={onCompleteProfile}
              className="shadow-lg shadow-indigo-500/30"
            >
              Complete My Profile
            </Button>
            
            <button 
              onClick={onSkip}
              className="w-full py-3 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};