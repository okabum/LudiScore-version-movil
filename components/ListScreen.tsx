import React, { useState, useRef } from 'react';
import { ArrowLeft, Zap, ArrowUpDown, Share2, UserPlus, Crown, Play, Pencil, Lock, ArrowUp, ArrowDown, ChevronRight, RotateCcw, Users, Save, Flag, GripVertical, Trophy, Hourglass } from 'lucide-react';
import { Player, GameSettings } from '../types';

interface ListScreenProps {
  gameName: string;
  players: Player[];
  settings: GameSettings;
  isReordering: boolean;
  setIsReordering: (val: boolean) => void;
  hasUsedWhoStarts: boolean;
  
  onBackToStart: () => void;
  onOpenExtras: () => void;
  onShare: () => void;
  onAddPlayer: () => void;
  onSelectPlayer: (id: string) => void;
  onEditPlayer: (player: Player, e: React.MouseEvent) => void;
  onMovePlayer: (index: number, dir: 'up' | 'down') => void;
  onReorderPlayers: (players: Player[]) => void;
  onRequestResetGame: () => void;
  onOpenPicker: () => void;
  onSaveGame: () => void;
  onEndGame: () => void;
  
  t: (key: any) => string;
  getPlayerInitials: (name: string) => string;
  getActivePlayerId: () => string | null;
}

export const ListScreen: React.FC<ListScreenProps> = ({
  gameName,
  players,
  settings,
  isReordering,
  setIsReordering,
  hasUsedWhoStarts,
  onBackToStart,
  onOpenExtras,
  onShare,
  onAddPlayer,
  onSelectPlayer,
  onEditPlayer,
  onMovePlayer,
  onReorderPlayers,
  onRequestResetGame,
  onOpenPicker,
  onSaveGame,
  onEndGame,
  t,
  getPlayerInitials,
  getActivePlayerId
}) => {
    // Helper to handle Tailwind classes vs Hex colors
    const getColorStyle = (color: string) => color.startsWith('#') ? { backgroundColor: color } : {};
    const getColorClass = (color: string) => color.startsWith('#') ? '' : color;

    // Drag and Drop State & Refs
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number, id: string) => {
        dragItem.current = position;
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
        // Required for Firefox to allow dragging
        e.dataTransfer.setData("text/html", "");

        // Set drag image to the whole row
        const row = e.currentTarget.closest('[data-player-row]');
        if (row) {
             e.dataTransfer.setDragImage(row, 0, 0);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        e.preventDefault(); 
        
        const startIdx = dragItem.current;
        const endIdx = position;

        // If we lost track or are over the same item, do nothing
        if (startIdx === null || startIdx === endIdx) return;

        // Security check for WhoStarts locking
        if (hasUsedWhoStarts) {
            if (startIdx === 0) return; // Cannot move locked P1
            if (endIdx === 0) return; // Cannot drop onto locked P1
        }

        // Perform the reorder immediately (Live Sorting)
        const newPlayers = [...players];
        const [draggedItem] = newPlayers.splice(startIdx, 1);
        newPlayers.splice(endIdx, 0, draggedItem);
        
        onReorderPlayers(newPlayers);
        
        // Update the dragItem ref because the dragged item has moved to index 'endIdx'
        dragItem.current = endIdx;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] z-10">
                <div className="flex justify-between items-center mb-4 gap-2">
                    <button onClick={onBackToStart} className="text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center min-w-0 flex-1">
                        <h1 className="text-xl font-black text-gray-900 dark:text-white truncate">{gameName}</h1>
                        <div className="flex gap-3 justify-center">
                            {settings.targetScore && (
                                <div className="text-xs font-medium text-indigo-500 flex items-center justify-center gap-1">
                                    <Trophy size={12} /> {settings.targetScore}
                                </div>
                            )}
                            {settings.maxTurns && (
                                <div className="text-xs font-medium text-orange-500 flex items-center justify-center gap-1">
                                    <Hourglass size={12} /> {t('rounds')} {Math.floor(players.length > 0 ? (players[0].history.length) : 0)}/{settings.maxTurns}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={onOpenExtras}
                            className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full"
                            title={t('extras')}
                        >
                            <Zap size={24} />
                        </button>
                        <button onClick={onShare} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full">
                            <Share2 size={24} />
                        </button>
                        <button onClick={onAddPlayer} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full">
                            <UserPlus size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Top Leaderboard Summary */}
                <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x">
                    {[...players].sort((a,b) => b.totalScore - a.totalScore).map((p, i) => (
                        <div key={p.id} className="flex flex-col items-center min-w-[60px] snap-start">
                            <div 
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md mb-1 ${getColorClass(p.color)}`}
                                style={getColorStyle(p.color)}
                            >
                                {i === 0 && <Crown size={14} className="absolute -top-1 -right-1 text-yellow-300 fill-yellow-300" />}
                                {getPlayerInitials(p.name)}
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{p.totalScore}</span>
                        </div>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-3 space-y-1 pb-24">
                {players.map((player, index) => (
                    <div 
                        key={player.id}
                        data-player-row
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragOver={handleDragOver}
                        onClick={() => onSelectPlayer(player.id)}
                        className={`bg-white dark:bg-gray-800 rounded-xl py-1 pl-0 pr-2 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-[0.98] transition-all relative overflow-hidden group touch-none cursor-pointer
                            ${getActivePlayerId() === player.id ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                            ${player.id === draggingId ? 'opacity-40 bg-indigo-50 dark:bg-indigo-900/20 border-dashed border-indigo-300 dark:border-indigo-600 scale-[1.02] shadow-none' : ''}
                        `}
                    >
                         {/* Color indicator bar */}
                        <div 
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${getColorClass(player.color)}`}
                            style={getColorStyle(player.color)}
                        ></div>

                        {/* Large Drag Handle - Left */}
                        {(!hasUsedWhoStarts || index !== 0) ? (
                            <div 
                                draggable
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleDragStart(e, index, player.id);
                                }}
                                onDragEnd={(e) => {
                                    e.stopPropagation();
                                    handleDragEnd();
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="pl-2 pr-1 py-2 text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center shrink-0"
                            >
                                <GripVertical size={36} />
                            </div>
                        ) : (
                             <div className="pl-2 pr-1 py-2 text-gray-200 dark:text-gray-700 flex items-center justify-center shrink-0">
                                <Lock size={24} />
                             </div>
                        )}

                        <div className="flex items-center gap-3 pl-1 overflow-hidden flex-1">
                            <div 
                                className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ${getColorClass(player.color)}`}
                                style={getColorStyle(player.color)}
                            >
                                {getPlayerInitials(player.name)}
                                {getActivePlayerId() === player.id && (
                                    <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                                        <Play size={10} className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white truncate leading-tight">{player.name}</h3>
                                    <button 
                                        onClick={(e) => onEditPlayer(player, e)}
                                        className="p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                                    >
                                        <Pencil size={32} />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mt-0.5">
                                    <span>{t('turns')}: {player.history.length}</span>
                                    {player.history.length > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${player.history[0].amount > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {player.history[0].amount > 0 ? '+' : ''}{player.history[0].amount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 pl-2">
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
                                {player.totalScore}
                            </div>
                            <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 rtl:rotate-180" />
                        </div>
                    </div>
                ))}
                
                {players.length === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-600 mt-10">
                        <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
                        <p>{t('addPlayer')}</p>
                    </div>
                )}
            </main>

            {/* Bottom Actions */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] shadow-lg z-20 space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                     {players.some(p => p.history.length > 0) ? (
                         <button 
                            onClick={onRequestResetGame}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                         >
                             <RotateCcw size={18} /> {t('resetScores')}
                         </button>
                     ) : (
                         <button 
                            onClick={onOpenPicker}
                            disabled={hasUsedWhoStarts}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${hasUsedWhoStarts ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-60' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                         >
                             <Users size={18} /> {t('whoStarts')}
                         </button>
                     )}
                     <button 
                        onClick={onSaveGame}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-colors"
                     >
                         <Save size={18} /> {t('game')}
                     </button>
                 </div>
                 {/* Start / End Game Button Logic */}
                 <button 
                    onClick={() => {
                        if (players.some(p => p.history.length > 0)) {
                            onEndGame();
                        } else {
                            // Logic for "Start Game" button behavior inside List Screen
                            // Select the active player or first player to start scoring
                            const firstPlayerId = getActivePlayerId() || (players.length > 0 ? players[0].id : null);
                            if (firstPlayerId) {
                                onSelectPlayer(firstPlayerId);
                            }
                        }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition-colors ${players.some(p => p.history.length > 0) ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100' : 'bg-green-600 text-white hover:bg-green-500 shadow-green-500/30'}`}
                 >
                     {players.some(p => p.history.length > 0) ? <Flag size={18} /> : <Play size={18} />} 
                     {players.some(p => p.history.length > 0) ? t('endGame') : t('startGame')}
                 </button>
            </div>
        </div>
    );
};