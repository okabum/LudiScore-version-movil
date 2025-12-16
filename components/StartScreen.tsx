
import React, { useRef, useState, useEffect } from 'react';
import { Info, Zap, Trophy, Save, Library, Archive, Users, Hourglass, Trash2, ChevronRight, Zap as ZapIcon, Maximize, Minimize } from 'lucide-react';
import { Button } from './Button';
import { Player, SavedGame } from '../types';
import { LANGUAGES } from '../translations';
import { PresetModal } from './PresetModal';

interface StartScreenProps {
  onOpenAbout: () => void;
  onOpenExtras: () => void;
  language: string;
  setLanguage: (lang: any) => void;
  isLangMenuOpen: boolean;
  setIsLangMenuOpen: (val: boolean) => void;
  
  tempGameName: string;
  setTempGameName: (val: string) => void;
  gameNameError: boolean;
  setGameNameError: (val: boolean) => void;
  
  tempTargetScore: string;
  setTempTargetScore: (val: string) => void;
  tempMaxTurns: string;
  setTempMaxTurns: (val: string) => void;
  
  players: Player[];
  onStartGame: () => void;
  onSavePreset: () => void;
  
  savedGames: SavedGame[];
  onLoadGame: (game: SavedGame) => void;
  onDeleteSave: (id: string) => void;
  
  // Presets props passed down
  isPresetsOpen: boolean;
  setIsPresetsOpen: (val: boolean) => void;
  isCreatingPreset: boolean;
  setIsCreatingPreset: (val: boolean) => void;
  libraryFilter: any;
  setLibraryFilter: (val: any) => void;
  presetModalProps: any; // Simplified to pass rest of props to PresetModal

  t: (key: any) => string;
  onQuickGame?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onOpenAbout, onOpenExtras, language, setLanguage, isLangMenuOpen, setIsLangMenuOpen,
  tempGameName, setTempGameName, gameNameError, setGameNameError,
  tempTargetScore, setTempTargetScore, tempMaxTurns, setTempMaxTurns,
  players, onStartGame, onSavePreset, savedGames, onLoadGame, onDeleteSave,
  isPresetsOpen, setIsPresetsOpen, isCreatingPreset, setIsCreatingPreset, libraryFilter, setLibraryFilter, presetModalProps,
  t, onQuickGame
}) => {
    const startTargetRef = useRef<HTMLInputElement>(null);
    const startMaxTurnsRef = useRef<HTMLInputElement>(null);
    
    // Fullscreen logic
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Check if running in Capacitor Native context
    const isNative = (window as any).Capacitor?.isNative;

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] bg-gray-50 dark:bg-gray-900 overflow-y-auto relative scrollbar-hide">
            <div className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] left-6 z-30 rtl:left-auto rtl:right-6">
                <button 
                    onClick={onOpenAbout}
                    className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 transition-transform active:scale-95 hover:scale-105"
                >
                    <Info size={20} />
                </button>
            </div>

            <div className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] right-6 z-30 rtl:right-auto rtl:left-6 flex gap-2">
                
                {/* Fullscreen Button - Only show on Web (Not Native) */}
                {!isNative && (
                    <button 
                        onClick={toggleFullscreen}
                        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 transition-transform active:scale-95 hover:scale-105"
                        title="Fullscreen"
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                )}

                <button 
                    onClick={onOpenExtras}
                    className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-lg border border-gray-200 dark:border-gray-700 transition-transform active:scale-95 hover:scale-105"
                >
                    <Zap size={20} />
                </button>
                
                {/* Language Selector */}
                <div className="relative">
                    <button 
                        onClick={() => {
                            setIsLangMenuOpen(!isLangMenuOpen);
                        }}
                        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 transition-transform active:scale-95 hover:scale-105 overflow-hidden"
                    >
                        <span role="img" aria-label="language" className="text-2xl flex items-center justify-center w-full h-full">
                            {LANGUAGES.find(l => l.code === language)?.flag || '🌐'}
                        </span>
                    </button>
                    {isLangMenuOpen && (
                        <div className="absolute top-14 right-0 rtl:right-auto rtl:left-0 bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 shadow-xl w-64 max-h-80 overflow-y-auto z-40 grid grid-cols-2 gap-1 animate-in slide-in-from-top-2 fade-in duration-200">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsLangMenuOpen(false);
                                    }}
                                    className={`p-2 rounded-lg text-sm font-medium flex items-center gap-2 ${language === lang.code ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <span className="text-xl mr-1 inline-block" role="img">{lang.flag}</span> {lang.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20 rotate-12 flex-shrink-0">
                <Trophy size={48} className="text-white -rotate-12" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t('startTitle')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-xs">{t('startSubtitle')}</p>

            <div className="w-full max-w-sm space-y-4 mb-4">
                <div>
                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{t('gameNameLabel')}</label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={tempGameName}
                            onChange={(e) => {
                                setTempGameName(e.target.value);
                                if (gameNameError) setGameNameError(false);
                            }}
                            placeholder={t('gameNamePlaceholder')}
                            className={`w-full bg-white dark:bg-gray-800 border rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium shadow-sm transition-all duration-200 ${
                                gameNameError 
                                ? 'border-red-500 ring-2 ring-red-500 animate-shake bg-red-50 dark:bg-red-900/10' 
                                : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500'
                            }`}
                            enterKeyHint="next"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    startTargetRef.current?.focus();
                                }
                            }}
                        />
                        <button 
                            onClick={onSavePreset}
                            disabled={!tempGameName.trim()}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-500 disabled:opacity-50 shadow-sm"
                            title={t('saveAsPreset')}
                        >
                            <Save size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{t('targetScoreLabel')}</label>
                        <input 
                            ref={startTargetRef}
                            type="number"
                            value={tempTargetScore}
                            onChange={(e) => setTempTargetScore(e.target.value)}
                            placeholder={t('targetScorePlaceholder')}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium shadow-sm"
                            enterKeyHint="next"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    startMaxTurnsRef.current?.focus();
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{t('maxTurnsLabel')}</label>
                        <input 
                            ref={startMaxTurnsRef}
                            type="number"
                            value={tempMaxTurns}
                            min="0"
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val < 0) return;
                                setTempMaxTurns(e.target.value);
                            }}
                            placeholder="∞"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium shadow-sm"
                            enterKeyHint="go"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    (e.target as HTMLInputElement).blur();
                                    onStartGame();
                                }
                            }}
                        />
                    </div>
                </div>

                {players.length > 0 && (
                <div className="bg-indigo-50 dark:bg-gray-800/50 p-3 rounded-xl border border-indigo-100 dark:border-gray-700 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                    <Users size={16} />
                    <span>{t('loadedConfig')} <b>{players.length}</b> {t('playersCount')}</span>
                </div>
                )}

                <div className="w-full space-y-3 mt-4">
                    <Button fullWidth onClick={onStartGame}>
                        {t('startGame')}
                    </Button>

                    {/* Quick Game Button */}
                    {onQuickGame && (
                         <Button 
                            variant="ghost" 
                            fullWidth 
                            onClick={onQuickGame}
                            className="flex items-center justify-center gap-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-400/30"
                        >
                            <ZapIcon size={20} /> {t('quickGame')}
                        </Button>
                    )}

                    <Button 
                        variant="secondary" 
                        fullWidth 
                        onClick={() => {
                            setIsCreatingPreset(false);
                            setLibraryFilter('ALL');
                            setIsPresetsOpen(true);
                        }}
                        className="flex items-center justify-center gap-2"
                    >
                        <Library size={20} /> {t('myGames')}
                    </Button>
                </div>
                
                {savedGames.length > 0 && (
                    <div className="mt-8 w-full">
                        <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-500 text-sm font-bold uppercase tracking-wider">
                            <Archive size={14} /> {t('recentGames')}
                        </div>
                        <div className="space-y-2">
                            {savedGames.slice(0, 5).map(game => (
                                <div 
                                    key={game.id}
                                    onClick={() => onLoadGame(game)}
                                    className="w-full bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left shadow-sm cursor-pointer group"
                                >
                                    <div className="min-w-0 flex-1 mr-2">
                                        <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{game.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="whitespace-nowrap">{new Date(game.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500"><Users size={12} /> {game.players.length}</span>
                                            {game.settings.targetScore && (
                                                <span className="flex items-center gap-1 text-indigo-500/80"><Trophy size={12} /> {game.settings.targetScore}</span>
                                            )}
                                            {game.settings.maxTurns && (
                                                <span className="flex items-center gap-1 text-orange-500/80"><Hourglass size={12} /> {game.settings.maxTurns}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteSave(game.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            title={t('delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="text-indigo-500 dark:text-indigo-400 rtl:rotate-180">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <PresetModal 
                isOpen={isPresetsOpen}
                onClose={() => setIsPresetsOpen(false)}
                isCreating={isCreatingPreset}
                setIsCreating={setIsCreatingPreset}
                libraryFilter={libraryFilter}
                setLibraryFilter={setLibraryFilter}
                t={t}
                {...presetModalProps}
            />
        </div>
    );
};
