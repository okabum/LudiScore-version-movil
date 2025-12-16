

import React from 'react';
import { X, ChevronLeft, ChevronRight, FileSearch } from 'lucide-react';
import { Player } from '../types';

interface PlayerHistoryModalProps {
  isOpen: boolean;
  player: Player | undefined;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  getPlayerInitials: (name: string) => string;
  t: (key: any) => string;
}

export const PlayerHistoryModal: React.FC<PlayerHistoryModalProps> = ({
  isOpen,
  player,
  onClose,
  onNavigate,
  getPlayerInitials,
  t
}) => {
  if (!isOpen || !player) return null;

  const getColorStyle = (color: string) => color.startsWith('#') ? { backgroundColor: color } : {};
  const getColorClass = (color: string) => color.startsWith('#') ? '' : color;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl w-full max-w-sm shadow-2xl h-auto max-h-[85dvh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header with Close */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-lg">{t('playerHistory')}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Player Navigation Bar */}
            <div className="flex items-center justify-between mb-6 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700 shrink-0">
                <button onClick={() => onNavigate('prev')} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95">
                    <ChevronLeft size={24} className="rtl:rotate-180" />
                </button>
                
                <div className="flex items-center gap-3">
                    <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm ${getColorClass(player.color)}`}
                        style={getColorStyle(player.color)}
                    >
                        {getPlayerInitials(player.name)}
                    </div>
                    <div className="font-bold text-base truncate max-w-[140px]">{player.name}</div>
                </div>

                <button onClick={() => onNavigate('next')} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95">
                    <ChevronRight size={24} className="rtl:rotate-180" />
                </button>
            </div>
            
            {/* History List (Clean) */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {player.history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
                        <FileSearch size={32} className="opacity-20" />
                        <p className="italic text-sm">{t('noMoves')}</p>
                    </div>
                ) : (
                    player.history.map((turn, i) => (
                        <div key={turn.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-400 font-mono font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">#{player.history.length - i}</span>
                            <div className={`font-black text-xl ${turn.amount > 0 ? 'text-green-500' : turn.amount < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {turn.amount > 0 ? '+' : ''}{turn.amount}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};
