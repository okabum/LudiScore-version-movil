

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Zap, FileSearch, Lock, Calculator, Eraser } from 'lucide-react';
import { Button } from './Button';
import { Keypad } from './Keypad';
import { Player, GameSettings } from '../types';

interface ScoringScreenProps {
  selectedPlayerId: string | null;
  players: Player[];
  activePlayerId: string | null;
  currentTurnScore: number;
  settings: GameSettings;
  
  onBackToList: () => void;
  onNavigatePlayer: (dir: 'next' | 'prev') => void;
  onOpenExtras: () => void;
  onOpenHistory: () => void;
  onSelectPlayer: (id: string) => void;
  onQuickAdd: (amount: number) => void;
  onKeypadPress: (key: string) => void;
  onKeypadDelete: () => void;
  onKeypadClear: () => void;
  onCommitTurn: () => void;
  onPassTurnRequest: () => void;
  
  t: (key: any) => string;
  getPlayerInitials: (name: string) => string;
  textColors: Record<string, string>;
}

export const ScoringScreen: React.FC<ScoringScreenProps> = ({
  selectedPlayerId,
  players,
  activePlayerId,
  currentTurnScore,
  settings,
  onBackToList,
  onNavigatePlayer,
  onOpenExtras,
  onOpenHistory,
  onSelectPlayer,
  onQuickAdd,
  onKeypadPress,
  onKeypadDelete,
  onKeypadClear,
  onCommitTurn,
  onPassTurnRequest,
  t,
  getPlayerInitials,
  textColors
}) => {
    const scoringPlayerScrollRef = useRef<HTMLDivElement>(null);
    const player = players.find(p => p.id === selectedPlayerId);

    // Initialize state from local storage to persist the mode across navigation/reloads
    const [inputMode, setInputMode] = useState<'QUICK' | 'KEYPAD'>(() => {
        const saved = localStorage.getItem('sm_input_mode');
        return (saved === 'QUICK' || saved === 'KEYPAD') ? saved : 'KEYPAD';
    });
    
    // State for Quick Mode Polarity (1 or -1)
    const [quickPolarity, setQuickPolarity] = useState<1 | -1>(1);

    // Save mode preference when changed
    useEffect(() => {
        localStorage.setItem('sm_input_mode', inputMode);
    }, [inputMode]);

    // Scroll to active player
    useEffect(() => {
        if (selectedPlayerId && scoringPlayerScrollRef.current) {
            const selectedElement = document.getElementById(`score-player-${selectedPlayerId}`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedPlayerId]);

    // Helpers for Hex colors
    const getColorStyle = (color: string) => color.startsWith('#') ? { backgroundColor: color } : {};
    const getColorClass = (color: string) => color.startsWith('#') ? '' : color;
    // Determine text color for custom background (simple check for dark hex might be overkill, defaults to standard text)
    // If custom color, we just use default text color, as textColors map won't match
    const getTextColorClass = (color: string) => textColors[color] || 'text-gray-900 dark:text-white';

    const switchMode = (mode: 'QUICK' | 'KEYPAD') => {
        if (mode !== inputMode) {
            setInputMode(mode);
            onKeypadClear(); // Reset score to 0 on mode switch
        }
    };

    if (!player) return null;

    const textColorClass = getTextColorClass(player.color);
    
    // Check if it is this player's turn
    const isTurn = activePlayerId === player.id;
    const activePlayer = players.find(p => p.id === activePlayerId);

    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-white dark:bg-gray-800 shadow-sm shrink-0 z-10">
          <button onClick={onBackToList} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 shrink-0">
            <ArrowLeft size={24} className="rtl:rotate-180" />
          </button>
          
          <div className="flex items-center gap-4 min-w-0 flex-1 justify-center">
              <button onClick={() => onNavigatePlayer('prev')} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                  <ChevronLeft size={24} className="rtl:rotate-180" />
              </button>
              <div className="flex flex-col items-center min-w-0">
                 <span className="text-xs uppercase font-bold text-gray-400 tracking-wider whitespace-nowrap">{t('turnOf')}</span>
                 <h2 className={`text-xl font-black ${textColorClass} truncate max-w-[150px]`}>{player.name}</h2>
              </div>
              <button onClick={() => onNavigatePlayer('next')} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                  <ChevronRight size={24} className="rtl:rotate-180" />
              </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onOpenExtras} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                 <Zap size={24} />
            </button>
            <button onClick={onOpenHistory} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <FileSearch size={24} />
            </button>
          </div>
        </div>
        
        {/* Horizontal Player Scores */}
        <div 
            ref={scoringPlayerScrollRef}
            className="flex gap-3 overflow-x-auto py-2 px-4 shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 scrollbar-hide snap-x"
        >
            {[...players].sort((a,b) => b.totalScore - a.totalScore).map(p => (
                <div 
                    key={p.id} 
                    id={`score-player-${p.id}`}
                    onClick={() => onSelectPlayer(p.id)}
                    className={`flex flex-col items-center min-w-[60px] cursor-pointer snap-start transition-all duration-200 ${p.id === selectedPlayerId ? 'scale-105 opacity-100' : 'opacity-60 grayscale scale-95'}`}
                >
                    <div 
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold shadow-sm mb-1 ring-2 ${p.id === selectedPlayerId ? 'ring-gray-900 dark:ring-white' : 'ring-transparent'} ${getColorClass(p.color)}`}
                        style={getColorStyle(p.color)}
                    >
                        {getPlayerInitials(p.name)}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {p.totalScore}
                    </span>
                </div>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] relative">
            
            {/* Warning Overlay if not turn */}
            {!isTurn && (
                <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-2 px-4">
                    <button 
                        onClick={() => activePlayer && onSelectPlayer(activePlayer.id)}
                        className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg text-xs sm:text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 fade-in transition-transform active:scale-95 cursor-pointer"
                    >
                        <Lock size={12} /> 
                        <span>{t('notYourTurn')}</span>
                        {activePlayer && <span className="opacity-80 font-normal hidden sm:inline">- {t('turnOfPlayer')} {activePlayer.name}</span>}
                    </button>
                </div>
            )}
            
            {/* Combined Total and Input Display */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 mb-2 sm:mb-4 flex items-center justify-between relative overflow-hidden shrink-0 ${!isTurn ? 'opacity-50' : ''}`}>
                 {/* Progress Bar Background */}
                 {settings.targetScore && (
                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
                        <div 
                            className={`h-full ${getColorClass(player.color)} transition-all duration-500`}
                            style={{ 
                                width: `${Math.min(100, ((player.totalScore + currentTurnScore) / settings.targetScore) * 100)}%`,
                                ...getColorStyle(player.color)
                            }}
                        ></div>
                     </div>
                 )}

                 {/* Left: Total */}
                 <div className="flex-1 text-center">
                     <span className="text-[10px] sm:text-xs uppercase text-gray-400 font-bold mb-0.5 block">{t('total')}</span>
                     <div className={`text-3xl sm:text-5xl font-black ${textColorClass}`}>
                         {player.totalScore + currentTurnScore}
                     </div>
                 </div>

                 {/* Divider */}
                 <div className="w-px h-8 sm:h-12 bg-gray-200 dark:bg-gray-700 mx-2 sm:mx-4"></div>

                 {/* Right: Add (Input) */}
                 <div className="flex-1 text-center">
                     <span className="text-[10px] sm:text-xs uppercase text-gray-400 font-bold mb-0.5 block">{t('points')}</span>
                     <div className={`text-3xl sm:text-5xl font-black ${currentTurnScore === 0 ? 'text-gray-300 dark:text-gray-600' : (currentTurnScore > 0 ? 'text-green-500' : 'text-red-500')}`}>
                        {currentTurnScore > 0 ? '+' : ''}{currentTurnScore}
                     </div>
                 </div>
            </div>
            
            {/* Spacer to push controls to bottom if screen is tall */}
            <div className="flex-1 min-h-2"></div>

            {/* Input Mode Selector */}
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl mb-3 shrink-0">
                <button 
                    onClick={() => switchMode('KEYPAD')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'KEYPAD' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <Calculator size={16} /> {t('modeKeypad')}
                </button>
                <button 
                    onClick={() => switchMode('QUICK')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'QUICK' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <Zap size={16} /> {t('modeQuick')}
                </button>
            </div>

            {/* Conditional Input Rendering */}
            {inputMode === 'QUICK' ? (
                <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-3 mb-3 sm:mb-5 shrink-0 ${!isTurn ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                    {/* Polarity Toggle */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setQuickPolarity(-1)}
                            className={`flex-1 py-3 rounded-2xl font-black text-2xl shadow-sm transition-all border-2 ${quickPolarity === -1 ? 'bg-red-500 text-white border-red-500 scale-105' : 'bg-white dark:bg-gray-800 text-red-500 border-red-200 dark:border-red-900'}`}
                        >
                            -
                        </button>

                        <button 
                            onClick={onKeypadClear}
                            className="w-20 rounded-2xl font-black text-xl shadow-sm transition-all border-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
                            title={t('reset')}
                        >
                            <Eraser size={24} />
                        </button>

                        <button 
                            onClick={() => setQuickPolarity(1)}
                            className={`flex-1 py-3 rounded-2xl font-black text-2xl shadow-sm transition-all border-2 ${quickPolarity === 1 ? 'bg-green-500 text-white border-green-500 scale-105' : 'bg-white dark:bg-gray-800 text-green-500 border-green-200 dark:border-green-900'}`}
                        >
                            +
                        </button>
                    </div>

                    {/* Value Grid */}
                    <div className="grid grid-cols-4 gap-2">
                         {[1, 5, 10, 20, 50, 100, 200, 500].map(val => (
                             <button
                                 key={val}
                                 onClick={() => onQuickAdd(val * quickPolarity)}
                                 className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 font-bold text-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-sm border border-gray-200 dark:border-gray-700"
                             >
                                 {val}
                             </button>
                         ))}
                    </div>
                </div>
            ) : (
                <div className={`mb-3 sm:mb-5 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300 ${!isTurn ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                    <Keypad 
                        onKeyPress={onKeypadPress}
                        onDelete={onKeypadDelete}
                        onClear={onKeypadClear}
                    />
                </div>
            )}

            <Button 
                fullWidth 
                variant={currentTurnScore === 0 ? "secondary" : "primary"}
                onClick={currentTurnScore === 0 ? onPassTurnRequest : onCommitTurn}
                disabled={!isTurn}
                className={`py-3 sm:py-4 text-base sm:text-lg shadow-xl shrink-0 ${currentTurnScore === 0 ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : 'shadow-indigo-500/30 animate-pulse'} ${!isTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                 {currentTurnScore === 0 ? t('passTurn') : t('applyAndNext')}
            </Button>
        </div>
      </div>
    );
};
