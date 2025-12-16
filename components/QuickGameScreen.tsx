
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Settings, RotateCcw, LayoutGrid, List as ListIcon, Users, Check, X, Minus, History, Pencil, Crown, Pipette, Eraser, GripVertical, AlertTriangle, Trash2, Zap, Dices, Timer, Play, Pause, Coins } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface QuickGameScreenProps {
  onBack: () => void;
  t: (key: any) => string;
  predefinedColors: string[];
}

interface GlobalHistoryItem {
    id: string;
    playerId: string;
    playerName: string;
    playerColor: string;
    amount: number;
    timestamp: number;
}

// Helper component for buttons with long press
const LongPressButton: React.FC<{
    onClick: () => void;
    onLongPress: () => void;
    className?: string;
    children: React.ReactNode;
}> = ({ onClick, onLongPress, className, children }) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const start = (e: React.SyntheticEvent) => {
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            onLongPress();
        }, 600); // 600ms long press
    };

    const end = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isLongPress.current) return;
        onClick();
    };

    return (
        <button
            className={className}
            onMouseDown={start}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchEnd={end}
            onClick={handleClick}
        >
            {children}
        </button>
    );
};

export const QuickGameScreen: React.FC<QuickGameScreenProps> = ({ onBack, t, predefinedColors }) => {
    const [players, setPlayers] = useState<Player[]>(() => {
        const saved = localStorage.getItem('sm_quick_players');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [history, setHistory] = useState<GlobalHistoryItem[]>(() => {
        const saved = localStorage.getItem('sm_quick_history');
        return saved ? JSON.parse(saved) : [];
    });

    const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('GRID');
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Extras State
    const [isExtrasOpen, setIsExtrasOpen] = useState(false);
    
    // Dice State
    const [diceSides, setDiceSides] = useState(6);
    const [diceCount, setDiceCount] = useState(1);
    const [diceResults, setDiceResults] = useState<number[]>([6]);
    const [isRollingDice, setIsRollingDice] = useState(false);
    
    // Timer State
    const [timerStartValue, setTimerStartValue] = useState(() => {
        const saved = localStorage.getItem('sm_quick_timer_start');
        return saved ? parseInt(saved) : 60;
    });
    const [timerLeft, setTimerLeft] = useState(timerStartValue);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    // Audio Context Ref for reliable playback
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Quick Adjust Modal State
    const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean; playerId: string | null; value: number }>({ isOpen: false, playerId: null, value: 0 });
    const [adjustPolarity, setAdjustPolarity] = useState<1 | -1>(1);

    // Edit Player Modal
    const [editModal, setEditModal] = useState<{ isOpen: boolean; player: Player | null }>({ isOpen: false, player: null });
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // Reset Confirm Modal
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

    // Who Starts Result State
    const [whoStartsResult, setWhoStartsResult] = useState<Player | null>(null);
    const [isRollingWhoStarts, setIsRollingWhoStarts] = useState(false);
    const [rollingName, setRollingName] = useState('');

    // Drag and Drop Ref
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('sm_quick_players', JSON.stringify(players));
    }, [players]);

    useEffect(() => {
        localStorage.setItem('sm_quick_history', JSON.stringify(history));
    }, [history]);

    // Timer Persistence
    useEffect(() => {
        localStorage.setItem('sm_quick_timer_start', timerStartValue.toString());
    }, [timerStartValue]);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
        }
        return audioCtxRef.current;
    };

    const playAlarm = () => {
        try {
            const ctx = initAudio();
            if (!ctx) return;

            const now = ctx.currentTime;
            
            // Double beep alarm
            [0, 0.4].forEach(offset => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.setValueAtTime(880, now + offset); // A5
                gain.gain.setValueAtTime(0.5, now + offset);
                gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.3);
                
                osc.start(now + offset);
                osc.stop(now + offset + 0.35);
            });
            
        } catch (e) {
            console.error("Audio playback error", e);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timerLeft > 0) {
            interval = setInterval(() => {
                setTimerLeft(current => {
                    if (current <= 1) {
                        setIsTimerRunning(false);
                        playAlarm();
                        return 0;
                    }
                    return current - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // Reorder players when a winner is picked
    useEffect(() => {
        if (whoStartsResult && !isRollingWhoStarts) {
            setPlayers(currentPlayers => {
                 const winnerIndex = currentPlayers.findIndex(p => p.id === whoStartsResult.id);
                 if (winnerIndex > 0) {
                     return [
                         ...currentPlayers.slice(winnerIndex),
                         ...currentPlayers.slice(0, winnerIndex)
                     ];
                 }
                 return currentPlayers;
            });
        }
    }, [whoStartsResult, isRollingWhoStarts]);

    const handleAddPlayer = () => {
        const newPlayer: Player = {
            id: crypto.randomUUID(),
            name: `${t('player')} ${players.length + 1}`,
            totalScore: 0,
            color: predefinedColors[players.length % predefinedColors.length],
            history: []
        };
        setPlayers([...players, newPlayer]);
        
        // Auto scroll to bottom
        setTimeout(() => {
            const el = document.getElementById('player-list-end');
            el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleModifyScore = (playerId: string, amount: number) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === playerId) {
                return { ...p, totalScore: p.totalScore + amount };
            }
            return p;
        }));

        const player = players.find(p => p.id === playerId);
        if (player) {
            setHistory(prev => {
                // Logic to group consecutive history items for the same player
                if (prev.length > 0) {
                    const latest = prev[0];
                    if (latest.playerId === playerId) {
                        // Same player as last action, sum the amount
                        const updatedItem: GlobalHistoryItem = {
                            ...latest,
                            amount: latest.amount + amount,
                            timestamp: Date.now(),
                            // Update details in case player was edited
                            playerName: player.name, 
                            playerColor: player.color
                        };
                        // Return new array with first item updated
                        return [updatedItem, ...prev.slice(1)];
                    }
                }

                // If not same player or empty history, add new item
                const newItem: GlobalHistoryItem = {
                    id: crypto.randomUUID(),
                    playerId: player.id,
                    playerName: player.name,
                    playerColor: player.color,
                    amount: amount,
                    timestamp: Date.now()
                };
                return [newItem, ...prev];
            });
        }
    };

    const openAdjustModal = (playerId: string, initialSign: 1 | -1) => {
        setAdjustModal({ isOpen: true, playerId, value: 0 });
        setAdjustPolarity(initialSign);
    };

    const openEditModal = (player: Player) => {
        setEditModal({ isOpen: true, player });
        setEditName(player.name);
        setEditColor(player.color);
    };

    const saveEditPlayer = () => {
        if (!editModal.player) return;
        setPlayers(prev => prev.map(p => 
            p.id === editModal.player?.id 
            ? { ...p, name: editName, color: editColor }
            : p
        ));
        setEditModal({ isOpen: false, player: null });
    };

    const handleDeletePlayer = () => {
        if (!editModal.player) return;
        setPlayers(prev => prev.filter(p => p.id !== editModal.player?.id));
        setEditModal({ isOpen: false, player: null });
    };

    const handleQuickPick = () => {
        if (players.length === 0) return;
        setIsOptionsOpen(false);
        setIsRollingWhoStarts(true);
        setWhoStartsResult(null);
        
        // Random pick animation
        let count = 0;
        const maxCount = 20; // How many name flips
        let finalWinner: Player | null = null;

        const interval = setInterval(() => {
            const randomPlayer = players[Math.floor(Math.random() * players.length)];
            setRollingName(randomPlayer.name);
            count++;

            if (count > maxCount) {
                clearInterval(interval);
                finalWinner = players[Math.floor(Math.random() * players.length)];
                setRollingName(finalWinner.name);
                setWhoStartsResult(finalWinner);
                setIsRollingWhoStarts(false);
            }
        }, 100);
    };

    const handleRollDice = () => {
        setIsRollingDice(true);
        // Animation
        const interval = setInterval(() => {
            setDiceResults(Array.from({length: diceCount}, () => Math.floor(Math.random() * diceSides) + 1));
        }, 80);
        setTimeout(() => {
            clearInterval(interval);
            setIsRollingDice(false);
            setDiceResults(Array.from({length: diceCount}, () => Math.floor(Math.random() * diceSides) + 1));
        }, 1000);
    };

    const modifyTimer = (amount: number) => {
        if (!isTimerRunning) {
             const newVal = Math.max(0, timerStartValue + amount);
             setTimerStartValue(newVal);
             setTimerLeft(newVal);
        } else {
             setTimerLeft(prev => Math.max(0, prev + amount));
        }
    };

    const toggleTimer = () => {
        initAudio(); // Activate audio context on user interaction
        if (timerLeft === 0) {
            setTimerLeft(timerStartValue);
            setIsTimerRunning(true);
        } else {
            setIsTimerRunning(!isTimerRunning);
        }
    };

    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimerLeft(timerStartValue);
    };

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleResetRequest = () => {
        setIsOptionsOpen(false);
        setResetConfirmOpen(true);
    };

    const confirmReset = () => {
        setPlayers(prev => prev.map(p => ({ ...p, totalScore: 0 })));
        setHistory([]);
        setResetConfirmOpen(false);
    };

    // Drag and Drop Logic
    const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        // visual effect
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary for Drop to work
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const startIdx = dragItem.current;
        const endIdx = dragOverItem.current;

        if (startIdx === null || endIdx === null || startIdx === endIdx) return;

        setPlayers(prev => {
            const newList = [...prev];
            const [draggedItem] = newList.splice(startIdx, 1);
            newList.splice(endIdx, 0, draggedItem);
            return newList;
        });

        dragItem.current = null;
        dragOverItem.current = null;
    };


    // Styling Helpers
    const getColorStyle = (color: string) => {
        if (color.startsWith('#')) {
            return { backgroundColor: `${color}33`, borderColor: color }; 
        }
        return {};
    };
    
    const getCardClass = (color: string) => {
        if (color.startsWith('#')) return 'border';
        const map: Record<string, string> = {
            'bg-red-500': 'bg-red-500/20 border-red-500',
            'bg-green-500': 'bg-green-500/20 border-green-500',
            'bg-yellow-500': 'bg-yellow-500/20 border-yellow-500',
            'bg-blue-500': 'bg-blue-500/20 border-blue-500',
            'bg-orange-500': 'bg-orange-500/20 border-orange-500',
            'bg-purple-500': 'bg-purple-500/20 border-purple-500',
            'bg-cyan-500': 'bg-cyan-500/20 border-cyan-500',
            'bg-pink-500': 'bg-pink-500/20 border-pink-500',
            'bg-teal-500': 'bg-teal-500/20 border-teal-500',
            'bg-lime-500': 'bg-lime-500/20 border-lime-500',
            'bg-amber-500': 'bg-amber-500/20 border-amber-500',
            'bg-indigo-500': 'bg-indigo-500/20 border-indigo-500'
        };
        return map[color] || 'bg-gray-100 border-gray-200';
    };

    const isCustomColor = editColor.startsWith('#');

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
             {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] z-20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft size={24} className="rtl:rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">{t('quickGame')}</h1>
                        <span className="text-xs text-gray-500 font-bold">{players.length} {t('playersCount')}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsExtrasOpen(true)}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full"
                        title={t('extras')}
                    >
                        <Zap size={24} />
                    </button>
                    
                    <button 
                        onClick={handleAddPlayer}
                        className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                    <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <History size={24} />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setIsOptionsOpen(!isOptionsOpen)} 
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                            <Settings size={24} />
                        </button>
                        
                        {isOptionsOpen && (
                            <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-48 py-2 z-50 animate-in fade-in zoom-in-95">
                                <button onClick={handleQuickPick} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                                    <Users size={16} /> {t('whoStarts')}
                                </button>
                                <button onClick={handleResetRequest} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-bold text-red-500">
                                    <RotateCcw size={16} /> {t('resetScores')}
                                </button>
                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <div className="px-4 py-2">
                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button 
                                            onClick={() => { setViewMode('GRID'); setIsOptionsOpen(false); }}
                                            className={`flex-1 py-1 rounded-md flex justify-center ${viewMode === 'GRID' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                                        >
                                            <LayoutGrid size={16} />
                                        </button>
                                        <button 
                                            onClick={() => { setViewMode('LIST'); setIsOptionsOpen(false); }}
                                            className={`flex-1 py-1 rounded-md flex justify-center ${viewMode === 'LIST' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                                        >
                                            <ListIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-hide">
                 {players.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
                         <LayoutGrid size={48} className="mb-4 opacity-20" />
                         <p>{t('quickGameDesc')}</p>
                         <p className="text-xs mt-2 text-indigo-500 font-bold">{t('addPlayer')}</p>
                     </div>
                 ) : (
                     <div className={`grid gap-3 ${viewMode === 'GRID' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                         {players.map((p, index) => (
                             <div 
                                key={p.id} 
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragEnter={(e) => onDragEnter(e, index)}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                                className={`rounded-2xl p-4 shadow-sm border flex relative overflow-hidden transition-all touch-none ${viewMode === 'LIST' ? 'flex-row items-center justify-between py-2 px-3' : 'flex-col justify-between min-h-[160px]'} ${getCardClass(p.color)}`}
                                style={getColorStyle(p.color)}
                             >
                                  {viewMode === 'GRID' && (
                                    <>
                                        <div className="flex items-start justify-between mb-2">
                                            {/* Grip for Drag */}
                                            <div className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 mr-1 p-1 -ml-2">
                                                <GripVertical size={16} />
                                            </div>

                                            <div 
                                                className={`font-bold truncate text-sm flex-1 text-left px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-gray-900 dark:text-white`}
                                            >
                                                {p.name}
                                            </div>
                                            <button 
                                                onClick={() => openEditModal(p)}
                                                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white opacity-60 hover:opacity-100 p-1"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                        
                                        <div className="text-center mb-4 flex-1 flex items-center justify-center">
                                            <div className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">{p.totalScore}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <LongPressButton 
                                                onClick={() => handleModifyScore(p.id, -1)}
                                                onLongPress={() => openAdjustModal(p.id, -1)}
                                                className="flex-1 bg-white/50 dark:bg-black/20 text-red-600 dark:text-red-400 h-10 rounded-xl font-bold text-xl hover:bg-white/80 dark:hover:bg-black/30 transition-colors active:scale-95 flex justify-center items-center shadow-sm"
                                            >
                                                <Minus size={20} />
                                            </LongPressButton>
                                            
                                            <LongPressButton 
                                                onClick={() => handleModifyScore(p.id, 1)}
                                                onLongPress={() => openAdjustModal(p.id, 1)}
                                                className="flex-1 bg-white/50 dark:bg-black/20 text-green-600 dark:text-green-400 h-10 rounded-xl font-bold text-xl hover:bg-white/80 dark:hover:bg-black/30 transition-colors active:scale-95 flex justify-center items-center shadow-sm"
                                            >
                                                <Plus size={20} />
                                            </LongPressButton>
                                        </div>
                                    </>
                                  )}

                                  {viewMode === 'LIST' && (
                                    <>
                                        {/* Grip */}
                                        <div className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 mr-1 p-1 -ml-1">
                                            <GripVertical size={20} />
                                        </div>

                                        {/* Left: Minus */}
                                        <LongPressButton 
                                            onClick={() => handleModifyScore(p.id, -1)}
                                            onLongPress={() => openAdjustModal(p.id, -1)}
                                            className="w-12 h-12 bg-white/50 dark:bg-black/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-white/80 dark:hover:bg-black/30 transition-colors active:scale-95 flex justify-center items-center shadow-sm shrink-0"
                                        >
                                            <Minus size={24} />
                                        </LongPressButton>

                                        {/* Center: Info */}
                                        <div className="flex-1 text-center flex flex-col items-center justify-center px-2 min-w-0">
                                            <div className="flex items-center gap-2 max-w-full justify-center">
                                                <div 
                                                    className={`font-bold text-xs truncate px-2 py-0.5 rounded transition-colors flex items-center gap-1 text-gray-700 dark:text-gray-300`}
                                                >
                                                    {p.name}
                                                </div>
                                                <button 
                                                    onClick={() => openEditModal(p)}
                                                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            </div>
                                            <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none mt-1">{p.totalScore}</span>
                                        </div>

                                        {/* Right: Plus */}
                                        <LongPressButton 
                                            onClick={() => handleModifyScore(p.id, 1)}
                                            onLongPress={() => openAdjustModal(p.id, 1)}
                                            className="w-12 h-12 bg-white/50 dark:bg-black/20 text-green-600 dark:text-green-400 rounded-xl font-bold hover:bg-white/80 dark:hover:bg-black/30 transition-colors active:scale-95 flex justify-center items-center shadow-sm shrink-0"
                                        >
                                            <Plus size={24} />
                                        </LongPressButton>
                                    </>
                                  )}
                             </div>
                         ))}
                     </div>
                 )}
                 <div id="player-list-end" className="h-4"></div>
            </div>

            {/* History Drawer */}
            {showHistory && (
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-48 shrink-0 flex flex-col pb-safe z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-300">
                     <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('globalHistory')}</span>
                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 space-y-2">
                         {history.length === 0 ? (
                             <div className="text-center text-gray-400 text-xs italic py-4">{t('noMoves')}</div>
                         ) : (
                             history.map(item => (
                                 <div key={item.id} className="flex items-center justify-between text-sm px-2 py-1 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                     <div className="flex items-center gap-2">
                                         <div 
                                            className={`w-2 h-2 rounded-full`}
                                            style={item.playerColor.startsWith('#') ? { backgroundColor: item.playerColor } : {}}
                                         >
                                            {!item.playerColor.startsWith('#') && <div className={`w-full h-full rounded-full ${item.playerColor}`}></div>}
                                         </div>
                                         <span className="font-medium text-gray-700 dark:text-gray-300">{item.playerName}</span>
                                     </div>
                                     <span className={`font-bold ${item.amount > 0 ? 'text-green-500' : (item.amount < 0 ? 'text-red-500' : 'text-gray-400')}`}>
                                         {item.amount > 0 ? '+' : ''}{item.amount}
                                     </span>
                                 </div>
                             ))
                         )}
                     </div>
                </div>
            )}

            {/* Extras Modal (Local for Quick Game) */}
            {isExtrasOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsExtrasOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Zap size={20} className="text-indigo-500" /> {t('extras')}
                            </h3>
                            <button onClick={() => setIsExtrasOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Dice Section */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-500 uppercase">
                                    <Dices size={16} /> {t('rollDice')}
                                </div>
                                
                                {/* Dice Count Selector */}
                                <div className="flex gap-2 mb-3 bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm">
                                    {[1, 2, 3, 4, 5].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setDiceCount(count)}
                                            className={`w-8 h-8 rounded-md font-bold text-sm transition-colors ${diceCount === count ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-4 gap-2 w-full mb-4">
                                    {[2, 4, 6, 8, 10, 12, 20, 100].map(sides => (
                                        <button
                                            key={sides}
                                            onClick={() => setDiceSides(sides)}
                                            className={`py-2 px-1 rounded-lg font-bold text-sm transition-colors border flex items-center justify-center ${diceSides === sides ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'}`}
                                            title={sides === 2 ? t('coinFlip') : `d${sides}`}
                                        >
                                            {sides === 2 ? <Coins size={18} /> : (sides === 100 ? 'd100' : `d${sides}`)}
                                        </button>
                                    ))}
                                </div>

                                <div className={`w-full bg-indigo-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg mb-3 py-4 ${isRollingDice ? 'animate-pulse' : ''}`}>
                                    <div className="text-5xl font-black mb-1 text-center px-2">
                                        {diceSides === 2 ? (
                                            diceCount === 1 ? (
                                                diceResults[0] === 1 ? t('heads') : t('tails')
                                            ) : (
                                                `${diceResults.filter(r => r === 1).length} ${t('heads')}`
                                            )
                                        ) : (
                                            diceResults.reduce((a,b) => a+b, 0)
                                        )}
                                    </div>
                                    {diceCount > 1 && (
                                        <div className="flex gap-2 text-indigo-200 font-bold text-sm flex-wrap justify-center px-4">
                                            {diceResults.map((r, i) => (
                                                <span key={i}>
                                                    {diceSides === 2 
                                                        ? (r === 1 ? t('heads') : t('tails')) 
                                                        : r
                                                    }
                                                    {i < diceResults.length - 1 ? (diceSides === 2 ? ', ' : '+') : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button fullWidth onClick={handleRollDice} disabled={isRollingDice} className="h-10 text-sm">
                                    {isRollingDice ? t('rolling') : `${t('rollDice')} (${diceCount}${diceSides === 2 ? ' Coins' : `d${diceSides}`})`}
                                </Button>
                            </div>

                            {/* Timer Section */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-500 uppercase">
                                    <Timer size={16} /> {t('timer')}
                                </div>
                                <div className={`text-4xl font-black font-mono mb-4 ${timerLeft === 0 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                                    {formatTimer(timerLeft)}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4 justify-center w-full">
                                    <button onClick={() => modifyTimer(-60)} className="flex-1 min-w-[60px] py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">-1m</button>
                                    <button onClick={() => modifyTimer(-10)} className="flex-1 min-w-[50px] py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">-10s</button>
                                    <button onClick={() => modifyTimer(10)} className="flex-1 min-w-[50px] py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">+10s</button>
                                    <button onClick={() => modifyTimer(60)} className="flex-1 min-w-[60px] py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">+1m</button>
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={toggleTimer} 
                                        className={`flex-1 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-colors ${isTimerRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                                    </button>
                                    <button 
                                        onClick={resetTimer}
                                        className="h-10 w-14 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <RotateCcw size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Modal */}
            {adjustModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAdjustModal({ ...adjustModal, isOpen: false })} />
                    <div className="relative bg-white dark:bg-gray-900 p-5 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-center font-bold mb-4 text-lg">{t('quickAdjust')}</h3>
                        
                        <div className="flex justify-center mb-6">
                            <div className={`text-6xl font-black tabular-nums transition-colors ${adjustPolarity * adjustModal.value === 0 ? 'text-gray-400' : (adjustPolarity * adjustModal.value > 0 ? 'text-green-500' : 'text-red-500')}`}>
                                {adjustPolarity * adjustModal.value > 0 ? '+' : ''}{adjustPolarity * adjustModal.value}
                            </div>
                        </div>

                        {/* Polarity Toggle Split */}
                        <div className="flex gap-4 mb-4">
                             <button 
                                onClick={() => setAdjustPolarity(-1)}
                                className={`flex-1 py-3 rounded-2xl font-black text-2xl shadow-sm transition-all border-2 ${adjustPolarity === -1 ? 'bg-red-500 text-white border-red-500 scale-105' : 'bg-white dark:bg-gray-800 text-red-500 border-red-200 dark:border-red-900'}`}
                             >
                                 -
                             </button>

                             {/* Clear Button */}
                             <button 
                                onClick={() => setAdjustModal(prev => ({ ...prev, value: 0 }))}
                                className="w-20 rounded-2xl font-black text-xl shadow-sm transition-all border-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
                                title={t('reset')}
                             >
                                 <Eraser size={24} />
                             </button>

                             <button 
                                onClick={() => setAdjustPolarity(1)}
                                className={`flex-1 py-3 rounded-2xl font-black text-2xl shadow-sm transition-all border-2 ${adjustPolarity === 1 ? 'bg-green-500 text-white border-green-500 scale-105' : 'bg-white dark:bg-gray-800 text-green-500 border-green-200 dark:border-green-900'}`}
                             >
                                 +
                             </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-6">
                             {[1, 5, 10, 20, 50, 100, 200, 500].map(val => (
                                 <button
                                     key={val}
                                     onClick={() => setAdjustModal(prev => ({ ...prev, value: prev.value + val }))}
                                     className="py-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
                                 >
                                     {val}
                                 </button>
                             ))}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" fullWidth onClick={() => setAdjustModal({ ...adjustModal, isOpen: false })}>
                                {t('cancel')}
                            </Button>
                            <Button fullWidth onClick={() => {
                                if (adjustModal.playerId) {
                                    handleModifyScore(adjustModal.playerId, adjustModal.value * adjustPolarity);
                                }
                                setAdjustModal({ ...adjustModal, isOpen: false });
                            }}>
                                {t('accept')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Player Modal */}
            {editModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditModal({ isOpen: false, player: null })} />
                    <div className="relative bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4">{t('editPlayer')}</h3>
                        
                        <input 
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 mb-4 focus:outline-none focus:border-indigo-500 dark:text-white"
                        />

                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {predefinedColors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setEditColor(c)}
                                    className={`h-10 rounded-lg ${c} ${editColor === c ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-60'} transition-all`}
                                />
                            ))}
                             {/* Custom Color */}
                             <div className={`h-10 rounded-lg relative overflow-hidden transition-all ${isCustomColor ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-60 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <input 
                                    type="color" 
                                    value={isCustomColor ? editColor : '#333333'}
                                    onChange={(e) => setEditColor(e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ backgroundColor: isCustomColor ? editColor : undefined }}>
                                    {isCustomColor ? <Check size={16} className="text-white drop-shadow-md" /> : <Pipette size={16} className="text-gray-500 dark:text-gray-300" />}
                                </div>
                             </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={handleDeletePlayer}
                                className="bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 px-4 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                             <Button variant="ghost" fullWidth onClick={() => setEditModal({ isOpen: false, player: null })}>
                                {t('cancel')}
                            </Button>
                            <Button fullWidth onClick={saveEditPlayer}>
                                {t('save')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Reset Confirmation Modal */}
            {resetConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setResetConfirmOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-900 border border-red-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                            {t('confirmTitle')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">
                            {t('confirmResetScores')}
                        </p>
                        <div className="flex gap-3">
                            <Button variant="ghost" fullWidth onClick={() => setResetConfirmOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button variant="danger" fullWidth onClick={confirmReset}>
                                {t('accept')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Who Starts Result Overlay */}
            {(isRollingWhoStarts || whoStartsResult) && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isRollingWhoStarts && setWhoStartsResult(null)}>
                     <div className="text-center animate-in zoom-in duration-500">
                         {whoStartsResult ? (
                            <>
                                <div className="mb-6 relative inline-block">
                                    <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-50 animate-pulse rounded-full"></div>
                                    <Crown size={80} className="text-yellow-400 relative z-10 drop-shadow-lg" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{t('whoStarts')}</h2>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-8 p-2">
                                    {rollingName}
                                </div>
                                <p className="text-gray-400 text-sm animate-pulse">{t('tapToStart')}</p>
                            </>
                         ) : (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-6">{t('rolling')}</h2>
                                <div className="text-5xl font-black text-white/50 animate-pulse p-2">
                                    {rollingName}
                                </div>
                            </>
                         )}
                     </div>
                </div>
            )}
        </div>
    );
};
