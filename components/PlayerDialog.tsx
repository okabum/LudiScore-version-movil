

import React from 'react';
import { X, AlertTriangle, Check, Pipette } from 'lucide-react';
import { Button } from './Button';

interface PlayerDialogProps {
  // We use the ID to control the dialog via standard HTMLDialogElement API as per original
  dialogId: string;
  isEditing: boolean;
  name: string;
  setName: (name: string) => void;
  color: string;
  setColor: (color: string) => void;
  playersCount: number;
  predefinedColors: string[];
  isColorTaken: (color: string) => boolean;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  t: (key: any) => string;
}

export const PlayerDialog: React.FC<PlayerDialogProps> = ({
  dialogId,
  isEditing,
  name,
  setName,
  color,
  setColor,
  playersCount,
  predefinedColors,
  isColorTaken,
  onSave,
  onDelete,
  onClose,
  t
}) => {
  const isCustomColor = !predefinedColors.includes(color) && color.startsWith('#');

  return (
    <dialog id={dialogId} className="bg-transparent backdrop:bg-black/80 p-0 w-full max-w-sm m-auto z-50">
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl m-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{isEditing ? t('editPlayer') : t('newPlayer')}</h3>
            
            <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${t('player')} ${playersCount + 1}`}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white mb-4 focus:border-indigo-500 focus:outline-none"
                autoFocus
                enterKeyHint="done"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        onSave();
                        onClose();
                    }
                }}
            />

            <div className="grid grid-cols-4 gap-2 mb-2">
                {predefinedColors.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-10 rounded-lg ${c} ${color === c ? 'ring-2 ring-indigo-500 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : 'opacity-50 hover:opacity-100'} transition-all relative`}
                    >
                        {isColorTaken(c) && color !== c && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                            </div>
                        )}
                    </button>
                ))}
                 {/* Custom Color Picker in Dialog */}
                 <div className={`h-10 rounded-lg relative overflow-hidden transition-all ${isCustomColor ? 'ring-2 ring-indigo-500 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : 'opacity-50 hover:opacity-100 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                    <input 
                        type="color" 
                        value={isCustomColor ? color : '#333333'}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ backgroundColor: isCustomColor ? color : undefined }}>
                        {isCustomColor ? <Check size={16} className="text-white drop-shadow-md" /> : <Pipette size={16} className="text-gray-500 dark:text-gray-300" />}
                    </div>
                 </div>
            </div>
            
            {isColorTaken(color) && (
                <div className="flex items-center gap-2 text-orange-500 text-xs mb-6 font-bold animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle size={12} /> {t('colorWarning')}
                </div>
            )}
            {!isColorTaken(color) && <div className="mb-6"></div>}
            
            <div className="flex gap-3">
                {isEditing && (
                     <button 
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                        className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                     >
                        {t('delete')}
                     </button>
                )}
                <Button 
                    fullWidth 
                    onClick={() => {
                        onSave();
                        onClose();
                    }}
                >
                    {t('save')}
                </Button>
            </div>
             <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white rtl:right-auto rtl:left-4"
                onClick={onClose}
            >
                <X size={24} />
            </button>
        </div>
    </dialog>
  );
};
