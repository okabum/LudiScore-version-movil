
import React from 'react';
import { Trophy, ShoppingBag, Coffee } from 'lucide-react';
import { Button } from './Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 rotate-12">
            <Trophy size={32} className="text-white -rotate-12" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('aboutTitle')}</h3>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-4">{t('aboutVersion')}</p>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
            {t('aboutDesc')}
          </p>
          
          <div className="w-full space-y-3 mb-6">
             <p className="text-xs text-gray-400 dark:text-gray-600 mb-2">{t('aboutSupport')}</p>
             
             <a 
                href="https://play.google.com/store/apps/details?id=com.ludiscore.app" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-opacity shadow-lg"
             >
                 <ShoppingBag size={20} />
                 <span>{t('supportGooglePlay')}</span>
             </a>

             <a 
                href="https://buymeacoffee.com/donpablete" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-[#FFDD00] text-black font-bold hover:bg-[#FFDD00]/90 transition-colors shadow-lg shadow-yellow-500/20"
             >
                 <Coffee size={20} />
                 <span>{t('buyMeCoffee')}</span>
             </a>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-600 mb-4">
            <p>{t('aboutCredit')}</p>
          </div>

          <Button fullWidth onClick={onClose}>
            {t('understood')}
          </Button>
        </div>
      </div>
    </div>
  );
};
