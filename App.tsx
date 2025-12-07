
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, Trophy, UserPlus, ArrowLeft, History, RotateCcw, User, Crown, X, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Check, Save, Download, Archive, Clock, Library, LayoutTemplate, Pencil, Folder, Dices, CreditCard, Box, Users, Sun, Moon, Monitor, Zap, Keyboard, Info, Play, Edit, Languages, Globe, CheckCircle2, FileSearch, Hourglass, Share2, Flag, ArrowUp, ArrowDown, ArrowUpDown, Castle, Pause, Disc, Coins, Lock, LogOut, Timer, ShoppingBag, Coffee } from 'lucide-react';
import { Player, ViewState, Turn, GameSettings, SavedGame, GamePreset, PresetCategory } from './types';
import { Button } from './components/Button';
import { Keypad } from './components/Keypad';
import { AboutModal } from './components/AboutModal';
import { Language, LANGUAGES, TRANSLATIONS } from './translations';

// --- CONSTANTS & CONFIG ---

const PREDEFINED_COLORS = [
  'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-blue-500',
  'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-pink-500',
  'bg-teal-500', 'bg-lime-500', 'bg-amber-500', 'bg-indigo-500'
];

const TEXT_COLORS: Record<string, string> = {
  'bg-red-500': 'text-red-500',
  'bg-green-500': 'text-green-500',
  'bg-yellow-500': 'text-yellow-500',
  'bg-blue-500': 'text-blue-500',
  'bg-orange-500': 'text-orange-500',
  'bg-purple-500': 'text-purple-500',
  'bg-cyan-500': 'text-cyan-500',
  'bg-pink-500': 'text-pink-500',
  'bg-teal-500': 'text-teal-500',
  'bg-lime-500': 'text-lime-500',
  'bg-amber-500': 'text-amber-500',
  'bg-indigo-500': 'text-indigo-500'
};

const DEFAULT_PRESETS: GamePreset[] = [
  { id: 'p_catan', name: 'Catan', defaultTargetScore: 10, defaultMaxTurns: null, category: 'BOARD' },
  { id: 'p_carcassonne', name: 'Carcassonne', defaultTargetScore: null, defaultMaxTurns: null, category: 'BOARD' },
  { id: 'p_uno', name: 'Uno', defaultTargetScore: 500, defaultMaxTurns: null, category: 'CARD' },
  { id: 'p_dixit', name: 'Dixit', defaultTargetScore: 30, defaultMaxTurns: null, category: 'BOARD' },
  { id: 'p_7wonders', name: '7 Wonders', defaultTargetScore: null, defaultMaxTurns: 6, category: 'CARD' },
  { id: 'p_poker', name: 'Poker', defaultTargetScore: null, defaultMaxTurns: null, category: 'CARD' },
];

type Theme = 'light' | 'dark' | 'system';
type ChessMode = 'STANDARD' | 'GONG' | 'FISCHER' | 'BRONSTEIN';

export default function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(() => {
     // Check if user has requested to skip splash
     return !localStorage.getItem('sm_skip_splash');
  });
  const [splashFading, setSplashFading] = useState(false);
  const [dontShowSplashAgain, setDontShowSplashAgain] = useState(false);
  const dontShowSplashRef = useRef(false); // Ref to track the checkbox value inside timeouts

  // State
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
        const saved = localStorage.getItem('sm_players');
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
  });
  
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
        const saved = localStorage.getItem('sm_settings');
        return saved ? JSON.parse(saved) : { targetScore: null, maxTurns: null };
    } catch (e) {
        return { targetScore: null, maxTurns: null };
    }
  });

  const [savedGames, setSavedGames] = useState<SavedGame[]>(() => {
    try {
        const saved = localStorage.getItem('sm_saved_games');
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
  });

  const [gamePresets, setGamePresets] = useState<GamePreset[]>(() => {
    try {
        const saved = localStorage.getItem('sm_game_presets');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed.map((p: any) => ({...p, category: p.category || 'OTHER'}));
            }
        }
    } catch (e) {
        // Fallback
    }
    return DEFAULT_PRESETS;
  });

  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('sm_theme') as Theme || 'system');
  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('sm_lang') as Language;
      return LANGUAGES.some(l => l.code === saved) ? saved : 'es';
  });

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [view, setView] = useState<ViewState>('START');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  
  // Scoring State
  const [currentTurnScore, setCurrentTurnScore] = useState<number>(0);
  const [currentTurnSource, setCurrentTurnSource] = useState<'QUICK' | 'KEYPAD' | 'MANUAL'>('MANUAL');
  
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState(PREDEFINED_COLORS[0]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [gameName, setGameName] = useState(() => localStorage.getItem('sm_gamename') || '');

  // Start Screen State
  const [tempGameName, setTempGameName] = useState('');
  const [tempTargetScore, setTempTargetScore] = useState<string>('');
  const [tempMaxTurns, setTempMaxTurns] = useState<string>('');
  const [gameNameError, setGameNameError] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  // Setup Wizard State
  const [setupWizard, setSetupWizard] = useState<{
    step: 'COUNT' | 'DETAILS';
    total: number;
    current: number;
    tempPlayers: Player[];
  } | null>(null);
  const [customPlayerCount, setCustomPlayerCount] = useState('');
  const [showCustomCountInput, setShowCustomCountInput] = useState(false);
  const [wizardPlayerName, setWizardPlayerName] = useState('');
  const [wizardPlayerColor, setWizardPlayerColor] = useState(PREDEFINED_COLORS[0]);

  // Player History Modal State
  const [isPlayerHistoryOpen, setIsPlayerHistoryOpen] = useState(false);

  // Extras State
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<'MENU' | 'DICE' | 'TIMER' | 'PICKER' | 'CHESS' | 'COIN'>('MENU');
  
  // Tool States
  const [diceSides, setDiceSides] = useState(6);
  const [diceValue, setDiceValue] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [pickerDone, setPickerDone] = useState(false);
  const [hasUsedWhoStarts, setHasUsedWhoStarts] = useState(() => {
      return localStorage.getItem('sm_who_starts_used') === 'true';
  });
  
  const [timerLeft, setTimerLeft] = useState(60);
  const [timerStartValue, setTimerStartValue] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Chess Clock State
  const [chessModeType, setChessModeType] = useState<ChessMode>('STANDARD');
  const [chessConfig, setChessConfig] = useState({
      time: 600, // Total time in seconds (Standard/Fischer/Bronstein)
      inc: 3, // Increment in seconds
      incStart: 1, // Turn number to start increment (Fischer)
      gong: 30 // Time per turn (Gong)
  });
  const [chessGameState, setChessGameState] = useState<'SETUP' | 'READY' | 'PLAYING' | 'PAUSED' | 'FINISHED'>('SETUP');
  const [chessTime1, setChessTime1] = useState(600);
  const [chessTime2, setChessTime2] = useState(600);
  const [chessActive, setChessActive] = useState<1 | 2 | null>(null);
  const [chessTurnCount, setChessTurnCount] = useState(0);
  const [chessTurnStartTime, setChessTurnStartTime] = useState(0); // For Bronstein calc
  const [isChessResumed, setIsChessResumed] = useState(false); // Track if current game is resumed
  
  // Suspended Chess State - Now a Record keyed by mode
  const [suspendedChessState, setSuspendedChessState] = useState<Record<string, any>>(() => {
      try {
        const saved = localStorage.getItem('sm_suspended_chess');
        if (!saved) return {};
        const parsed = JSON.parse(saved);
        // Simple check to see if it's the old format (flat object) vs new format (dictionary)
        // Old format had 'time1', new format has keys like 'STANDARD', 'GONG'
        if (parsed && typeof parsed.time1 === 'number') {
            return {}; // Discard old incompatible format to avoid bugs
        }
        return parsed || {};
      } catch (e) {
          return {};
      }
  });

  // Preset Dialog State
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<PresetCategory | 'ALL'>('ALL');
  
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetFormName, setPresetFormName] = useState('');
  const [presetFormTarget, setPresetFormTarget] = useState('');
  const [presetFormMaxTurns, setPresetFormMaxTurns] = useState('');
  const [presetFormCategory, setPresetFormCategory] = useState<PresetCategory>('BOARD');
  const [presetPlayerCount, setPresetPlayerCount] = useState<number>(3);
  const [presetPlayerNames, setPresetPlayerNames] = useState<string>('');

  // Confirmation Modal State
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    type: 'RESET_SCORES' | 'RESET_ALL' | 'LOAD_GAME' | 'DELETE_PRESET' | 'DELETE_SAVE' | 'DELETE_PLAYER' | 'PASS_TURN' | 'EXIT_CHESS' | 'OVERWRITE_CHESS' | 'OVERWRITE_CHESS_START' | null;
    payload?: any;
  }>({ isOpen: false, type: null });

  // Refs for scrolling
  const scoringPlayerScrollRef = useRef<HTMLDivElement>(null);

  // Translation Helper
  const t = (key: keyof typeof TRANSLATIONS['es']) => {
    // @ts-ignore
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['es'][key] || key;
  };

  // Helper to determine active player ID based on history length (Deterministic)
  const getActivePlayerId = () => {
      if (players.length === 0) return null;
      // Calculate total turns across all players to find whose turn it is
      // This assumes strict turn order 0, 1, 2, 0, 1, 2...
      // However, if we just want "who is next", it's usually (total turns) % count
      const totalTurns = players.reduce((sum, p) => sum + p.history.length, 0);
      return players[totalTurns % players.length].id;
  };

  const getPlayerInitials = (name: string) => {
      const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
      if (parts.length === 0) return '?';
      
      // If 3 or more words, take first letter of first 3 words
      if (parts.length >= 3) {
          return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
      }

      // Check for name + number pattern (e.g. "Jugador 10")
      const lastPart = parts[parts.length - 1];
      if (parts.length > 1 && /^\d+$/.test(lastPart)) {
          return (parts[0][0] + lastPart).toUpperCase().slice(0, 3);
      }

      if (parts.length === 2) {
           return (parts[0][0] + parts[1][0]).toUpperCase();
      }

      return parts[0].slice(0, 3).toUpperCase();
  };

  const triggerToast = (msg: string) => {
      setToastMessage(msg);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2500);
  };

  const playAlarm = () => {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') ctx.resume();
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          // Simple clean beep
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime); 
          
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
          console.error("Audio playback error", e);
      }
  };

  const playVictorySound = () => {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') ctx.resume();
          
          const now = ctx.currentTime;
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
          
          notes.forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now + i * 0.15);
              
              gain.gain.setValueAtTime(0, now + i * 0.15);
              gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
              gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
              
              osc.start(now + i * 0.15);
              osc.stop(now + i * 0.15 + 0.5);
          });
      } catch (e) {
          console.error("Audio playback error", e);
      }
  };

  const playClickSound = () => {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') ctx.resume();
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(400, ctx.currentTime); // Lower pitch "thock"
          
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
      } catch (e) {
          console.error("Audio playback error", e);
      }
  };

  // Splash Screen Effect
  useEffect(() => {
    if (showSplash) {
        // Auto dismiss after time
        const timer = setTimeout(() => {
            handleDismissSplash();
        }, 3500);
        return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const handleDismissSplash = () => {
      if (splashFading) return;
      
      setSplashFading(true);
      
      // Use the Ref to check the latest value of the checkbox
      // This works even if called from the initial useEffect closure
      if (dontShowSplashRef.current) {
          localStorage.setItem('sm_skip_splash', 'true');
      }

      setTimeout(() => {
          setShowSplash(false);
          setSplashFading(false);
      }, 500); // Match CSS fade duration
  };

  const toggleDontShowSplash = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !dontShowSplashAgain;
    setDontShowSplashAgain(newValue);
    dontShowSplashRef.current = newValue; // Update ref immediately
  };

  // Language & RTL Effect
  useEffect(() => {
    localStorage.setItem('sm_lang', language);
    if (language === 'ar') {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }
  }, [language]);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
    } else {
        root.classList.add(theme);
    }
    localStorage.setItem('sm_theme', theme);
  }, [theme]);

  // Init check
  useEffect(() => {
    if (players.length > 0 && view === 'START') {
        setView('LIST');
    }
  }, []);
  
  // Victory Sound Effect
  useEffect(() => {
      if (view === 'VICTORY') {
          playVictorySound();
      }
  }, [view]);

  // Scroll to active player in scoring view
  useEffect(() => {
      if (view === 'SCORING' && selectedPlayerId && scoringPlayerScrollRef.current) {
          const selectedElement = document.getElementById(`score-player-${selectedPlayerId}`);
          if (selectedElement) {
              selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
      }
  }, [view, selectedPlayerId]);

  useEffect(() => {
     if (!editingPlayerId) {
         setNewPlayerColor(PREDEFINED_COLORS[players.length % PREDEFINED_COLORS.length]);
     }
  }, [players.length, editingPlayerId]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('sm_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('sm_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('sm_gamename', gameName);
  }, [gameName]);

  useEffect(() => {
    localStorage.setItem('sm_saved_games', JSON.stringify(savedGames));
  }, [savedGames]);

  useEffect(() => {
    localStorage.setItem('sm_game_presets', JSON.stringify(gamePresets));
  }, [gamePresets]);

  useEffect(() => {
      localStorage.setItem('sm_suspended_chess', JSON.stringify(suspendedChessState));
  }, [suspendedChessState]);

  useEffect(() => {
      localStorage.setItem('sm_who_starts_used', String(hasUsedWhoStarts));
  }, [hasUsedWhoStarts]);

  // Timer Effect (Optimized)
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timerLeft > 0) {
      interval = setInterval(() => {
          setTimerLeft(current => {
              if (current <= 1) {
                  setIsTimerActive(false);
                  playAlarm();
                  return 0;
              }
              return current - 1;
          });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]); // Removed timerLeft from dependency to avoid interval churn

  // Chess Clock Effect
  useEffect(() => {
    let interval: any;
    if (chessGameState === 'PLAYING' && chessActive) {
        interval = setInterval(() => {
            if (chessActive === 1) {
                setChessTime1(t => {
                   if (t <= 0) { 
                       setChessGameState('FINISHED'); 
                       playAlarm();
                       return 0; 
                   }
                   return t - 1;
                });
            } else {
                setChessTime2(t => {
                   if (t <= 0) { 
                       setChessGameState('FINISHED'); 
                       playAlarm();
                       return 0; 
                   }
                   return t - 1;
                });
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [chessGameState, chessActive]);

  // Handlers
  const startGame = () => {
    if (!tempGameName.trim()) {
        setGameNameError(true);
        setTimeout(() => setGameNameError(false), 500);
        return;
    }

    if (players.length > 0) {
        setGameName(tempGameName.trim());
        const maxTurnsVal = tempMaxTurns ? parseInt(tempMaxTurns) : null;
        setSettings({ 
            targetScore: tempTargetScore ? parseInt(tempTargetScore) : null,
            maxTurns: (maxTurnsVal !== null && maxTurnsVal > 0) ? maxTurnsVal : null // Treat 0 as null (infinite)
        });
        setView('LIST');
        return;
    }

    setSetupWizard({
        step: 'COUNT',
        total: 0,
        current: 0,
        tempPlayers: []
    });
    setCustomPlayerCount('');
    setShowCustomCountInput(false);
  };

  const initWizardPlayers = (count: number) => {
      setSetupWizard(prev => prev ? { ...prev, step: 'DETAILS', total: count, current: 0, tempPlayers: [] } : null);
      setWizardPlayerName('');
      setWizardPlayerColor(PREDEFINED_COLORS[0]);
  };

  const nextWizardStep = () => {
      if (!setupWizard) return;

      const newPlayer: Player = {
          id: crypto.randomUUID(),
          name: wizardPlayerName.trim() || `${t('player')} ${setupWizard.current + 1}`,
          totalScore: 0,
          history: [],
          color: wizardPlayerColor
      };

      const updatedPlayers = [...setupWizard.tempPlayers, newPlayer];

      if (setupWizard.current + 1 >= setupWizard.total) {
          setPlayers(updatedPlayers);
          setGameName(tempGameName.trim());
          const maxTurnsVal = tempMaxTurns ? parseInt(tempMaxTurns) : null;
          setSettings({ 
            targetScore: tempTargetScore ? parseInt(tempTargetScore) : null,
            maxTurns: (maxTurnsVal !== null && maxTurnsVal > 0) ? maxTurnsVal : null // Treat 0 as null (infinite)
        });
        setView('LIST');
        setSetupWizard(null);
      } else {
          setSetupWizard({
              ...setupWizard,
              current: setupWizard.current + 1,
              tempPlayers: updatedPlayers
          });
          setWizardPlayerName('');
          setWizardPlayerColor(PREDEFINED_COLORS[(setupWizard.current + 1) % PREDEFINED_COLORS.length]);
      }
  };


  const handleSavePlayer = () => {
    const finalName = newPlayerName.trim() || `${t('player')} ${players.length + 1}`;

    if (editingPlayerId) {
        setPlayers(prev => prev.map(p => 
            p.id === editingPlayerId 
            ? { ...p, name: finalName, color: newPlayerColor }
            : p
        ));
    } else {
        const newPlayer: Player = {
          id: crypto.randomUUID(),
          name: finalName,
          totalScore: 0,
          history: [],
          color: newPlayerColor
        };
        setPlayers([...players, newPlayer]);
    }
    
    setNewPlayerName('');
    setEditingPlayerId(null);
  };

  const openAddPlayerDialog = () => {
      setEditingPlayerId(null);
      setNewPlayerName('');
      setNewPlayerColor(PREDEFINED_COLORS[players.length % PREDEFINED_COLORS.length]);
      (document.getElementById('add-player-dialog') as HTMLDialogElement)?.showModal();
  };

  const openEditPlayerDialog = (player: Player, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingPlayerId(player.id);
      setNewPlayerName(player.name);
      setNewPlayerColor(player.color);
      (document.getElementById('add-player-dialog') as HTMLDialogElement)?.showModal();
  };

  const isColorTaken = (color: string) => {
      return players.some(p => p.color === color && p.id !== editingPlayerId);
  };

  const deletePlayer = (id: string) => {
    setConfirmationState({ isOpen: true, type: 'DELETE_PLAYER', payload: id });
  };

  const selectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setCurrentTurnScore(0);
    setCurrentTurnSource('MANUAL');
    setView('SCORING');
  };

  const navigatePlayer = (direction: 'next' | 'prev') => {
    const currentIndex = players.findIndex(p => p.id === selectedPlayerId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % players.length;
    } else {
        newIndex = (currentIndex - 1 + players.length) % players.length;
    }
    
    setSelectedPlayerId(players[newIndex].id);
    setCurrentTurnScore(0);
    setCurrentTurnSource('MANUAL');
  };

  const handleQuickAdd = (amount: number) => {
    setCurrentTurnScore(prev => prev + amount);
    setCurrentTurnSource('QUICK');
  };

  const handleKeypadPress = (key: string) => {
    if (key === '+/-') {
      setCurrentTurnScore(prev => prev * -1);
      return;
    }
    const currentString = Math.abs(currentTurnScore).toString();
    const newString = currentTurnScore === 0 ? key : currentString + key;
    const newNumber = parseInt(newString, 10) * (currentTurnScore < 0 ? -1 : 1);
    
    if (newNumber < 100000 && newNumber > -100000) {
      setCurrentTurnScore(newNumber);
      setCurrentTurnSource('KEYPAD');
    }
  };

  const handleKeypadDelete = () => {
    const currentString = Math.abs(currentTurnScore).toString();
    if (currentString.length <= 1) {
      setCurrentTurnScore(0);
    } else {
      const newString = currentString.slice(0, -1);
      setCurrentTurnScore(parseInt(newString, 10) * (currentTurnScore < 0 ? -1 : 1));
    }
    setCurrentTurnSource('KEYPAD');
  };

  const commitTurn = () => {
    if (currentTurnScore === 0) return;
    
    if (!selectedPlayerId) return;

    // Use current players list to calculate new state
    const currentPlayers = [...players];
    const playerIndex = currentPlayers.findIndex(p => p.id === selectedPlayerId);
    
    if (playerIndex === -1) return;

    const currentPlayer = currentPlayers[playerIndex];
    const newScore = currentPlayer.totalScore + currentTurnScore;
    const turn: Turn = {
      id: crypto.randomUUID(),
      amount: currentTurnScore,
      timestamp: Date.now(),
      source: currentTurnSource
    };

    const updatedPlayer = {
        ...currentPlayer,
        totalScore: newScore,
        history: [turn, ...currentPlayer.history]
    };

    const updatedPlayers = currentPlayers.map(p => p.id === selectedPlayerId ? updatedPlayer : p);
    
    setPlayers(updatedPlayers);

    // Check for score victory
    if (settings.targetScore !== null) {
      if (newScore >= settings.targetScore) {
        setWinnerId(selectedPlayerId);
        setView('VICTORY');
        return;
      }
    }
    
    // Check for max turns victory
    if (settings.maxTurns !== null) {
        const allFinished = updatedPlayers.every(p => p.history.length >= settings.maxTurns!);
        if (allFinished) {
            const sortedPlayers = [...updatedPlayers].sort((a, b) => b.totalScore - a.totalScore);
            const winner = sortedPlayers[0];
            setWinnerId(winner.id);
            setView('VICTORY');
            return;
        }
    }
    
    // Auto advance logic
    const nextIndex = (playerIndex + 1) % updatedPlayers.length;
    setSelectedPlayerId(updatedPlayers[nextIndex].id);
    setCurrentTurnScore(0);
    setCurrentTurnSource('MANUAL');
  };

  const handleSavePreset = () => {
    if (!tempGameName.trim()) {
      triggerToast(t('savePresetAlert'));
      return;
    }
    const newPreset: GamePreset = {
      id: crypto.randomUUID(),
      name: tempGameName.trim(),
      defaultTargetScore: tempTargetScore ? parseInt(tempTargetScore) : null,
      defaultMaxTurns: tempMaxTurns ? parseInt(tempMaxTurns) : null,
      category: 'BOARD'
    };
    setGamePresets([...gamePresets, newPreset]);
    triggerToast(t('savePresetSuccess'));
  };

  const handleLoadPreset = (preset: GamePreset) => {
    setTempGameName(preset.name);
    setTempTargetScore(preset.defaultTargetScore !== null ? preset.defaultTargetScore!.toString() : '');
    setTempMaxTurns(preset.defaultMaxTurns !== null ? (preset.defaultMaxTurns?.toString() || '') : '');
    
    if (preset.defaultPlayerCount && preset.defaultPlayerCount > 0) {
      // Only set players if there are none currently
      if (players.length === 0) {
        const names = preset.defaultPlayerNames || [];
        const newPlayers: Player[] = [];
        for (let i = 0; i < preset.defaultPlayerCount; i++) {
            newPlayers.push({
            id: crypto.randomUUID(),
            name: names[i] || `${t('player')} ${i + 1}`,
            totalScore: 0,
            history: [],
            color: PREDEFINED_COLORS[i % PREDEFINED_COLORS.length]
            });
        }
        setPlayers(newPlayers);
        triggerToast(`${t('loadedConfig')} ${preset.defaultPlayerCount} ${t('playersCount')}`);
      } else {
        // Just update the settings, keep existing players
        triggerToast(t('loadedConfig'));
      }
    }
    
    setIsPresetsOpen(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmationState({ isOpen: true, type: 'DELETE_PRESET', payload: id });
  };

  const handleEditPreset = (preset: GamePreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPresetId(preset.id);
    setPresetFormName(preset.name);
    setPresetFormTarget(preset.defaultTargetScore !== null ? preset.defaultTargetScore!.toString() : '');
    setPresetFormMaxTurns(preset.defaultMaxTurns !== null ? (preset.defaultMaxTurns?.toString() || '') : '');
    setPresetPlayerCount(preset.defaultPlayerCount || 3);
    setPresetPlayerNames(preset.defaultPlayerNames?.join(', ') || '');
    setPresetFormCategory(preset.category || 'BOARD');
    setIsCreatingPreset(true);
  };

  const cyclePresetCategory = () => {
      if (presetFormCategory === 'BOARD') setPresetFormCategory('CARD');
      else if (presetFormCategory === 'CARD') setPresetFormCategory('OTHER');
      else setPresetFormCategory('BOARD');
  };

  const getCategoryLabel = (cat: PresetCategory) => {
      switch(cat) {
          case 'BOARD': return t('boardGame');
          case 'CARD': return t('cardGame');
          case 'OTHER': return t('other');
          default: return t('other');
      }
  };

  const handleSavePresetForm = () => {
    if (!presetFormName.trim()) return;
    const names = presetPlayerNames.split(',').map(n => n.trim()).filter(n => n.length > 0);
    const finalCount = Math.max(presetPlayerCount, names.length);

    const newPresetData = {
        name: presetFormName.trim(),
        defaultTargetScore: presetFormTarget ? parseInt(presetFormTarget) : null,
        defaultMaxTurns: presetFormMaxTurns ? parseInt(presetFormMaxTurns) : null,
        defaultPlayerCount: finalCount,
        defaultPlayerNames: names,
        category: presetFormCategory
    };

    if (editingPresetId) {
        setGamePresets(prev => prev.map(p => 
            p.id === editingPresetId ? { ...p, ...newPresetData } : p
        ));
    } else {
        const newPreset: GamePreset = {
            id: crypto.randomUUID(),
            ...newPresetData
        };
        setGamePresets([...gamePresets, newPreset]);
    }

    setPresetFormName('');
    setPresetFormTarget('');
    setPresetFormMaxTurns('');
    setPresetPlayerCount(3);
    setPresetPlayerNames('');
    setPresetFormCategory('BOARD');
    setEditingPresetId(null);
    setIsCreatingPreset(false);
  };

  const handleSaveGame = () => {
    const newSave: SavedGame = {
      id: crypto.randomUUID(),
      name: gameName || `${t('game')} ${new Date().toLocaleDateString()}`,
      date: Date.now(),
      players: players,
      settings: settings
    };
    // Limit saved games to 50 to prevent localStorage overflow on mobile
    setSavedGames([newSave, ...savedGames].slice(0, 50));
    
    triggerToast(t('gameSaved'));
  };

  const handleShareGame = async () => {
      const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
      let text = `🏆 LudiScore: ${gameName}\n`;
      if (settings.targetScore) text += `🎯 ${t('objective')}: ${settings.targetScore}\n`;
      if (settings.maxTurns) text += `⏳ ${t('rounds')}: ${settings.maxTurns}\n`;
      text += `\n`;
      
      sortedPlayers.forEach((p, i) => {
          text += `${i + 1}. ${p.name}: ${p.totalScore}\n`;
      });

      if (navigator.share) {
          try {
              await navigator.share({
                  title: `LudiScore: ${gameName}`,
                  text: text
              });
          } catch (err) {
              console.error("Error sharing", err);
          }
      } else {
          navigator.clipboard.writeText(text);
          triggerToast(t('shareSuccess'));
      }
  };

  const handleDeleteSave = (id: string) => {
    setConfirmationState({ isOpen: true, type: 'DELETE_SAVE', payload: id });
  };

  const requestLoadGame = (game: SavedGame) => {
    setConfirmationState({ isOpen: true, type: 'LOAD_GAME', payload: game });
  };

  const requestResetGame = () => {
    setConfirmationState({ isOpen: true, type: 'RESET_SCORES' });
  };

  const requestFullReset = () => {
    setConfirmationState({ isOpen: true, type: 'RESET_ALL' });
  };

  const handleEndGame = () => {
    if (players.length === 0) return;
    const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
    setWinnerId(sorted[0].id);
    setView('VICTORY');
  };

  const executeConfirmation = () => {
    const { type, payload } = confirmationState;

    if (type === 'RESET_SCORES') {
        setPlayers(prev => prev.map(p => ({ ...p, totalScore: 0, history: [] })));
        setWinnerId(null);
        setHasUsedWhoStarts(false);
        setView('LIST');
    } else if (type === 'RESET_ALL') {
        setPlayers([]);
        setWinnerId(null);
        setSettings({ targetScore: null, maxTurns: null });
        setGameName('');
        setTempGameName('');
        setTempTargetScore('');
        setTempMaxTurns('');
        setHasUsedWhoStarts(false);
        setView('START');
    } else if (type === 'LOAD_GAME' && payload) {
        const game = payload as SavedGame;
        setPlayers(game.players);
        setSettings(game.settings);
        setGameName(game.name);
        setWinnerId(null);
        setView('LIST');
    } else if (type === 'DELETE_PRESET' && payload) {
        setGamePresets(prev => prev.filter(p => p.id !== payload));
    } else if (type === 'DELETE_SAVE' && payload) {
        setSavedGames(prev => prev.filter(g => g.id !== payload));
    } else if (type === 'DELETE_PLAYER' && payload) {
        setPlayers(prev => prev.filter(p => p.id !== payload));
        if (view === 'SCORING') {
            setView('LIST');
        }
    } else if (type === 'EXIT_CHESS') {
        if (isChessResumed) {
             setSuspendedChessState(prev => {
                const newState = { ...prev };
                delete newState[chessModeType];
                return newState;
            });
            setIsChessResumed(false);
        }

        setChessGameState('SETUP');
        setChessTime1(600);
        setChessTime2(600);
        setActiveTool('MENU');
    } else if (type === 'OVERWRITE_CHESS') {
        saveChessGame();
    } else if (type === 'OVERWRITE_CHESS_START') {
        startChessGame();
    } else if (type === 'PASS_TURN') {
        if (!selectedPlayerId) {
             setConfirmationState({ isOpen: false, type: null });
             return;
        }

        // Use current players list to calculate new state
        const currentPlayers = [...players];
        const playerIndex = currentPlayers.findIndex(p => p.id === selectedPlayerId);
        
        if (playerIndex === -1) return;

        const currentPlayer = currentPlayers[playerIndex];
        const turn: Turn = {
            id: crypto.randomUUID(),
            amount: 0,
            timestamp: Date.now(),
            source: 'MANUAL'
        };
        const updatedPlayer = {
            ...currentPlayer,
            history: [turn, ...currentPlayer.history]
        };
        const updatedPlayers = currentPlayers.map(p => p.id === selectedPlayerId ? updatedPlayer : p);
        
        setPlayers(updatedPlayers);

        // Check max turns
        if (settings.maxTurns !== null) {
            const allFinished = updatedPlayers.every(p => p.history.length >= settings.maxTurns!);
            if (allFinished) {
                const sortedPlayers = [...updatedPlayers].sort((a, b) => b.totalScore - a.totalScore);
                const winner = sortedPlayers[0];
                setWinnerId(winner.id);
                setView('VICTORY');
                setConfirmationState({ isOpen: false, type: null, payload: undefined });
                return;
            }
        }

        // Advance turn
        const nextIndex = (playerIndex + 1) % updatedPlayers.length;
        setSelectedPlayerId(updatedPlayers[nextIndex].id);
        setCurrentTurnScore(0);
        setCurrentTurnSource('MANUAL');
    }
    setConfirmationState({ isOpen: false, type: null, payload: undefined });
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    // Logic locking if who starts was used
    if (hasUsedWhoStarts) {
        if (index === 0 && direction === 'down') return; // Cannot move first player down
        if (index === 1 && direction === 'up') return; // Cannot move second player up (swapping with first)
    }

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === players.length - 1) return;

    const newPlayers = [...players];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newPlayers[index], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[index]];
    setPlayers(newPlayers);
  };

  // Extra Handlers
  const handleRollDice = () => {
    setIsRolling(true);
    const duration = 1000;
    const interval = setInterval(() => {
       setDiceValue(Math.floor(Math.random() * diceSides) + 1);
    }, 100);
    setTimeout(() => {
       clearInterval(interval);
       setIsRolling(false);
       setDiceValue(Math.floor(Math.random() * diceSides) + 1);
    }, duration);
  };

  const modifyTimer = (amount: number) => {
    setTimerLeft(prev => {
        const newValue = Math.max(0, prev + amount);
        if (!isTimerActive) {
            setTimerStartValue(newValue);
        }
        return newValue;
    });
  };

  const handleFlipCoin = () => {
      setIsFlipping(true);
      setCoinResult(null);
      setTimeout(() => {
          setCoinResult(Math.random() > 0.5 ? 'HEADS' : 'TAILS');
          setIsFlipping(false);
      }, 1000);
  };

  const handlePickPlayer = () => {
     if (players.length === 0) return;
     if (pickerDone) {
         // Proceed action
         setIsExtrasOpen(false);
         setActiveTool('MENU');
         return;
     }

     setIsPicking(true);
     setPickerId(null);
     let count = 0;
     const maxCount = 20;
     let resultId: string | null = null;
     
     const interval = setInterval(() => {
        resultId = players[Math.floor(Math.random() * players.length)].id;
        setPickerId(resultId);
        count++;
        if (count > maxCount) {
            clearInterval(interval);
            setIsPicking(false);
            setPickerDone(true);
            
            // Reordering logic if game hasn't started
            const hasGameStarted = players.some(p => p.history.length > 0);
            if (!hasGameStarted && resultId) {
                const winnerIndex = players.findIndex(p => p.id === resultId);
                if (winnerIndex > 0) {
                    const reordered = [
                        ...players.slice(winnerIndex),
                        ...players.slice(0, winnerIndex)
                    ];
                    setPlayers(reordered);
                }
                setHasUsedWhoStarts(true);
            }
        }
     }, 100);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startChessGameRequest = () => {
      if (suspendedChessState[chessModeType]) {
          setConfirmationState({ isOpen: true, type: 'OVERWRITE_CHESS_START' });
      } else {
          startChessGame();
      }
  };

  const startChessGame = () => {
      let t1, t2;
      if (chessModeType === 'GONG') {
          t1 = chessConfig.gong;
          t2 = chessConfig.gong;
      } else {
          t1 = chessConfig.time;
          t2 = chessConfig.time;
      }
      setChessTime1(t1);
      setChessTime2(t2);
      setChessActive(null);
      setChessTurnCount(1);
      setChessTurnStartTime(t1); // Init for bronstein
      setChessGameState('READY');
      setIsChessResumed(false);
  };

  const requestSaveChessGame = () => {
      if (suspendedChessState[chessModeType]) {
          setConfirmationState({ isOpen: true, type: 'OVERWRITE_CHESS' });
      } else {
          saveChessGame();
      }
  };

  const saveChessGame = () => {
      const currentGameState = {
          time1: chessTime1,
          time2: chessTime2,
          active: chessActive,
          turnCount: chessTurnCount,
          turnStartTime: chessTurnStartTime,
          mode: chessModeType,
          config: chessConfig,
          gameState: chessGameState
      };

      setSuspendedChessState(prev => ({
          ...prev,
          [chessModeType]: currentGameState
      }));
      
      triggerToast(t('chessStateSaved'));
      setChessGameState('SETUP');
      setActiveTool('MENU');
      setIsChessResumed(false); // Saved manually, so not a resumed transient state anymore
  };

  const resumeChessGame = () => {
      const saved = suspendedChessState[chessModeType];
      if (!saved) return;
      
      setChessTime1(saved.time1);
      setChessTime2(saved.time2);
      setChessActive(saved.active);
      setChessTurnCount(saved.turnCount);
      setChessTurnStartTime(saved.turnStartTime);
      setChessModeType(saved.mode);
      setChessConfig(saved.config);
      setChessGameState('PAUSED');
      setIsChessResumed(true); // Mark as resumed to delete on exit
      
      // Optionally remove from suspended state if resuming (to act like "Move" rather than "Copy")
      // But keeping it allows resuming again if needed. 
      // User requested "save game", implied persistence.
  };

  const handleChessTap = (player: 1 | 2) => {
      if (chessGameState === 'FINISHED') return;
      
      if (chessGameState === 'READY') {
          playClickSound();
          // First tap starts the OPPONENT's clock
          const opponent = player === 1 ? 2 : 1;
          setChessActive(opponent);
          setChessGameState('PLAYING');
          setChessTurnStartTime(opponent === 1 ? chessTime1 : chessTime2);
          return;
      }

      if (chessGameState === 'PAUSED') {
          setChessGameState('PLAYING');
          return;
      }

      // Logic only runs if the active player taps (to end their turn)
      if (chessActive === player) {
          playClickSound();
          // 1. Apply Logic for ENDING turn
          if (chessModeType === 'FISCHER') {
              if (chessTurnCount >= chessConfig.incStart) {
                  if (player === 1) setChessTime1(t => t + chessConfig.inc);
                  else setChessTime2(t => t + chessConfig.inc);
              }
          } else if (chessModeType === 'BRONSTEIN') {
               // Bronstein: Add back time used, up to increment amount
               const currentRemaining = player === 1 ? chessTime1 : chessTime2;
               const usedTime = chessTurnStartTime - currentRemaining;
               const bonus = Math.min(usedTime, chessConfig.inc);
               
               if (player === 1) setChessTime1(t => t + bonus);
               else setChessTime2(t => t + bonus);
          } else if (chessModeType === 'GONG') {
               // Reset current player to full time
               if (player === 1) setChessTime1(chessConfig.gong);
               else setChessTime2(chessConfig.gong);
          }

          // 2. Switch Turn
          const nextPlayer = player === 1 ? 2 : 1;
          setChessActive(nextPlayer);
          setChessTurnCount(c => c + 1);
          
          // 3. Set Start Time for next player (Bronstein)
          setChessTurnStartTime(player === 1 ? chessTime2 : chessTime1);
      }
  };

  const handleChessExitRequest = () => {
      if ((chessGameState === 'PLAYING' || chessGameState === 'PAUSED') && activeTool === 'CHESS') {
          setConfirmationState({ isOpen: true, type: 'EXIT_CHESS' });
      } else {
          if (activeTool === 'CHESS' && chessGameState !== 'SETUP') {
              // Handle exit from non-playing states (e.g. FINISHED or READY)
              if (isChessResumed) {
                  setSuspendedChessState(prev => {
                      const newState = { ...prev };
                      delete newState[chessModeType];
                      return newState;
                  });
                  setIsChessResumed(false);
              }
              setChessGameState('SETUP');
          } else {
              if (activeTool === 'MENU') {
                  setIsExtrasOpen(false);
              } else {
                  setActiveTool('MENU');
              }
          }
      }
  };

  const renderSplashScreen = () => {
      if (!showSplash) return null;
      
      return (
          <div 
            onClick={handleDismissSplash}
            className={`fixed inset-0 z-[100] bg-indigo-950 flex flex-col items-center justify-center p-6 text-white transition-opacity duration-500 cursor-pointer overflow-hidden ${splashFading ? 'opacity-0' : 'opacity-100'}`}
          >
              <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-sm">
                  
                  {/* Animation Container */}
                  <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                      
                      {/* Exploding Cards Background */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <CreditCard size={64} className="absolute text-pink-500/80 animate-card-left" />
                           <CreditCard size={64} className="absolute text-cyan-500/80 animate-card-right" />
                           <CreditCard size={64} className="absolute text-yellow-500/80 animate-card-bottom" />
                      </div>

                      {/* Rotating Dice Foreground */}
                      <div className="relative z-10 animate-dice-tumble">
                          <Dices size={96} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                      </div>
                  </div>

                  <h1 className="text-5xl font-black mb-2 tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                      LudiScore
                  </h1>
                  <span className="text-indigo-300 font-bold tracking-widest text-sm animate-in fade-in duration-1000 delay-700">v1.0</span>

              </div>

              <div className="mt-auto pb-safe w-full max-w-xs animate-in fade-in duration-1000 delay-1000">
                  <div className="text-center text-indigo-300/50 text-xs uppercase tracking-widest mb-6 animate-pulse">
                      Tap to start
                  </div>
                  
                  <div 
                    onClick={toggleDontShowSplash}
                    className="flex items-center justify-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer select-none"
                  >
                      <div className={`w-5 h-5 rounded border border-indigo-400 flex items-center justify-center transition-colors ${dontShowSplashAgain ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent'}`}>
                          {dontShowSplashAgain && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-indigo-200">No volver a mostrar</span>
                  </div>
              </div>
          </div>
      );
  };

  const renderConfirmationModal = () => (
      confirmationState.isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmationState({ isOpen: false, type: null })} />
            <div className="relative bg-white dark:bg-gray-900 border border-red-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                    {confirmationState.type === 'EXIT_CHESS' ? t('confirmExitChess') : 
                     confirmationState.type === 'OVERWRITE_CHESS' ? t('confirmOverwriteChess') : 
                     confirmationState.type === 'OVERWRITE_CHESS_START' ? t('confirmOverwriteChessStart') : t('confirmTitle')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">
                    {confirmationState.type === 'RESET_SCORES' && t('confirmResetScores')}
                    {confirmationState.type === 'RESET_ALL' && t('confirmResetAll')}
                    {confirmationState.type === 'LOAD_GAME' && t('confirmLoadGame')}
                    {confirmationState.type === 'DELETE_PRESET' && t('confirmDeletePreset')}
                    {confirmationState.type === 'DELETE_SAVE' && t('confirmDeleteSave')}
                    {confirmationState.type === 'DELETE_PLAYER' && t('confirmDeletePlayer')}
                    {confirmationState.type === 'PASS_TURN' && t('confirmPassTurn')}
                    {confirmationState.type === 'EXIT_CHESS' && t('confirmExitChessDesc')}
                    {confirmationState.type === 'OVERWRITE_CHESS' && t('confirmOverwriteChessDesc')}
                    {confirmationState.type === 'OVERWRITE_CHESS_START' && t('confirmOverwriteChessStartDesc')}
                </p>
                <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => setConfirmationState({ isOpen: false, type: null })}>
                        {t('cancel')}
                    </Button>
                    <Button variant="danger" fullWidth onClick={executeConfirmation}>
                        {confirmationState.type === 'EXIT_CHESS' ? t('exitWithoutSaving') : 
                         confirmationState.type === 'OVERWRITE_CHESS' ? t('save') : 
                         confirmationState.type === 'OVERWRITE_CHESS_START' ? t('startAnyway') : t('accept')}
                    </Button>
                </div>
            </div>
         </div>
      )
  );

  const renderPlayerHistoryModal = () => {
    const player = players.find(p => p.id === selectedPlayerId);
    if (!isPlayerHistoryOpen || !player) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPlayerHistoryOpen(false)} />
            <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl w-full max-w-sm shadow-2xl h-[70vh] flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header with Close */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{t('playerHistory')}</h3>
                    <button onClick={() => setIsPlayerHistoryOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Player Navigation Bar */}
                <div className="flex items-center justify-between mb-6 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <button onClick={() => navigatePlayer('prev')} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95">
                        <ChevronLeft size={24} className="rtl:rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${player.color} text-sm`}>
                            {getPlayerInitials(player.name)}
                        </div>
                        <div className="font-bold text-base truncate max-w-[140px]">{player.name}</div>
                    </div>

                    <button onClick={() => navigatePlayer('next')} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95">
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

  const renderExtrasModal = () => {
      if (!isExtrasOpen) return null;
      const isChessActive = activeTool === 'CHESS' && chessGameState !== 'SETUP';
      const isPickerDisabled = view === 'SCORING' || hasUsedWhoStarts;
      
      return (
        <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 ${activeTool === 'CHESS' ? 'overflow-hidden' : ''}`}>
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleChessExitRequest} />
             <div className={`relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col ${activeTool === 'CHESS' ? 'h-[90vh] min-h-[500px]' : 'min-h-[300px]'}`}>
                 
                 {!isChessActive && (
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

                 <div className="flex-1 flex flex-col justify-center h-full min-h-0">
                    {activeTool === 'MENU' && (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setActiveTool('DICE')} className="flex flex-col items-center justify-center gap-3 bg-indigo-50 dark:bg-gray-800 p-6 rounded-2xl hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors">
                                <Dices size={32} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="font-bold text-gray-700 dark:text-gray-200">{t('rollDice')}</span>
                            </button>
                            <button onClick={() => setActiveTool('TIMER')} className="flex flex-col items-center justify-center gap-3 bg-orange-50 dark:bg-gray-800 p-6 rounded-2xl hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors">
                                <Clock size={32} className="text-orange-600 dark:text-orange-400" />
                                <span className="font-bold text-gray-700 dark:text-gray-200">{t('timer')}</span>
                            </button>
                            <button onClick={() => { setChessGameState('SETUP'); setActiveTool('CHESS'); }} className="flex flex-col items-center justify-center gap-3 bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors">
                                <Timer size={32} className="text-blue-600 dark:text-blue-400" />
                                <span className="font-bold text-gray-700 dark:text-gray-200">{t('chessClock')}</span>
                            </button>
                            <button onClick={() => setActiveTool('COIN')} className="flex flex-col items-center justify-center gap-3 bg-yellow-50 dark:bg-gray-800 p-6 rounded-2xl hover:bg-yellow-100 dark:hover:bg-gray-700 transition-colors">
                                <Coins size={32} className="text-yellow-600 dark:text-yellow-400" />
                                <span className="font-bold text-gray-700 dark:text-gray-200">{t('coinFlip')}</span>
                            </button>
                        </div>
                    )}

                    {activeTool === 'DICE' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="grid grid-cols-4 gap-2 w-full mb-2">
                                {[4,6,8,10,12,20,100].map(sides => (
                                    <button
                                        key={sides}
                                        onClick={() => setDiceSides(sides)}
                                        className={`py-2 px-1 rounded-lg font-bold text-sm transition-colors border ${diceSides === sides ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                                    >
                                        {sides === 100 ? 'd100' : `d${sides}`}
                                    </button>
                                ))}
                            </div>

                            <div className={`w-32 h-32 bg-indigo-600 rounded-3xl flex items-center justify-center text-6xl font-black text-white shadow-xl ${isRolling ? 'animate-spin' : ''}`}>
                                {diceValue}
                            </div>
                            <Button fullWidth onClick={handleRollDice} disabled={isRolling}>
                                {isRolling ? t('rolling') : `${t('rollDice')} (D${diceSides === 100 ? '100' : diceSides})`}
                            </Button>
                        </div>
                    )}

                    {activeTool === 'COIN' && (
                        <div className="flex flex-col items-center gap-10">
                            <div className="relative w-40 h-40">
                                 <div className={`w-full h-full rounded-full flex items-center justify-center text-4xl font-bold text-yellow-900 border-8 border-yellow-600 shadow-xl transition-all duration-700 ${isFlipping ? 'animate-[spin_0.5s_linear_infinite]' : ''} ${!isFlipping && coinResult ? 'bg-yellow-400' : 'bg-yellow-100'}`}>
                                     {!isFlipping && coinResult ? (coinResult === 'HEADS' ? t('heads') : t('tails')) : '?'}
                                 </div>
                            </div>
                            <Button fullWidth onClick={handleFlipCoin} disabled={isFlipping} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 shadow-yellow-500/20">
                                {isFlipping ? t('flipping') : t('coinFlip')}
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
                                            onClick={resumeChessGame}
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
                                                <button onClick={() => setChessConfig(p => ({...p, time: Math.max(60, p.time - 60)}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">-1m</button>
                                                <button onClick={() => setChessConfig(p => ({...p, time: p.time + 60}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+1m</button>
                                                <button onClick={() => setChessConfig(p => ({...p, time: p.time + 300}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+5m</button>
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
                                                                if (!isNaN(val) && val > 0) setChessConfig(p => ({...p, time: val * 60}));
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
                                                        onClick={() => setChessConfig(p => ({...p, gong: sec}))}
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
                                                            if (!isNaN(val) && val > 0) setChessConfig(p => ({...p, gong: val}));
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
                                                <button onClick={() => setChessConfig(p => ({...p, inc: Math.max(0, p.inc - 1)}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">-1s</button>
                                                <button onClick={() => setChessConfig(p => ({...p, inc: p.inc + 1}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+1s</button>
                                            </div>
                                            
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm font-bold text-gray-500 uppercase">{t('incStartTurn')}</label>
                                                    <span className="font-mono font-bold text-lg">#{chessConfig.incStart}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setChessConfig(p => ({...p, incStart: Math.max(1, p.incStart - 1)}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">-1</button>
                                                    <button onClick={() => setChessConfig(p => ({...p, incStart: p.incStart + 1}))} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 font-bold">+1</button>
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
                                
                                <div className="mt-auto">
                                    <Button fullWidth onClick={startChessGameRequest}>
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
                                    className={`flex-1 rounded-t-3xl flex items-center justify-center text-7xl font-black transition-all relative active:scale-[0.99] touch-manipulation select-none ${chessActive === 2 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-4 ring-inset ring-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}
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
                                                    onClick={requestSaveChessGame}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    title={t('save')}
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <div className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg uppercase tracking-wider mx-2">
                                                    {t(`mode${chessModeType.charAt(0) + chessModeType.slice(1).toLowerCase()}` as any)}
                                                </div>
                                                <button 
                                                    onClick={() => setChessGameState(prev => prev === 'PAUSED' ? 'PLAYING' : 'PAUSED')}
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
                                    className={`flex-1 rounded-b-3xl flex items-center justify-center text-7xl font-black transition-all relative active:scale-[0.99] touch-manipulation select-none ${chessActive === 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-4 ring-inset ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="font-mono tabular-nums">{formatTime(chessTime1)}</span>
                                        {chessActive === 1 && <span className="text-xs font-bold mt-2 animate-pulse">{t('turnOf')} P1</span>}
                                    </div>
                                </button>
                            </div>
                        )
                    )}

                    {activeTool === 'PICKER' && (
                         <div className="flex flex-col items-center gap-6 w-full">
                            {players.length > 0 ? (
                                <>
                                    <div className="w-full flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                                        {players.map(p => (
                                            <div key={p.id} className={`p-3 rounded-xl flex items-center gap-3 transition-all ${pickerId === p.id ? `bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500 scale-105` : 'bg-gray-50 dark:bg-gray-800 opacity-50'}`}>
                                                <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{getPlayerInitials(p.name)}</div>
                                                <span className={`font-bold truncate ${pickerId === p.id ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button fullWidth onClick={handlePickPlayer} disabled={isPicking}>
                                        {isPicking ? t('rolling') : (pickerDone ? <span className="flex items-center gap-2"><Check size={18} /> {t('proceed')}</span> : t('pick'))}
                                    </Button>
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

  const renderPlayerDialog = () => (
      <dialog id="add-player-dialog" className="bg-transparent backdrop:bg-black/80 p-0 w-full max-w-sm m-auto z-50">
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl m-4">
            <h3 className="text-xl font-bold mb-4">{editingPlayerId ? t('editPlayer') : t('newPlayer')}</h3>
            
            <input 
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder={`${t('player')} ${players.length + 1}`}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white mb-4 focus:border-indigo-500 focus:outline-none"
                autoFocus
            />

            <div className="grid grid-cols-4 gap-2 mb-2">
                {PREDEFINED_COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => setNewPlayerColor(color)}
                        className={`h-10 rounded-lg ${color} ${newPlayerColor === color ? 'ring-2 ring-indigo-500 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : 'opacity-50 hover:opacity-100'} transition-all relative`}
                    >
                        {isColorTaken(color) && newPlayerColor !== color && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
            
            {isColorTaken(newPlayerColor) && (
                <div className="flex items-center gap-2 text-orange-500 text-xs mb-6 font-bold animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle size={12} /> {t('colorWarning')}
                </div>
            )}
            {!isColorTaken(newPlayerColor) && <div className="mb-6"></div>}
            
            <div className="flex gap-3">
                {editingPlayerId && (
                     <button 
                        onClick={() => {
                            deletePlayer(editingPlayerId);
                            (document.getElementById('add-player-dialog') as HTMLDialogElement)?.close();
                        }}
                        className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                     >
                        {t('delete')}
                     </button>
                )}
                <Button 
                    fullWidth 
                    onClick={() => {
                        handleSavePlayer();
                        (document.getElementById('add-player-dialog') as HTMLDialogElement)?.close();
                    }}
                >
                    {t('save')}
                </Button>
            </div>
             <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white rtl:right-auto rtl:left-4"
                onClick={() => (document.getElementById('add-player-dialog') as HTMLDialogElement)?.close()}
            >
                <X size={24} />
            </button>
        </div>
      </dialog>
  );

  const renderSetupWizard = () => {
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
                                     onClick={() => initWizardPlayers(num)}
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
                             />
                             <Button fullWidth onClick={() => {
                                 const count = parseInt(customPlayerCount);
                                 if (count > 0 && count < 100) initWizardPlayers(count);
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
                         <button onClick={() => setSetupWizard(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                             {t('cancelGame')}
                         </button>
                     </div>
                </div>
             </div>
          );
      }

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
             <div className="w-full max-w-sm animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                     <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('configuration')}</h2>
                     <div className="text-indigo-600 dark:text-indigo-500 font-bold bg-indigo-100 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
                         {setupWizard.current + 1} / {setupWizard.total}
                     </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl mb-8">
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
                        />
                    </div>

                    <div className="mb-2">
                        <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">{t('color')}</label>
                        <div className="grid grid-cols-4 gap-3">
                            {PREDEFINED_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setWizardPlayerColor(color)}
                                    className={`h-12 rounded-xl ${color} ${wizardPlayerColor === color ? 'ring-4 ring-gray-200 dark:ring-gray-700 scale-110 shadow-xl' : 'opacity-40 hover:opacity-100'} transition-all`}
                                >
                                    {wizardPlayerColor === color && <Check size={20} className="mx-auto text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Button fullWidth onClick={nextWizardStep} className="py-4 text-lg shadow-xl shadow-indigo-500/20">
                    {setupWizard.current + 1 === setupWizard.total ? t('startGame') : t('nextPlayer')}
                </Button>
             </div>
          </div>
      );
  };

  const renderStartScreen = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto relative scrollbar-hide">
        <div className="absolute top-6 left-6 z-30 rtl:left-auto rtl:right-6">
             <button 
                onClick={() => setIsAboutOpen(true)}
                className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 transition-transform active:scale-95 hover:scale-105"
            >
                <Info size={20} />
            </button>
        </div>

        <div className="absolute top-6 right-6 z-30 rtl:right-auto rtl:left-6 flex gap-2">
             <button 
                onClick={() => {
                    setIsExtrasOpen(true);
                    setActiveTool('MENU');
                }}
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
                    />
                     <button 
                        onClick={handleSavePreset}
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
                        type="number"
                        value={tempTargetScore}
                        onChange={(e) => setTempTargetScore(e.target.value)}
                        placeholder={t('targetScorePlaceholder')}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium shadow-sm"
                     />
                </div>
                <div>
                     <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{t('maxTurnsLabel')}</label>
                     <input 
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
                     />
                </div>
            </div>

            {players.length > 0 && (
              <div className="bg-indigo-50 dark:bg-gray-800/50 p-3 rounded-xl border border-indigo-100 dark:border-gray-700 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                <Users size={16} />
                <span>{t('loadedConfig')} <b>{players.length}</b> {t('playersCount')}</span>
              </div>
            )}

            <Button fullWidth onClick={startGame} className="mt-4">
                {t('startGame')}
            </Button>

            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-400">{t('orSelect')}</span>
                </div>
            </div>

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
            
            {savedGames.length > 0 && (
                <div className="mt-8 w-full">
                    <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-500 text-sm font-bold uppercase tracking-wider">
                         <Archive size={14} /> {t('recentGames')}
                    </div>
                    <div className="space-y-2">
                        {savedGames.slice(0, 5).map(game => (
                             <div 
                                key={game.id}
                                onClick={() => requestLoadGame(game)}
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
                                            handleDeleteSave(game.id);
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

        {/* Presets Modal */}
        {isPresetsOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPresetsOpen(false)} />
                <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-5 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 h-auto max-h-[90vh] flex flex-col shadow-2xl">
                    <div className="flex justify-between items-center mb-3 shrink-0 border-b border-gray-200 dark:border-gray-800 pb-2">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            {isCreatingPreset ? (
                                <button onClick={() => {
                                    setIsCreatingPreset(false);
                                    setEditingPresetId(null);
                                }} className="mr-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rtl:rotate-180">
                                    <ArrowLeft size={20} />
                                </button>
                            ) : (
                                <LayoutTemplate size={20} />
                            )}
                            {isCreatingPreset ? (editingPresetId ? t('editGame') : t('newGame')) : t('library')}
                        </h3>
                        <div className="flex gap-2">
                            {!isCreatingPreset && (
                                <button 
                                    onClick={() => {
                                        setPresetFormName('');
                                        setPresetFormTarget('');
                                        setPresetFormMaxTurns('');
                                        setPresetPlayerCount(3);
                                        setPresetPlayerNames('');
                                        setPresetFormCategory(libraryFilter === 'ALL' ? 'BOARD' : libraryFilter);
                                        setEditingPresetId(null);
                                        setIsCreatingPreset(true);
                                    }}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
                                    title={t('add')}
                                >
                                    <Plus size={20} />
                                </button>
                            )}
                            <button 
                                onClick={() => setIsPresetsOpen(false)}
                                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {!isCreatingPreset && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                            <button 
                                onClick={() => setLibraryFilter('ALL')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${libraryFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {t('all')}
                            </button>
                            <button 
                                onClick={() => setLibraryFilter('BOARD')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${libraryFilter === 'BOARD' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <Dices size={12} /> {t('boardGame')}
                            </button>
                            <button 
                                onClick={() => setLibraryFilter('CARD')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${libraryFilter === 'CARD' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <CreditCard size={12} /> {t('cardGame')}
                            </button>
                             <button 
                                onClick={() => setLibraryFilter('OTHER')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${libraryFilter === 'OTHER' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <Box size={12} /> {t('other')}
                            </button>
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto">
                    {isCreatingPreset ? (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
                            
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{t('category')}</span>
                                <button 
                                    onClick={cyclePresetCategory}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-700 dark:hover:text-white transition-colors"
                                >
                                    <Folder size={14} className="text-yellow-500" />
                                    {getCategoryLabel(presetFormCategory)}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('gameNameLabel')}</label>
                                    <input 
                                        type="text"
                                        value={presetFormName}
                                        onChange={(e) => setPresetFormName(e.target.value)}
                                        placeholder="Ej: Poker"
                                        autoFocus
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('objective')} (Pts)</label>
                                    <input 
                                        type="number"
                                        value={presetFormTarget}
                                        onChange={(e) => setPresetFormTarget(e.target.value)}
                                        placeholder={t('targetScorePlaceholder')}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('maxTurnsLabel')}</label>
                                    <input 
                                        type="number"
                                        value={presetFormMaxTurns}
                                        onChange={(e) => setPresetFormMaxTurns(e.target.value)}
                                        placeholder="∞"
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('howManyPlayers')}</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {[2,3,4,5,6].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setPresetPlayerCount(num)}
                                            className={`py-2 rounded-lg font-bold text-sm border transition-colors ${presetPlayerCount === num ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setPresetPlayerCount(c => c < 6 ? 7 : c + 1)}
                                        className={`flex items-center justify-center font-bold text-sm border rounded-lg transition-colors ${presetPlayerCount > 6 ? 'bg-indigo-600 border-indigo-600 text-white' : 'text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        {presetPlayerCount > 6 ? presetPlayerCount : '+'}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('player')}s (Comma sep)</label>
                                <input 
                                    type="text"
                                    value={presetPlayerNames}
                                    onChange={(e) => setPresetPlayerNames(e.target.value)}
                                    placeholder="Juan, Maria, Pedro..."
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                />
                            </div>

                            <Button fullWidth onClick={handleSavePresetForm} disabled={!presetFormName.trim()} className="mt-2">
                                {t('save')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2 pb-2">
                            {gamePresets.filter(p => libraryFilter === 'ALL' || p.category === libraryFilter).length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-600 italic text-sm">
                                    {t('noPresets')}
                                </div>
                            ) : (
                                gamePresets
                                .filter(p => libraryFilter === 'ALL' || p.category === libraryFilter)
                                .map(preset => (
                                    <div 
                                        key={preset.id}
                                        onClick={() => handleLoadPreset(preset)}
                                        className="group w-full bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md ${preset.category === 'CARD' ? 'bg-pink-500' : preset.category === 'BOARD' ? 'bg-indigo-500' : 'bg-orange-500'}`}>
                                                {preset.category === 'CARD' && <CreditCard size={18} />}
                                                {preset.category === 'BOARD' && <Dices size={18} />}
                                                {preset.category === 'OTHER' && <Box size={18} />}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900 dark:text-white text-sm">{preset.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span className="flex items-center gap-0.5"><Users size={10} /> {preset.defaultPlayerCount || 3}</span>
                                                    {preset.defaultTargetScore && <span className="flex items-center gap-0.5"><Trophy size={10} /> {preset.defaultTargetScore}</span>}
                                                    {preset.defaultMaxTurns && <span className="flex items-center gap-0.5"><Hourglass size={10} /> {preset.defaultMaxTurns}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button 
                                                onClick={(e) => handleEditPreset(preset, e)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                                             >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeletePreset(preset.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                                             >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderListScreen = () => (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-4 z-10">
            <div className="flex justify-between items-center mb-4 gap-2">
                <button onClick={requestFullReset} className="text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
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
                        onClick={() => {
                            setIsExtrasOpen(true);
                            setActiveTool('MENU');
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full"
                        title={t('extras')}
                    >
                        <Zap size={24} />
                    </button>
                    <button 
                        onClick={() => setIsReordering(!isReordering)}
                        className={`text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full ${isReordering ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                        title={t('reorder')}
                    >
                        <ArrowUpDown size={24} />
                    </button>
                    <button onClick={handleShareGame} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full">
                        <Share2 size={24} />
                    </button>
                    <button onClick={openAddPlayerDialog} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full">
                        <UserPlus size={24} />
                    </button>
                </div>
            </div>
            
            {/* Top Leaderboard Summary */}
            <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x">
                {[...players].sort((a,b) => b.totalScore - a.totalScore).map((p, i) => (
                    <div key={p.id} className="flex flex-col items-center min-w-[60px] snap-start">
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md mb-1 ${p.color}`}>
                            {i === 0 && <Crown size={14} className="absolute -top-1 -right-1 text-yellow-300 fill-yellow-300" />}
                            {getPlayerInitials(p.name)}
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{p.totalScore}</span>
                    </div>
                ))}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {players.map((player, index) => (
                <div 
                    key={player.id}
                    onClick={() => !isReordering && selectPlayer(player.id)}
                    className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-[0.98] transition-all relative overflow-hidden group ${isReordering ? 'cursor-default' : 'cursor-pointer'} ${getActivePlayerId() === player.id && !isReordering ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                     {/* Color indicator bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${player.color}`}></div>

                    <div className="flex items-center gap-4 pl-2 overflow-hidden flex-1">
                        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ${player.color}`}>
                            {getPlayerInitials(player.name)}
                            {getActivePlayerId() === player.id && !isReordering && (
                                <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                                    <Play size={14} className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{player.name}</h3>
                                {/* Edit Button integrated here to avoid overlap */}
                                {!isReordering && (
                                    <button 
                                        onClick={(e) => openEditPlayerDialog(player, e)}
                                        className="p-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                )}
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
                    
                    {isReordering ? (
                         <div className="flex items-center gap-2 shrink-0 pl-2" onClick={e => e.stopPropagation()}>
                             {/* Locking logic: If who starts was used, index 0 is locked. */}
                             {hasUsedWhoStarts && index === 0 && (
                                 <Lock size={16} className="text-gray-400 mr-2" />
                             )}
                             <button 
                                onClick={() => movePlayer(index, 'up')}
                                disabled={index === 0 || (hasUsedWhoStarts && index === 1)} // Cannot move up if top, or if second and top is locked
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-30 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                             >
                                 <ArrowUp size={20} />
                             </button>
                             <button 
                                onClick={() => movePlayer(index, 'down')}
                                disabled={index === players.length - 1 || (hasUsedWhoStarts && index === 0)} // Cannot move down if last, or if top and locked
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-30 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                             >
                                 <ArrowDown size={20} />
                             </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 shrink-0 pl-2">
                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
                                {player.totalScore}
                            </div>
                            <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 rtl:rotate-180" />
                        </div>
                    )}
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
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-8 shadow-lg z-20 space-y-3">
             <div className="grid grid-cols-2 gap-3">
                 {players.some(p => p.history.length > 0) ? (
                     <button 
                        onClick={requestResetGame}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                     >
                         <RotateCcw size={18} /> {t('resetScores')}
                     </button>
                 ) : (
                     <button 
                        onClick={() => {
                            if (hasUsedWhoStarts) return;
                            setIsExtrasOpen(true);
                            setActiveTool('PICKER');
                            setPickerDone(false);
                            setPickerId(null);
                        }}
                        disabled={hasUsedWhoStarts}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${hasUsedWhoStarts ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-60' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                     >
                         <Users size={18} /> {t('whoStarts')}
                     </button>
                 )}
                 <button 
                    onClick={handleSaveGame}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-colors"
                 >
                     <Save size={18} /> {t('game')}
                 </button>
             </div>
             {/* Start / End Game Button Logic */}
             <button 
                onClick={() => {
                     const hasGameStarted = players.some(p => p.history.length > 0);
                     if (hasGameStarted) {
                         handleEndGame();
                     } else {
                         if (players.length > 0) {
                             selectPlayer(players[0].id);
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

  const renderScoringScreen = () => {
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) return null;

    const textColorClass = TEXT_COLORS[player.color] || 'text-gray-900 dark:text-white';
    
    // Check if it is this player's turn
    const activePlayerId = getActivePlayerId();
    const isTurn = activePlayerId === player.id;
    const activePlayer = players.find(p => p.id === activePlayerId);

    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm shrink-0 z-10">
          <button onClick={() => setView('LIST')} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 shrink-0">
            <ArrowLeft size={24} className="rtl:rotate-180" />
          </button>
          
          <div className="flex items-center gap-4 min-w-0 flex-1 justify-center">
              <button onClick={() => navigatePlayer('prev')} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                  <ChevronLeft size={24} className="rtl:rotate-180" />
              </button>
              <div className="flex flex-col items-center min-w-0">
                 <span className="text-xs uppercase font-bold text-gray-400 tracking-wider whitespace-nowrap">{t('turnOf')}</span>
                 <h2 className={`text-xl font-black ${textColorClass} truncate max-w-[150px]`}>{player.name}</h2>
              </div>
              <button onClick={() => navigatePlayer('next')} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
                  <ChevronRight size={24} className="rtl:rotate-180" />
              </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => { setIsExtrasOpen(true); setActiveTool('MENU'); }} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                 <Zap size={24} />
            </button>
            <button onClick={() => setIsPlayerHistoryOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <FileSearch size={24} />
            </button>
          </div>
        </div>
        
        {/* Horizontal Player Scores */}
        <div 
            ref={scoringPlayerScrollRef}
            className="flex gap-3 overflow-x-auto py-3 px-4 shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 scrollbar-hide snap-x"
        >
            {[...players].sort((a,b) => b.totalScore - a.totalScore).map(p => (
                <div 
                    key={p.id} 
                    id={`score-player-${p.id}`}
                    onClick={() => selectPlayer(p.id)}
                    className={`flex flex-col items-center min-w-[60px] cursor-pointer snap-start transition-all duration-200 ${p.id === selectedPlayerId ? 'scale-110 opacity-100' : 'opacity-60 grayscale scale-95'}`}
                >
                    <div className={`w-12 h-12 rounded-full ${p.color} flex items-center justify-center text-white text-lg font-bold shadow-sm mb-1 ring-2 ${p.id === selectedPlayerId ? 'ring-gray-900 dark:ring-white' : 'ring-transparent'}`}>
                        {getPlayerInitials(p.name)}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {p.totalScore}
                    </span>
                </div>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col p-4 pb-safe relative">
            
            {/* Warning Overlay if not turn */}
            {!isTurn && (
                <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-2 px-4">
                    <button 
                        onClick={() => activePlayer && selectPlayer(activePlayer.id)}
                        className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 fade-in transition-transform active:scale-95 cursor-pointer"
                    >
                        <Lock size={14} /> 
                        <span>{t('notYourTurn')}</span>
                        {activePlayer && <span className="opacity-80 font-normal">- {t('turnOfPlayer')} {activePlayer.name}</span>}
                    </button>
                </div>
            )}
            
            {/* Combined Total and Input Display */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4 flex items-center justify-between relative overflow-hidden shrink-0 ${!isTurn ? 'opacity-50' : ''}`}>
                 {/* Progress Bar Background */}
                 {settings.targetScore && (
                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
                        <div 
                            className={`h-full ${player.color} transition-all duration-500`}
                            style={{ width: `${Math.min(100, ((player.totalScore + currentTurnScore) / settings.targetScore) * 100)}%` }}
                        ></div>
                     </div>
                 )}

                 {/* Left: Total */}
                 <div className="flex-1 text-center">
                     <span className="text-xs uppercase text-gray-400 font-bold mb-1 block">{t('total')}</span>
                     <div className={`text-4xl font-black ${textColorClass}`}>
                         {player.totalScore + currentTurnScore}
                     </div>
                 </div>

                 {/* Divider */}
                 <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 mx-4"></div>

                 {/* Right: Add (Input) */}
                 <div className="flex-1 text-center">
                     <span className="text-xs uppercase text-gray-400 font-bold mb-1 block">{t('points')}</span>
                     <div className={`text-4xl font-black ${currentTurnScore === 0 ? 'text-gray-300 dark:text-gray-600' : (currentTurnScore > 0 ? 'text-green-500' : 'text-red-500')}`}>
                        {currentTurnScore > 0 ? '+' : ''}{currentTurnScore}
                     </div>
                 </div>
            </div>

            {/* Spacer to push controls to bottom if screen is tall */}
            <div className="flex-1"></div>

            {/* Quick Add Buttons */}
            <div className={`grid grid-cols-4 gap-2 mb-2 shrink-0 ${!isTurn ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                {[1, 5, 10, 50].map(amt => (
                    <button
                        key={amt}
                        onClick={() => handleQuickAdd(amt)}
                        className="py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black text-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
                    >
                        +{amt}
                    </button>
                ))}
            </div>
            <div className={`grid grid-cols-4 gap-2 mb-4 shrink-0 ${!isTurn ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                {[-1, -5, -10, -50].map(amt => (
                    <button
                        key={amt}
                        onClick={() => handleQuickAdd(amt)}
                        className="py-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 font-black text-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                    >
                        {amt}
                    </button>
                ))}
            </div>

            {/* Keypad Section */}
            <div className={`mb-4 shrink-0 ${!isTurn ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                <Keypad 
                    onKeyPress={handleKeypadPress}
                    onDelete={handleKeypadDelete}
                    onClear={() => setCurrentTurnScore(0)}
                />
            </div>

            <Button 
                fullWidth 
                variant={currentTurnScore === 0 ? "secondary" : "primary"}
                onClick={currentTurnScore === 0 ? () => setConfirmationState({ isOpen: true, type: 'PASS_TURN' }) : commitTurn}
                disabled={!isTurn}
                className={`py-4 text-lg shadow-xl shrink-0 ${currentTurnScore === 0 ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : 'shadow-indigo-500/30 animate-pulse'} ${!isTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                 {currentTurnScore === 0 ? t('passTurn') : t('applyAndNext')}
            </Button>
        </div>
      </div>
    );
  };

  const renderVictoryScreen = () => {
    const winner = winnerId ? players.find(p => p.id === winnerId) : null;
    const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
    
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-900 text-white relative overflow-hidden animate-in fade-in duration-500">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/50 via-gray-900 to-black pointer-events-none"></div>
             
             {/* Content */}
             <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm flex-1 overflow-y-auto py-8 scrollbar-hide">
                 <div className="mb-8 relative shrink-0">
                     <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
                     <Trophy size={80} className="text-yellow-400 relative z-10 animate-bounce" />
                     <Crown size={40} className="text-yellow-200 absolute -top-6 -right-2 rotate-12 z-20" />
                 </div>

                 <h2 className="text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 text-sm">{t('winner')}</h2>
                 
                 {winner && (
                     <div className="mb-8 animate-in zoom-in slide-in-from-bottom-8 duration-700 shrink-0">
                         <h1 className={`text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-sm`}>
                             {winner.name}
                         </h1>
                         <div className="inline-block bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">
                             <span className="text-3xl font-bold">{winner.totalScore}</span> <span className="text-sm opacity-70">PTS</span>
                         </div>
                     </div>
                 )}
                 
                 {/* Leaderboard */}
                 <div className="w-full bg-white/5 rounded-2xl p-4 mb-8 border border-white/10 backdrop-blur-sm animate-in slide-in-from-bottom-12 duration-1000">
                     {sortedPlayers.map((p, i) => (
                         <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                             <div className="flex items-center gap-3">
                                 <span className="font-mono text-gray-500 text-sm font-bold w-4">{i + 1}.</span>
                                 <div className={`w-6 h-6 rounded-full ${p.color}`}></div>
                                 <span className={`font-bold ${p.id === winnerId ? 'text-yellow-400' : 'text-gray-300'}`}>{p.name}</span>
                             </div>
                             <span className="font-bold font-mono">{p.totalScore}</span>
                         </div>
                     ))}
                 </div>

                 <div className="w-full space-y-3 mt-auto shrink-0">
                     <Button fullWidth onClick={handleShareGame} className="bg-green-600 hover:bg-green-500 text-white border-0 shadow-lg shadow-green-500/20">
                         <Share2 size={18} /> {t('share')}
                     </Button>
                     <Button fullWidth variant="primary" onClick={() => setView('LIST')}>
                         {t('continuePlaying')}
                     </Button>
                     <Button fullWidth variant="secondary" onClick={requestResetGame} className="bg-white/10 hover:bg-white/20 text-white border-0">
                         {t('newGameSame')}
                     </Button>
                     <Button fullWidth variant="ghost" onClick={requestFullReset} className="text-gray-500 hover:text-white hover:bg-transparent">
                         {t('backToStart')}
                     </Button>
                 </div>
             </div>
        </div>
    );
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white select-none relative">
       {/* Splash Screen Overlay */}
       {renderSplashScreen()}

       {/* Main App */}
       {view === 'START' && renderStartScreen()}
       {view === 'LIST' && renderListScreen()}
       {view === 'SCORING' && renderScoringScreen()}
       {view === 'VICTORY' && renderVictoryScreen()}

       {renderPlayerDialog()}
       {renderExtrasModal()}
       <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} t={t} />
       {renderConfirmationModal()}
       {renderPlayerHistoryModal()}
       {renderSetupWizard()}

       {/* Toast */}
       {showSaveNotification && (
           <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 font-bold flex items-center gap-2">
               <CheckCircle2 size={20} className="text-green-500" />
               {toastMessage || t('gameSaved')}
           </div>
       )}
    </div>
  );
}
