

import React from 'react';
import { Plus, Check, ArrowLeft, Pipette, Play } from 'lucide-react';
import { Button } from './Button';

interface SetupWizardProps {
  setupWizard: {
    step: 'COUNT' | 'DETAILS';
    total: number;
    current: number;
  } | null;
  customPlayerCount: string;
  setCustomPlayerCount: (val: string) => void;
  showCustomCountInput: boolean;
  setShowCustomCountInput: (val: boolean) => void;
  onInitWizardPlayers: (count: number) => void;
  onCancel: () => void;
  wizardPlayerName: string;
  setWizardPlayerName: (name: string) => void;
  wizardPlayerColor: string;
  setWizardPlayerColor: (color: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onFinishEarly: () => void;
  predefinedColors: string[];
  t: (key: any) => string;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  setupWizard,
  customPlayerCount, setCustomPlayerCount,
  showCustomCountInput, setShowCustomCountInput,
  onInitWizardPlayers,
  onCancel,
  wizardPlayerName, setWizardPlayerName,
  wizardPlayerColor, setWizardPlayerColor,
  onNextStep,
  onPrevStep,
  onFinishEarly,
  predefinedColors,
  t
}) => {
  if (!setupWizard) return null;

  if (setupWizard.step === 'COUNT') {
      return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-300">
                 <h2 className="text-3xl font-black text-center mb-2 text-gray-900 dark:text-white">{t('howManyPlayers')}</h2>
                 <p className="text-gray-500 dark:text-gray-400 text-center mb-8">{t('selectParticipants')}</p>
                 
                 {!showCustomCountInput ? (
                     <div className="grid grid-cols-3 gap-4 mb-6">
                         {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                             <button
                                 key={num}
                                 onClick={() => onInitWizardPlayers(num)}
                                 className="aspect-square bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-3xl font-bold text-gray-900 dark:text-white hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all active:scale-95 shadow-sm hover:shadow-lg"
                             >
                                 {num}
                             </button>
                         ))}
                         <button
                             onClick={() => setShowCustomCountInput(true)}
                             className="aspect-square bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-3xl font-bold text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-all flex items-center justify-center"
                         >
                             <Plus size={32} />
                         </button>
                     </div>
                 ) : (
                     <div className="mb-6">
                         <input 
                            type="number"
                            placeholder="#"
                            value={customPlayerCount}
                            onChange={(e) => setCustomPlayerCount(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded-2xl p-6 text-center text-4xl font-bold mb-4 focus:outline-none text-gray-900 dark:text-white"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const count = parseInt(customPlayerCount);
                                    if (count > 0 && count < 100) onInitWizardPlayers(count);
                                }
                            }}
                         />
                         <Button fullWidth onClick={() => {
                             const count = parseInt(customPlayerCount);
                             if (count > 0 && count < 100) onInitWizardPlayers(count);
                         }} disabled={!customPlayerCount}>
                            {t('accept')}
                         </Button>
                         <button 
                            onClick={() => setShowCustomCountInput(false)}
                            className="w-full text-center text-gray-500 mt-4 py-2"
                         >
                             {t('cancel')}
                         </button>
                     </div>
                 )}
                 
                 <div className="text-center">
                     <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                         {t('cancelGame')}
                     </button>
                 </div>
            </div>
         </div>
      );
  }

  const isCustomColor = !predefinedColors.includes(wizardPlayerColor) && wizardPlayerColor.startsWith('#');
  const canFinishEarly = setupWizard.total > 1 && setupWizard.current > 0;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
         <div className="w-full max-w-sm animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                     <button onClick={onPrevStep} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={24} className="rtl:rotate-180" />
                     </button>
                     {canFinishEarly && (
                         <button 
                            onClick={onFinishEarly} 
                            className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                         >
                            <Play size={14} fill="currentColor" /> {t('finish')}
                         </button>
                     )}
                 </div>
                 <div className="text-indigo-600 dark:text-indigo-500 font-bold bg-indigo-100 dark:bg-indigo-500/10 px-3 py-1 rounded-full text-sm">
                     {setupWizard.current + 1} / {setupWizard.total}
                 </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl mb-6">
                <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{t('player')} {setupWizard.current + 1}</h3>
                
                <div className="mb-6">
                    <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{t('nameOptional')}</label>
                    <input 
                        type="text"
                        value={wizardPlayerName}
                        onChange={(e) => setWizardPlayerName(e.target.value)}
                        placeholder={`${t('player')} ${setupWizard.current + 1}`}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-gray-900 dark:text-white text-lg focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        autoFocus
                        enterKeyHint="next"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                                onNextStep();
                                setTimeout(() => {
                                    const inputs = document.querySelectorAll('input');
                                    if (inputs.length > 0) inputs[0].focus();
                                }, 100);
                            }
                        }}
                    />
                </div>

                <div className="mb-2">
                    <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">{t('color')}</label>
                    <div className="grid grid-cols-4 gap-3">
                        {predefinedColors.map(color => (
                            <button
                                key={color}
                                onClick={() => setWizardPlayerColor(color)}
                                className={`h-12 rounded-xl ${color} ${wizardPlayerColor === color ? 'ring-4 ring-gray-200 dark:ring-gray-700 scale-110 shadow-xl' : 'opacity-40 hover:opacity-100'} transition-all`}
                            >
                                {wizardPlayerColor === color && <Check size={20} className="mx-auto text-white" />}
                            </button>
                        ))}
                        {/* Custom Color Picker */}
                         <div className={`h-12 rounded-xl relative overflow-hidden transition-all ${isCustomColor ? 'ring-4 ring-gray-200 dark:ring-gray-700 scale-110 shadow-xl' : 'opacity-40 hover:opacity-100 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                            <input 
                                type="color" 
                                value={isCustomColor ? wizardPlayerColor : '#333333'}
                                onChange={(e) => setWizardPlayerColor(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                title={t('customColor')}
                            />
                            <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ backgroundColor: isCustomColor ? wizardPlayerColor : undefined }}>
                                {isCustomColor ? <Check size={20} className="text-white drop-shadow-md" /> : <Pipette size={20} className="text-gray-500 dark:text-gray-300" />}
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <Button fullWidth onClick={onNextStep} className="py-4 text-lg shadow-xl shadow-indigo-500/20">
                    {setupWizard.current + 1 === setupWizard.total ? t('startGame') : t('nextPlayer')}
                </Button>
            </div>
         </div>
      </div>
  );
};