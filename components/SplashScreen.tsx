
import React from 'react';
import { CreditCard, Dices, Check } from 'lucide-react';

interface SplashScreenProps {
  showSplash: boolean;
  splashFading: boolean;
  dontShowSplashAgain: boolean;
  onDismiss: () => void;
  onToggleDontShow: (e: React.MouseEvent) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  showSplash,
  splashFading,
  dontShowSplashAgain,
  onDismiss,
  onToggleDontShow,
}) => {
  if (!showSplash) return null;

  return (
    <div 
      onClick={onDismiss}
      className={`fixed inset-0 z-[100] bg-indigo-950 flex flex-col items-center justify-center p-6 text-white transition-opacity duration-500 cursor-pointer overflow-hidden ${splashFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-sm">
        
        {/* Animation Container */}
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
            
            {/* Exploding Cards Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <CreditCard size={64} className="absolute text-pink-500/80 animate-card-left" />
                  <CreditCard size={64} className="absolute text-cyan-500/80 animate-card-right" />
                  <CreditCard size={64} className="absolute text-yellow-500/80 animate-card-bottom" />
            </div>

            {/* Rotating Dice Foreground */}
            <div className="relative z-10 animate-dice-tumble">
                <Dices size={96} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
        </div>

        <h1 className="text-5xl font-black mb-2 tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            LudiScore
        </h1>
        <span className="text-indigo-300 font-bold tracking-widest text-sm animate-in fade-in duration-1000 delay-700">v1.0</span>

      </div>

      <div className="mt-auto pb-safe w-full max-w-xs animate-in fade-in duration-1000 delay-1000">
          <div className="text-center text-indigo-300/50 text-xs uppercase tracking-widest mb-6 animate-pulse">
              Tap to start
          </div>
          
          <div 
            onClick={onToggleDontShow}
            className="flex items-center justify-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer select-none"
          >
              <div className={`w-5 h-5 rounded border border-indigo-400 flex items-center justify-center transition-colors ${dontShowSplashAgain ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent'}`}>
                  {dontShowSplashAgain && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-indigo-200">No volver a mostrar</span>
          </div>
      </div>
    </div>
  );
};
