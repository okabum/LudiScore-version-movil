

import React from 'react';
import { Trophy, Crown, Share2 } from 'lucide-react';
import { Player } from '../types';

interface VictoryScreenProps {
  winnerId: string | null;
  players: Player[];
  onShare: () => void;
  onResetGame: () => void; // Continue / Reset state but keep players
  onRequestResetGame: () => void; // New Game same players
  onRequestFullReset: () => void; // Back to Start
  t: (key: any) => string;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winnerId,
  players,
  onShare,
  onResetGame,
  onRequestResetGame,
  onRequestFullReset,
  t
}) => {
    const winner = players.find(p => p.id === winnerId);
    const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

    const getColorStyle = (color: string) => color.startsWith('#') ? { backgroundColor: color } : {};
    const getColorClass = (color: string) => color.startsWith('#') ? '' : color;

    return (
        <div className="h-full w-full flex flex-col bg-[#0F1116] text-white overflow-hidden relative">
             {/* Background Glow */}
             <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[60%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

             <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-6 z-10 overflow-y-auto scrollbar-hide">
                 
                 {/* Trophy Icon */}
                 <div className="mb-6 relative">
                     <Trophy size={80} className="text-yellow-400 fill-yellow-400/20 stroke-[1.5]" />
                     {/* Crown overlay */}
                     <Crown size={32} className="absolute -top-4 -right-4 text-yellow-300 fill-yellow-300 animate-bounce" />
                 </div>
                 
                 <div className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-2">
                     {t('winner')}
                 </div>
                 
                 {/* Gold Gradient Name - Fixed wrapping */}
                 <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 text-center mb-4 max-w-full drop-shadow-sm filter break-words leading-tight px-2">
                     {winner?.name}
                 </h1>

                 {/* Score Badge */}
                 <div className="bg-white/10 px-6 py-2 rounded-full mb-8 backdrop-blur-sm border border-white/5">
                     <span className="text-2xl font-bold text-white mr-1">{winner?.totalScore}</span>
                     <span className="text-xs font-bold text-gray-400">PTS</span>
                 </div>

                 {/* Leaderboard - Scrollbar hidden */}
                 <div className="w-full bg-[#1A1D26] rounded-2xl border border-white/5 overflow-hidden mb-6 flex-1 min-h-[200px]">
                    <div className="max-h-full overflow-y-auto scrollbar-hide">
                        {sortedPlayers.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500 font-mono font-medium w-4 text-right">{i + 1}.</span>
                                    <div 
                                        className={`w-6 h-6 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ring-2 ring-white/10 ${getColorClass(p.color)}`}
                                        style={getColorStyle(p.color)}
                                    ></div>
                                    <span className="font-medium text-gray-200 truncate max-w-[140px]">{p.name}</span>
                                </div>
                                <span className="font-bold text-white text-sm">{p.totalScore}</span>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Actions - Shorter buttons */}
                 <div className="w-full space-y-2 shrink-0 pb-safe">
                      {/* Share Button (Green) */}
                      <button 
                        onClick={onShare}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-sm py-2.5 rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                      >
                          <Share2 size={18} />
                          {t('share')}
                      </button>

                      {/* Continue Playing (Blue/Purple) */}
                      <button 
                        onClick={onResetGame}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-transform active:scale-[0.98]"
                      >
                          {t('continuePlaying')}
                      </button>

                      {/* New Game Same Players (Dark) */}
                      <button 
                        onClick={onRequestResetGame}
                        className="w-full bg-[#1F2937] hover:bg-[#374151] text-gray-200 font-medium text-sm py-2.5 rounded-xl border border-white/5 transition-transform active:scale-[0.98]"
                      >
                          {t('newGameSame')}
                      </button>
                      
                      {/* Back to Start (Link) */}
                      <button 
                        onClick={onRequestFullReset}
                        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 font-medium transition-colors"
                      >
                          {t('backToStart')}
                      </button>
                 </div>
             </div>
        </div>
    );
};
