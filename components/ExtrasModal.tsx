
import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, X, Dices, Clock, Timer, Coins, Play, Pause, Save, Check, Hand, Users } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

type ChessMode = 'STANDARD' | 'GONG' | 'FISCHER' | 'BRONSTEIN';
type ActiveTool = 'MENU' | 'DICE' | 'TIMER' | 'PICKER' | 'CHESS' | 'COIN' | 'FINGER';

interface ExtrasModalProps {
  isOpen: boolean;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onClose: () => void;
  t: (key: any) => string;
  
  // Dice
  diceSides: number;
  setDiceSides: (sides: number) => void;
  diceCount: number;
  setDiceCount: (count: number) => void;
  diceResults: number[];
  isRolling: boolean;
  onRollDice: () => void;

  // Coin
  coinResult: 'HEADS' | 'TAILS' | null;
  isFlipping: boolean;
  onFlipCoin: () => void;

  // Timer
  timerLeft: number;
  setTimerLeft: React.Dispatch<React.SetStateAction<number>>; 
  isTimerActive: boolean;
  setIsTimerActive: (active: boolean) => void;
  timerStartValue: number;
  setTimerStartValue: (val: number) => void;
  formatTime: (seconds: number) => string;

  // Picker
  players: Player[];
  pickerId: string | null;
  isPicking: boolean;
  pickerDone: boolean;
  onPickPlayer: () => void;
  getPlayerInitials: (name: string) => string;
  hasUsedWhoStarts: boolean;
  view: string;

  // Chess
  chessModeType: ChessMode;
  setChessModeType: (mode: ChessMode) => void;
  chessGameState: 'SETUP' | 'READY' | 'PLAYING' | 'PAUSED' | 'FINISHED';
  setChessGameState: React.Dispatch<React.SetStateAction<'SETUP' | 'READY' | 'PLAYING' | 'PAUSED' | 'FINISHED'>>;
  chessConfig: any;
  setChessConfig: React.Dispatch<React.SetStateAction<any>>;
  chessTime1: number;
  setChessTime1: React.Dispatch<React.SetStateAction<number>>;
  chessTime2: number;
  setChessTime2: React.Dispatch<React.SetStateAction<number>>;
  chessActive: 1 | 2 | null;
  chessTurnCount: number;
  suspendedChessState: Record<string, any>;
  onStartChessGameRequest: () => void;
  onResumeChessGame: () => void;
  onRequestSaveChessGame: () => void;
  handleChessTap: (player: 1 | 2) => void;
  handleChessExitRequest: () => void;
}

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  isOpen, activeTool, setActiveTool, onClose, t,
  diceSides, setDiceSides, diceCount, setDiceCount, diceResults, isRolling, onRollDice,
  coinResult, isFlipping, onFlipCoin,
  timerLeft, setTimerLeft, isTimerActive, setIsTimerActive, timerStartValue, setTimerStartValue, formatTime,
  players, pickerId, isPicking, pickerDone, onPickPlayer, getPlayerInitials, hasUsedWhoStarts, view,
  chessModeType, setChessModeType, chessGameState, setChessGameState, chessConfig, setChessConfig,
  chessTime1, setChessTime1, chessTime2, setChessTime2, chessActive, chessTurnCount, suspendedChessState,
  onStartChessGameRequest, onResumeChessGame, onRequestSaveChessGame, handleChessTap, handleChessExitRequest
}) => {
  const pickerListRef = useRef<HTMLDivElement>(null);

  // Finger Picker State
  const [touches, setTouches] = useState<Record<string, {x: number, y: number, color: string}>>({});
  const [fingerStatus, setFingerStatus] = useState<'WAITING' | 'COUNTDOWN' | 'SELECTED'>('WAITING');
  const [winnerTouchId, setWinnerTouchId] = useState<string | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const fingerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Colors for finger picker
  const fingerColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];

  // Scroll to picker item
  useEffect(() => {
      if (activeTool === 'PICKER' && pickerId) {
          const el = document.getElementById(`picker-player-${pickerId}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
      }
  }, [pickerId, activeTool]);

  // Clean up timer on unmount or tool change
  useEffect(() => {
      if (activeTool !== 'FINGER') {
          if (fingerTimerRef.current) {
              clearInterval(fingerTimerRef.current);
              fingerTimerRef.current = null;
          }
          setTouches({});
          setFingerStatus('WAITING');
          setWinnerTouchId(null);
      }
  }, [activeTool]);

  if (!isOpen) return null;

  const isChessActive = activeTool === 'CHESS' && chessGameState !== 'SETUP';
  const isFingerActive = activeTool === 'FINGER';
  
  const modifyTimer = (amount: number) => {
    setTimerLeft(prev => {
        const newValue = Math.max(0, prev + amount);
        if (!isTimerActive) {
            setTimerStartValue(newValue);
        }
        return newValue;
    });
  };

  const getColorStyle = (color: string) => color.startsWith('#') ? { backgroundColor: color } : {};
  const getColorClass = (color: string) => color.startsWith('#') ? '' : color;

  // Helper to prevent button clicks being registered as game touches
  const isTargetButton = (e: any) => {
      return e.target.tagName === 'BUTTON' || e.target.closest('button');
  };

  // Finger Picker Logic
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (activeTool !== 'FINGER' || fingerStatus === 'SELECTED') return;
      if (isTargetButton(e)) return;
      
      const newTouches = { ...touches };
      let changed = false;

      // Add new touches
      for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const id = String(touch.identifier);
          if (!newTouches[id]) {
                // Assign a random color based on ID (simple hash)
                const colorIndex = touch.identifier % fingerColors.length;
                newTouches[id] = {
                    x: touch.clientX,
                    y: touch.clientY,
                    color: fingerColors[Math.abs(colorIndex)]
                };
                changed = true;
          }
      }

      if (changed) {
          setTouches(newTouches);
          resetFingerTimer(Object.keys(newTouches).length);
      }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (activeTool !== 'FINGER' || fingerStatus === 'SELECTED') return;
      if (isTargetButton(e)) return;
      // Prevent scrolling while using finger picker
      e.preventDefault();
      
      setTouches(prev => {
          const next = { ...prev };
          let changed = false;
          for (let i = 0; i < e.changedTouches.length; i++) {
              const t = e.changedTouches[i];
              const id = String(t.identifier);
              if (next[id]) {
                  next[id] = { ...next[id], x: t.clientX, y: t.clientY };
                  changed = true;
              }
          }
          return changed ? next : prev;
      });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
      if (activeTool !== 'FINGER') return;
      
      // We process touch end even if it was on a button to ensure cleanup, 
      // but usually the start wouldn't have registered.
      
      const newTouches = { ...touches };
      let changed = false;

      for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const id = String(touch.identifier);
          if (newTouches[id]) {
              delete newTouches[id];
              changed = true;
          }
      }

      if (changed) {
          setTouches(newTouches);
          if (fingerStatus !== 'SELECTED') {
              resetFingerTimer(Object.keys(newTouches).length);
          }
      }
  };

  // Mouse Handlers for Web Support
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool !== 'FINGER' || fingerStatus === 'SELECTED') return;
      if (isTargetButton(e)) return;

      const id = 'mouse';
      setTouches(prev => {
          const next = { ...prev };
          if (!next[id]) {
              next[id] = {
                  x: e.clientX,
                  y: e.clientY,
                  color: fingerColors[Math.floor(Math.random() * fingerColors.length)]
              };
              resetFingerTimer(Object.keys(next).length);
          }
          return next;
      });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool !== 'FINGER' || fingerStatus === 'SELECTED') return;
      if (isTargetButton(e)) return;
      // Only update if mouse button is held down (buttons === 1)
      if (e.buttons !== 1) return;

      setTouches(prev => {
          if (!prev['mouse']) return prev;
          return {
              ...prev,
              ['mouse']: { ...prev['mouse'], x: e.clientX, y: e.clientY }
          };
      });
  };

  const handleMouseUp = () => {
      if (activeTool !== 'FINGER') return;
      setTouches(prev => {
          if (!prev['mouse']) return prev;
          const next = { ...prev };
          delete next['mouse'];
          if (fingerStatus !== 'SELECTED') {
              resetFingerTimer(Object.keys(next).length);
          }
          return next;
      });
  };

  const resetFingerTimer = (touchCount: number) => {
      if (fingerTimerRef.current) {
          clearInterval(fingerTimerRef.current);
          fingerTimerRef.current = null;
      }
      
      if (fingerStatus !== 'SELECTED') {
          setWinnerTouchId(null);
      }

      if (touchCount > 1) {
          setFingerStatus('COUNTDOWN');
          setCountdownValue(3);
          
          // Start interval countdown
          fingerTimerRef.current = setInterval(() => {
              setCountdownValue((prev) => {
                  if (prev <= 1) {
                      if (fingerTimerRef.current) {
                          clearInterval(fingerTimerRef.current);
                          fingerTimerRef.current = null;
                      }
                      pickFingerWinner();
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000); 
      } else {
          setFingerStatus('WAITING');
          setCountdownValue(3);
      }
  };

  const pickFingerWinner = () => {
      setFingerStatus('SELECTED');
      setTouches(current => {
          const ids = Object.keys(current);
          if (ids.length > 0) {
              const winner = ids[Math.floor(Math.random() * ids.length)];
              setWinnerTouchId(winner);
          }
          return current;
      });
  };

  const resetFingerGame = (e?: React.MouseEvent | React.TouchEvent) => {
      if (e) {
          e.stopPropagation();
          e.preventDefault();
      }
      setWinnerTouchId(null);
      setFingerStatus('WAITING');
      setCountdownValue(3);
      // If touches are still active, restart countdown immediately
      resetFingerTimer(Object.keys(touches).length);
  };

  const handleBackFromFinger = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setActiveTool('MENU');
  };

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 ${activeTool === 'CHESS' || activeTool === 'FINGER' ? 'overflow-hidden' : ''}`}>
         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleChessExitRequest} />
         
         <div className={`relative ${activeTool === 'FINGER' ? 'bg-transparent border-0 shadow-none w-full h-full max-w-none m-0 p-0 pointer-events-auto' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl'} animate-in zoom-in-95 duration-200 flex flex-col ${activeTool === 'CHESS' ? 'h-[95dvh] max-h-[900px]' : activeTool === 'FINGER' ? 'h-full' : 'h-auto max-h-[90dvh]'}`}>
             
             {/* Header - Hidden for Finger Picker (it uses custom UI) and active Chess */}
             {!isChessActive && !isFingerActive && (
                 <div className="flex justify-between items-center mb-6 shrink-0">
                     <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        {activeTool !== 'MENU' && (
                            <button onClick={handleChessExitRequest} className="text-gray-400 hover:text-gray-900 dark:hover:text-white rtl:rotate-180">
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        {activeTool === 'MENU' ? t('extras') : 
                         activeTool === 'DICE' ? t('rollDice') :
                         activeTool === 'TIMER' ? t('timer') : 
                         activeTool === 'COIN' ? t('coinFlip') :
                         activeTool === 'CHESS' ? t('chessClock') : t('whoStarts')}
                     </h3>
                     <button onClick={handleChessExitRequest} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                         <X size={24} />
                     </button>
                 </div>
             )}

             <div className={`flex-1 flex flex-col justify-center h-full min-h-0 ${!isChessActive && !isFingerActive ? 'overflow-y-auto scrollbar-hide' : ''}`}>
                {activeTool === 'MENU' && (
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setActiveTool('DICE')} className="flex items-center gap-4 bg-indigo-50 dark:bg-gray-800 p-4 rounded-2xl hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors w-full text-left">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Dices size={24} />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t('rollDice')}</span>
                        </button>
                        
                        <button onClick={() => setActiveTool('TIMER')} className="flex items-center gap-4 bg-orange-50 dark:bg-gray-800 p-4 rounded-2xl hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors w-full text-left">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-gray-700 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                <Clock size={24} />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t('timer')}</span>
                        </button>
                        
                        <button onClick={() => { setChessGameState('SETUP'); setActiveTool('CHESS'); }} className="flex items-center gap-4 bg-blue-50 dark:bg-gray-800 p-4 rounded-2xl hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors w-full text-left">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Timer size={24} />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t('chessClock')}</span>
                        </button>

                        <button onClick={() => setActiveTool('FINGER')} className="flex items-center gap-4 bg-pink-50 dark:bg-gray-800 p-4 rounded-2xl hover:bg-pink-100 dark:hover:bg-gray-700 transition-colors w-full text-left">
                            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-gray-700 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                                <Hand size={24} />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t('fingerPicker')}</span>
                        </button>
                    </div>
                )}

                {activeTool === 'DICE' && (
                    <div className="flex flex-col items-center gap-4">
                        {/* Dice Count Selector */}
                        <div className="flex gap-2 mb-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shadow-sm">
                             {[1, 2, 3, 4, 5].map(count => (
                                <button
                                    key={count}
                                    onClick={() => setDiceCount(count)}
                                    className={`w-8 h-8 rounded-md font-bold text-sm transition-colors ${diceCount === count ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                >
                                    {count}
                                </button>
                             ))}
                        </div>

                        {/* Dice Sides Selector */}
                        <div className="grid grid-cols-4 gap-2 w-full mb-2">
                            {[2, 4, 6, 8, 10, 12, 20, 100].map(sides => (
                                <button
                                    key={sides}
                                    onClick={() => setDiceSides(sides)}
                                    className={`py-2 px-1 rounded-lg font-bold text-xs sm:text-sm transition-colors border flex items-center justify-center ${diceSides === sides ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                                    title={sides === 2 ? t('coinFlip') : `d${sides}`}
                                >
                                    {sides === 2 ? <Coins size={20} /> : (sides === 100 ? 'd100' : `d${sides}`)}
                                </button>
                            ))}
                        </div>

                        {/* Result Display */}
                        <div className={`w-full bg-indigo-600 rounded-3xl flex flex-col items-center justify-center py-6 text-white shadow-xl min-h-[140px] ${isRolling ? 'animate-pulse' : ''}`}>
                            <div className="text-6xl font-black mb-1 text-center">
                                {diceSides === 2 ? (
                                    diceCount === 1 ? (
                                        diceResults[0] === 1 ? t('heads') : t('tails')
                                    ) : (
                                        diceResults.reduce((a, b) => a + (b === 1 ? 1 : 0), 0) // Count Heads if multiple
                                    )
                                ) : (
                                    diceResults.reduce((a, b) => a + b, 0)
                                )}
                            </div>
                            
                            {/* Subtitle / Details */}
                             {diceSides === 2 && diceCount > 1 && (
                                <span className="text-indigo-200 text-sm font-bold">{t('heads')}</span>
                            )}
                            
                            {/* Individual Dice Results */}
                            {diceCount > 1 && (
                                <div className="flex flex-wrap gap-2 justify-center px-4 mt-2">
                                    {diceResults.map((r, i) => (
                                        <span key={i} className="text-indigo-200 font-bold text-sm bg-indigo-700/50 px-2 py-0.5 rounded">
                                            {diceSides === 2 
                                                ? (r === 1 ? t('heads') : t('tails'))
                                                : r
                                            }
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button fullWidth onClick={onRollDice} disabled={isRolling}>
                            {isRolling ? t('rolling') : `${t('rollDice')} (${diceCount}${diceSides === 2 ? ' Coins' : `d${diceSides}`})`}
                        </Button>
                    </div>
                )}

                {activeTool === 'TIMER' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className={`text-6xl font-black font-mono tabular-nums ${timerLeft === 0 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                            {formatTime(timerLeft)}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2 justify-center">
                            <button onClick={() => modifyTimer(-60)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">-1m</button>
                            <button onClick={() => modifyTimer(-10)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">-10s</button>
                            <button onClick={() => modifyTimer(10)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">+10s</button>
                            <button onClick={() => modifyTimer(60)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">+1m</button>
                            <button onClick={() => modifyTimer(300)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">+5m</button>
                            <button onClick={() => modifyTimer(600)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">+10m</button>
                        </div>

                        <Button 
                            fullWidth 
                            variant={isTimerActive || timerLeft === 0 ? "danger" : "primary"}
                            onClick={() => {
                                if (isTimerActive || timerLeft === 0) {
                                    setIsTimerActive(false);
                                    setTimerLeft(timerStartValue);
                                } else {
                                    setIsTimerActive(true);
                                }
                            }}
                        >
                            {isTimerActive || timerLeft === 0 ? t('reset') : t('start')}
                        </Button>
                    </div>
                )}

                {activeTool === 'CHESS' && (
                    chessGameState === 'SETUP' ? (
                        <div className="flex flex-col gap-4 animate-in fade-in h-full">
                            <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
                                {(['STANDARD', 'GONG', 'FISCHER', 'BRONSTEIN'] as ChessMode[]).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setChessModeType(mode)}
                                        className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${chessModeType === mode ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        {t(`mode${mode.charAt(0) + mode.slice(1).toLowerCase()}` as any)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4">
                                {suspendedChessState[chessModeType] && (
                                    <button 
                                        onClick={onResumeChessGame}
                                        className="w-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl flex items-center justify-between group hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{t('resumeChessGame')}</div>
                                            <div className="text-xs text-indigo-500 dark:text-indigo-500/70">
                                                {t(`mode${suspendedChessState[chessModeType].mode.charAt(0) + suspendedChessState[chessModeType].mode.slice(1).toLowerCase()}` as any)} • Turn {suspendedChessState[chessModeType].turnCount}
                                            </div>
                                        </div>
                                        <Play size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </button>
                                )}

                                {chessModeType !== 'GONG' && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-gray-500 uppercase">{t('totalTime')}</label>
                                            <span className="font-mono font-bold text-lg">{Math.floor(chessConfig.time / 60)}m</span>
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <button onClick={() => setChessConfig((p: any) => ({...p, time: Math.max(60, p.time - 60)}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">-1m</button>
                                            <button onClick={() => setChessConfig((p: any) => ({...p, time: p.time + 60}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+1m</button>
                                            <button onClick={() => setChessConfig((p: any) => ({...p, time: p.time + 300}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+5m</button>
                                        </div>

                                        {chessModeType === 'STANDARD' && (
                                            <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t('customTime')}</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={Math.floor(chessConfig.time / 60)} 
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val) && val > 0) setChessConfig((p: any) => ({...p, time: val * 60}));
                                                        }}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-center font-bold"
                                                    />
                                                    <span className="text-xs font-bold text-gray-400 shrink-0">min</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {chessModeType === 'GONG' && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                        <label className="text-sm font-bold text-gray-500 uppercase mb-3 block">{t('timePerTurn')}</label>
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                            {[15, 30, 45, 60, 90, 120].map(sec => (
                                                <button
                                                    key={sec}
                                                    onClick={() => setChessConfig((p: any) => ({...p, gong: sec}))}
                                                    className={`py-2 rounded-lg font-bold border ${chessConfig.gong === sec ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                                                >
                                                    {sec}{t('secondsShort')}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t('customTime')}</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    value={chessConfig.gong} 
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val) && val > 0) setChessConfig((p: any) => ({...p, gong: val}));
                                                    }}
                                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-center font-bold"
                                                />
                                                <span className="text-xs font-bold text-gray-400 shrink-0">sec</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(chessModeType === 'FISCHER') && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-gray-500 uppercase">{t('increment')}</label>
                                            <span className="font-mono font-bold text-lg">+{chessConfig.inc}s</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setChessConfig((p: any) => ({...p, inc: Math.max(0, p.inc - 1)}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">-1s</button>
                                            <button onClick={() => setChessConfig((p: any) => ({...p, inc: p.inc + 1}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+1s</button>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-sm font-bold text-gray-500 uppercase">{t('incStartTurn')}</label>
                                                <span className="font-mono font-bold text-lg">#{chessConfig.incStart}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setChessConfig((p: any) => ({...p, incStart: Math.max(1, p.incStart - 1)}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">-1</button>
                                                <button onClick={() => setChessConfig((p: any) => ({...p, incStart: p.incStart + 1}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+1</button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-3 italic leading-relaxed">{t('fischerDesc')}</p>
                                    </div>
                                )}

                                {chessModeType === 'BRONSTEIN' && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-gray-500 uppercase">{t('increment')}</label>
                                            <span className="font-mono font-bold text-lg">+{chessConfig.inc}s</span>
                                        </div>
                                        <p className="text-xs text-gray-400 italic leading-relaxed">{t('bronsteinDesc')}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button fullWidth onClick={onStartChessGameRequest}>
                                    {t('start')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full flex-1 min-h-0 relative">
                            
                            {/* Ready State Overlay */}
                            {chessGameState === 'READY' && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/70 text-white px-6 py-3 rounded-full font-bold animate-pulse text-center">
                                        {t('tapToStart')}
                                    </div>
                                </div>
                            )}

                            {/* Player 2 Area (Top - Inverted) */}
                            <button
                                onMouseDown={() => handleChessTap(2)}
                                onTouchStart={(e) => { e.preventDefault(); handleChessTap(2); }}
                                disabled={chessGameState === 'FINISHED'}
                                className={`flex-1 rounded-t-3xl flex items-center justify-center text-5xl sm:text-7xl font-black transition-all relative active:scale-[0.99] touch-manipulation select-none ${chessActive === 2 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-4 ring-inset ring-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}
                            >
                                <div className="rotate-180 flex flex-col items-center">
                                        <span className="font-mono tabular-nums">{formatTime(chessTime2)}</span>
                                        {chessActive === 2 && <span className="text-xs font-bold mt-2 animate-pulse">{t('turnOf')} P2</span>}
                                </div>
                            </button>

                            {/* Controls Bar */}
                            <div className="h-14 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
                                <button 
                                    onClick={handleChessExitRequest}
                                    className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                
                                <div className="flex items-center gap-2 flex-1 justify-center">
                                        {chessGameState !== 'READY' && chessGameState !== 'FINISHED' && (
                                        <>
                                            <button 
                                                onClick={onRequestSaveChessGame}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                title={t('save')}
                                            >
                                                <Save size={16} />
                                            </button>
                                            <div className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg uppercase tracking-wider mx-2">
                                                {t(`mode${chessModeType.charAt(0) + chessModeType.slice(1).toLowerCase()}` as any)}
                                            </div>
                                            <button 
                                                onClick={() => setChessGameState((prev: any) => prev === 'PAUSED' ? 'PLAYING' : 'PAUSED')}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${chessGameState === 'PAUSED' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                                            >
                                                {chessGameState === 'PAUSED' ? <Play size={16} className="ml-0.5" /> : <Pause size={16} />}
                                            </button>
                                        </>
                                        )}
                                </div>

                                <div className="text-xs font-mono font-bold text-gray-400">
                                    #{chessTurnCount}
                                </div>
                            </div>

                            {/* Player 1 Area (Bottom) */}
                            <button
                                onMouseDown={() => handleChessTap(1)}
                                onTouchStart={(e) => { e.preventDefault(); handleChessTap(1); }}
                                disabled={chessGameState === 'FINISHED'}
                                className={`flex-1 rounded-b-3xl flex items-center justify-center text-5xl sm:text-7xl font-black transition-all relative active:scale-[0.99] touch-manipulation select-none ${chessActive === 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-4 ring-inset ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="font-mono tabular-nums">{formatTime(chessTime1)}</span>
                                    {chessActive === 1 && <span className="text-xs font-bold mt-2 animate-pulse">{t('turnOf')} P1</span>}
                                </div>
                            </button>
                        </div>
                    )
                )}

                {activeTool === 'FINGER' && (
                    <div 
                        className="w-full h-full relative touch-none select-none bg-black rounded-xl overflow-hidden cursor-crosshair"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Exit button floating */}
                        <button 
                            onClick={handleBackFromFinger}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="absolute top-4 left-4 z-50 p-2 text-white/50 hover:text-white bg-white/10 rounded-full"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Hint Text */}
                        {Object.keys(touches).length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 animate-pulse pointer-events-none">
                                <Hand size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-bold">{t('placeFingers')}</p>
                            </div>
                        )}

                        {/* Countdown Status */}
                        {fingerStatus === 'COUNTDOWN' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="text-9xl font-black text-white/90 animate-ping">
                                    {countdownValue}
                                </div>
                            </div>
                        )}

                        {/* Winner & Reset */}
                        {fingerStatus === 'SELECTED' && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
                                <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                                    <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-bounce mb-4 pointer-events-none">
                                        {t('winner')}
                                    </div>
                                    <Button 
                                        onClick={resetFingerGame} 
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        className="shadow-2xl ring-4 ring-white/20 pointer-events-auto relative z-50"
                                    >
                                        {t('pickAgain')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Touches */}
                        {Object.entries(touches).map(([id, touch]) => {
                            const t = touch as {x: number, y: number, color: string};
                            const isWinner = String(winnerTouchId) === id;
                            return (
                            <div 
                                key={id}
                                className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none
                                    ${winnerTouchId !== null && !isWinner ? 'opacity-10 scale-50' : 'opacity-100 scale-100'}
                                    ${isWinner ? 'scale-150 ring-4 ring-white animate-pulse shadow-[0_0_50px_currentColor]' : ''}
                                `}
                                style={{ 
                                    left: t.x, 
                                    top: t.y, 
                                    width: isWinner ? 120 : 90, 
                                    height: isWinner ? 120 : 90, 
                                    backgroundColor: t.color,
                                    boxShadow: isWinner ? `0 0 60px ${t.color}` : `0 0 30px ${t.color}`,
                                    zIndex: isWinner ? 20 : 10
                                }}
                            />
                        )})}
                    </div>
                )}

                {activeTool === 'PICKER' && (
                        <div className="flex flex-col items-center gap-6 w-full h-full justify-center">
                        {players.length > 0 ? (
                            <>
                                <div ref={pickerListRef} className="w-full flex flex-col gap-2 max-h-[250px] overflow-y-auto scrollbar-hide flex-1">
                                    {players.map(p => (
                                        <div 
                                            id={`picker-player-${p.id}`}
                                            key={p.id} 
                                            className={`p-3 rounded-xl flex items-center gap-3 transition-all ${pickerId === p.id ? `bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500 scale-105` : 'bg-gray-50 dark:bg-gray-800 opacity-50'}`}
                                        >
                                            <div 
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColorClass(p.color)}`}
                                                style={getColorStyle(p.color)}
                                            >
                                                {getPlayerInitials(p.name)}
                                            </div>
                                            <span className={`font-bold truncate ${pickerId === p.id ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto w-full pt-2">
                                    <Button fullWidth onClick={onPickPlayer} disabled={isPicking}>
                                        {isPicking ? t('rolling') : (pickerDone ? <span className="flex items-center gap-2"><Check size={18} /> {t('proceed')}</span> : t('pick'))}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 italic">{t('addPlayer')}</p>
                        )}
                        </div>
                )}
             </div>
         </div>
    </div>
  );
};
