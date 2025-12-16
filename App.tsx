import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Player, ViewState, Turn, GameSettings, SavedGame, GamePreset, PresetCategory } from './types';
import { AboutModal } from './components/AboutModal';
import { Language, LANGUAGES, TRANSLATIONS } from './translations';

// Components
import { SplashScreen } from './components/SplashScreen';
import { ConfirmationModal } from './components/ConfirmationModal';
import { PlayerHistoryModal } from './components/PlayerHistoryModal';
import { ExtrasModal } from './components/ExtrasModal';
import { PlayerDialog } from './components/PlayerDialog';
import { SetupWizard } from './components/SetupWizard';
import { StartScreen } from './components/StartScreen';
import { ListScreen } from './components/ListScreen';
import { ScoringScreen } from './components/ScoringScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { QuickGameScreen } from './components/QuickGameScreen';

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
  const [activeTool, setActiveTool] = useState<'MENU' | 'DICE' | 'TIMER' | 'PICKER' | 'CHESS' | 'COIN' | 'FINGER'>('MENU');
  
  // Tool States
  const [diceSides, setDiceSides] = useState(6);
  const [diceCount, setDiceCount] = useState(1);
  const [diceResults, setDiceResults] = useState<number[]>([6]);
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
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Suspended Chess State
  const [suspendedChessState, setSuspendedChessState] = useState<Record<string, any>>(() => {
      try {
        const saved = localStorage.getItem('sm_suspended_chess');
        if (!saved) return {};
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.time1 === 'number') {
            return {}; 
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

  // Translation Helper
  const t = (key: keyof typeof TRANSLATIONS['es']) => {
    // @ts-ignore
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['es'][key] || key;
  };

  // Hardware Back Button Handling for Android
  useEffect(() => {
    let backButtonListener: any;
    
    // Check if we are running in a Capacitor Native environment
    if ((window as any).Capacitor?.isNative) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // Priority 1: Close Modals and Overlays
        if (isExtrasOpen) { setIsExtrasOpen(false); return; }
        if (isAboutOpen) { setIsAboutOpen(false); return; }
        if (isPlayerHistoryOpen) { setIsPlayerHistoryOpen(false); return; }
        if (setupWizard) { setSetupWizard(null); return; }
        if (isPresetsOpen) { setIsPresetsOpen(false); return; }
        if (isLangMenuOpen) { setIsLangMenuOpen(false); return; }
        
        // Handle Dialogs (standard HTML dialog)
        const openDialog = document.querySelector('dialog[open]');
        if (openDialog) {
             (openDialog as HTMLDialogElement).close();
             return;
        }

        // Priority 2: Navigation Logic
        if (view === 'SCORING') { setView('LIST'); return; }
        if (view === 'VICTORY') { setView('LIST'); return; }
        if (view === 'QUICK_GAME') { setView('START'); return; }
        
        if (view === 'LIST') { 
            // Return to start if in list view
            setView('START'); 
            return; 
        }

        // Priority 3: Exit App (Only on Start Screen)
        if (view === 'START') {
             CapacitorApp.exitApp();
        }
      }).then(listener => {
          backButtonListener = listener;
      });
    }

    return () => {
        if (backButtonListener) {
            backButtonListener.remove();
        }
    };
  }, [
    isExtrasOpen, isAboutOpen, isPlayerHistoryOpen, setupWizard, isPresetsOpen, isLangMenuOpen,
    view
  ]);

  // Helper to determine active player ID based on history length (Deterministic)
  const getActivePlayerId = () => {
      if (players.length === 0) return null;
      const totalTurns = players.reduce((sum, p) => sum + p.history.length, 0);
      return players[totalTurns % players.length].id;
  };

  const getPlayerInitials = (name: string) => {
      const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
      if (parts.length === 0) return '?';
      if (parts.length >= 3) {
          return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
      }
      const lastPart = parts[parts.length - 1];
      if (parts.length > 1 && /^\d+$/.test(lastPart)) {
          return (parts[0][0] + lastPart).toUpperCase().slice(0, 3);
      }
      if (parts.length === 2) {
           return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 3).toUpperCase();
  };

  const generateRandomColor = () => {
      return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  const triggerToast = (msg: string) => {
      setToastMessage(msg);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2500);
  };
  
  // Audio Helper to reuse context
  const getAudioContext = () => {
      if (!audioCtxRef.current) {
          const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtor) {
              audioCtxRef.current = new AudioCtor();
          }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
  };

  const playAlarm = () => {
      try {
          const ctx = getAudioContext();
          if (!ctx) return;
          
          const now = ctx.currentTime;
          
          // Double Beep
          [0, 0.4].forEach(offset => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, now + offset); // A5
              
              gain.gain.setValueAtTime(0.3, now + offset);
              gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.3);
              
              osc.start(now + offset);
              osc.stop(now + offset + 0.35);
          });
      } catch (e) {
          console.error("Audio playback error", e);
      }
  };

  const playVictorySound = () => {
      try {
          const ctx = getAudioContext();
          if (!ctx) return;
          
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
          const ctx = getAudioContext();
          if (!ctx) return;
          
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          // Lower pitched "woodblock" style sound for chess clock
          // 400Hz to 200Hz sweep is more pleasant than 800Hz
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
          
          // Shorter, snappier envelope
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          
          osc.start(now);
          osc.stop(now + 0.1);
      } catch (e) {
          console.error("Audio playback error", e);
      }
  };

  // Splash Screen Effect
  useEffect(() => {
    if (showSplash) {
        const timer = setTimeout(() => {
            handleDismissSplash();
        }, 3500);
        return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const handleDismissSplash = () => {
      if (splashFading) return;
      setSplashFading(true);
      if (dontShowSplashRef.current) {
          localStorage.setItem('sm_skip_splash', 'true');
      }
      setTimeout(() => {
          setShowSplash(false);
          setSplashFading(false);
      }, 500); 
  };

  const toggleDontShowSplash = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !dontShowSplashAgain;
    setDontShowSplashAgain(newValue);
    dontShowSplashRef.current = newValue; 
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
  }, [isTimerActive]); 

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
            maxTurns: (maxTurnsVal !== null && maxTurnsVal > 0) ? maxTurnsVal : null 
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

  const prevWizardStep = () => {
    if (!setupWizard) return;

    if (setupWizard.current > 0) {
        const prevIndex = setupWizard.current - 1;
        const prevPlayer = setupWizard.tempPlayers[prevIndex];
        const updatedTempPlayers = setupWizard.tempPlayers.slice(0, prevIndex);

        setSetupWizard({
            ...setupWizard,
            current: prevIndex,
            tempPlayers: updatedTempPlayers
        });

        const defaultNamePrefix = t('player');
        setWizardPlayerName(prevPlayer.name.startsWith(defaultNamePrefix) ? '' : prevPlayer.name);
        setWizardPlayerColor(prevPlayer.color);
    } else {
        setSetupWizard({
            ...setupWizard,
            step: 'COUNT'
        });
        setWizardPlayerName('');
    }
  };

  const finishWizardEarly = () => {
    if (!setupWizard) return;

    const finalName = wizardPlayerName.trim() || `${t('player')} ${setupWizard.current + 1}`;
    
    const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: finalName,
        totalScore: 0,
        history: [],
        color: wizardPlayerColor
    };

    const finalPlayers = [...setupWizard.tempPlayers, newPlayer];
    
    setPlayers(finalPlayers);
    setGameName(tempGameName.trim());
    const maxTurnsVal = tempMaxTurns ? parseInt(tempMaxTurns) : null;
    setSettings({ 
        targetScore: tempTargetScore ? parseInt(tempTargetScore) : null,
        maxTurns: (maxTurnsVal !== null && maxTurnsVal > 0) ? maxTurnsVal : null
    });
    setView('LIST');
    setSetupWizard(null);
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
            maxTurns: (maxTurnsVal !== null && maxTurnsVal > 0) ? maxTurnsVal : null 
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
          
          const nextIndex = setupWizard.current + 1;
          if (nextIndex < PREDEFINED_COLORS.length) {
              setWizardPlayerColor(PREDEFINED_COLORS[nextIndex]);
          } else {
              let newColor = generateRandomColor();
              while (updatedPlayers.some(p => p.color === newColor)) {
                  newColor = generateRandomColor();
              }
              setWizardPlayerColor(newColor);
          }
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

    if (settings.targetScore !== null) {
      if (newScore >= settings.targetScore) {
        setWinnerId(selectedPlayerId);
        setView('VICTORY');
        return;
      }
    }
    
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

        const nextIndex = (playerIndex + 1) % updatedPlayers.length;
        setSelectedPlayerId(updatedPlayers[nextIndex].id);
        setCurrentTurnScore(0);
        setCurrentTurnSource('MANUAL');
    }
    setConfirmationState({ isOpen: false, type: null, payload: undefined });
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    if (hasUsedWhoStarts) {
        if (index === 0 && direction === 'down') return; 
        if (index === 1 && direction === 'up') return; 
    }

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === players.length - 1) return;

    const newPlayers = [...players];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newPlayers[index], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[index]];
    setPlayers(newPlayers);
  };

  const handleReorderPlayers = (newPlayers: Player[]) => {
      setPlayers(newPlayers);
  };

  const handleRollDice = () => {
    setIsRolling(true);
    const duration = 1000;
    const interval = setInterval(() => {
       setDiceResults(Array.from({length: diceCount}, () => Math.floor(Math.random() * diceSides) + 1));
    }, 100);
    setTimeout(() => {
       clearInterval(interval);
       setIsRolling(false);
       setDiceResults(Array.from({length: diceCount}, () => Math.floor(Math.random() * diceSides) + 1));
    }, duration);
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
      setChessTurnStartTime(t1); 
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
      setIsChessResumed(false); 
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
      setIsChessResumed(true); 
  };

  const handleChessTap = (player: 1 | 2) => {
      if (chessGameState === 'FINISHED') return;
      
      if (chessGameState === 'READY') {
          playClickSound();
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

      if (chessActive === player) {
          playClickSound();
          if (chessModeType === 'FISCHER') {
              if (chessTurnCount >= chessConfig.incStart) {
                  if (player === 1) setChessTime1(t => t + chessConfig.inc);
                  else setChessTime2(t => t + chessConfig.inc);
              }
          } else if (chessModeType === 'BRONSTEIN') {
               const currentRemaining = player === 1 ? chessTime1 : chessTime2;
               const usedTime = chessTurnStartTime - currentRemaining;
               const bonus = Math.min(usedTime, chessConfig.inc);
               
               if (player === 1) setChessTime1(t => t + bonus);
               else setChessTime2(t => t + bonus);
          } else if (chessModeType === 'GONG') {
               if (player === 1) setChessTime1(chessConfig.gong);
               else setChessTime2(chessConfig.gong);
          }

          const nextPlayer = player === 1 ? 2 : 1;
          setChessActive(nextPlayer);
          setChessTurnCount(c => c + 1);
          setChessTurnStartTime(player === 1 ? chessTime2 : chessTime1);
      }
  };

  const handleChessExitRequest = () => {
      if ((chessGameState === 'PLAYING' || chessGameState === 'PAUSED') && activeTool === 'CHESS') {
          setConfirmationState({ isOpen: true, type: 'EXIT_CHESS' });
      } else {
          if (activeTool === 'CHESS' && chessGameState !== 'SETUP') {
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

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden font-sans select-none fixed inset-0">
      <SplashScreen 
        showSplash={showSplash}
        splashFading={splashFading}
        dontShowSplashAgain={dontShowSplashAgain}
        onDismiss={handleDismissSplash}
        onToggleDontShow={toggleDontShowSplash}
      />
      
      <ConfirmationModal 
        isOpen={confirmationState.isOpen}
        type={confirmationState.type}
        onClose={() => setConfirmationState({ isOpen: false, type: null })}
        onConfirm={executeConfirmation}
        t={t as any}
      />

      <PlayerHistoryModal 
        isOpen={isPlayerHistoryOpen}
        player={players.find(p => p.id === selectedPlayerId)}
        onClose={() => setIsPlayerHistoryOpen(false)}
        onNavigate={navigatePlayer}
        getPlayerInitials={getPlayerInitials}
        t={t as any}
      />

      <ExtrasModal 
        isOpen={isExtrasOpen}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onClose={() => setIsExtrasOpen(false)}
        t={t as any}
        diceSides={diceSides} setDiceSides={setDiceSides} 
        diceCount={diceCount} setDiceCount={setDiceCount}
        diceResults={diceResults} isRolling={isRolling} onRollDice={handleRollDice}
        coinResult={coinResult} isFlipping={isFlipping} onFlipCoin={handleFlipCoin}
        timerLeft={timerLeft} setTimerLeft={setTimerLeft} isTimerActive={isTimerActive} setIsTimerActive={setIsTimerActive} timerStartValue={timerStartValue} setTimerStartValue={setTimerStartValue} formatTime={formatTime}
        players={players} pickerId={pickerId} isPicking={isPicking} pickerDone={pickerDone} onPickPlayer={handlePickPlayer} getPlayerInitials={getPlayerInitials} hasUsedWhoStarts={hasUsedWhoStarts} view={view}
        chessModeType={chessModeType} setChessModeType={setChessModeType} chessGameState={chessGameState} setChessGameState={setChessGameState} chessConfig={chessConfig} setChessConfig={setChessConfig}
        chessTime1={chessTime1} setChessTime1={setChessTime1} chessTime2={chessTime2} setChessTime2={setChessTime2} chessActive={chessActive} chessTurnCount={chessTurnCount} suspendedChessState={suspendedChessState}
        onStartChessGameRequest={startChessGameRequest} onResumeChessGame={resumeChessGame} onRequestSaveChessGame={requestSaveChessGame} handleChessTap={handleChessTap} handleChessExitRequest={handleChessExitRequest}
      />

      <PlayerDialog 
        dialogId="add-player-dialog"
        isEditing={!!editingPlayerId}
        name={newPlayerName} setName={setNewPlayerName}
        color={newPlayerColor} setColor={setNewPlayerColor}
        playersCount={players.length}
        predefinedColors={PREDEFINED_COLORS}
        isColorTaken={isColorTaken}
        onSave={handleSavePlayer}
        onDelete={() => editingPlayerId && deletePlayer(editingPlayerId)}
        onClose={() => (document.getElementById('add-player-dialog') as HTMLDialogElement)?.close()}
        t={t as any}
      />
      
      {setupWizard ? (
        <SetupWizard 
          setupWizard={setupWizard}
          customPlayerCount={customPlayerCount} setCustomPlayerCount={setCustomPlayerCount}
          showCustomCountInput={showCustomCountInput} setShowCustomCountInput={setShowCustomCountInput}
          onInitWizardPlayers={initWizardPlayers}
          onCancel={() => setSetupWizard(null)}
          wizardPlayerName={wizardPlayerName} setWizardPlayerName={setWizardPlayerName}
          wizardPlayerColor={wizardPlayerColor} setWizardPlayerColor={setWizardPlayerColor}
          onNextStep={nextWizardStep}
          onPrevStep={prevWizardStep}
          onFinishEarly={finishWizardEarly}
          predefinedColors={PREDEFINED_COLORS}
          t={t as any}
        />
      ) : (
          view === 'START' ? (
            <StartScreen 
              onOpenAbout={() => setIsAboutOpen(true)}
              onOpenExtras={() => { setIsExtrasOpen(true); setActiveTool('MENU'); }}
              language={language} setLanguage={setLanguage} isLangMenuOpen={isLangMenuOpen} setIsLangMenuOpen={setIsLangMenuOpen}
              tempGameName={tempGameName} setTempGameName={setTempGameName} gameNameError={gameNameError} setGameNameError={setGameNameError}
              tempTargetScore={tempTargetScore} setTempTargetScore={setTempTargetScore} tempMaxTurns={tempMaxTurns} setTempMaxTurns={setTempMaxTurns}
              players={players} onStartGame={startGame} onSavePreset={handleSavePreset}
              savedGames={savedGames} onLoadGame={requestLoadGame} onDeleteSave={handleDeleteSave}
              isPresetsOpen={isPresetsOpen} setIsPresetsOpen={setIsPresetsOpen}
              isCreatingPreset={isCreatingPreset} setIsCreatingPreset={setIsCreatingPreset}
              libraryFilter={libraryFilter} setLibraryFilter={setLibraryFilter}
              presetModalProps={{
                editingPresetId, setEditingPresetId,
                formName: presetFormName, setFormName: setPresetFormName,
                formTarget: presetFormTarget, setFormTarget: setPresetFormTarget,
                formMaxTurns: presetFormMaxTurns, setFormMaxTurns: setPresetFormMaxTurns,
                formCategory: presetFormCategory, setFormCategory: setPresetFormCategory,
                formPlayerCount: presetPlayerCount, setFormPlayerCount: setPresetPlayerCount,
                formPlayerNames: presetPlayerNames, setFormPlayerNames: setPresetPlayerNames,
                onSaveForm: handleSavePresetForm,
                presets: gamePresets, onLoadPreset: handleLoadPreset, onEditPreset: handleEditPreset, onDeletePreset: handleDeletePreset
              }}
              t={t as any}
              onQuickGame={() => setView('QUICK_GAME')}
            />
          ) :
          view === 'SCORING' ? (
            <ScoringScreen 
              selectedPlayerId={selectedPlayerId}
              players={players}
              activePlayerId={getActivePlayerId()}
              currentTurnScore={currentTurnScore}
              settings={settings}
              onBackToList={() => setView('LIST')}
              onNavigatePlayer={navigatePlayer}
              onOpenExtras={() => { setIsExtrasOpen(true); setActiveTool('MENU'); }}
              onOpenHistory={() => setIsPlayerHistoryOpen(true)}
              onSelectPlayer={selectPlayer}
              onQuickAdd={handleQuickAdd}
              onKeypadPress={handleKeypadPress}
              onKeypadDelete={handleKeypadDelete}
              onKeypadClear={() => setCurrentTurnScore(0)}
              onCommitTurn={commitTurn}
              onPassTurnRequest={() => setConfirmationState({ isOpen: true, type: 'PASS_TURN' })}
              t={t as any}
              getPlayerInitials={getPlayerInitials}
              textColors={TEXT_COLORS}
            />
          ) :
          view === 'VICTORY' ? (
            <VictoryScreen 
              winnerId={winnerId}
              players={players}
              onShare={handleShareGame}
              onResetGame={() => { setWinnerId(null); setView('LIST'); }}
              onRequestResetGame={requestResetGame}
              onRequestFullReset={requestFullReset}
              t={t as any}
            />
          ) :
          view === 'QUICK_GAME' ? (
              <QuickGameScreen 
                onBack={() => setView('START')}
                t={t as any}
                predefinedColors={PREDEFINED_COLORS}
              />
          ) : (
            <ListScreen 
              gameName={gameName}
              players={players}
              settings={settings}
              isReordering={isReordering}
              setIsReordering={setIsReordering}
              hasUsedWhoStarts={hasUsedWhoStarts}
              onBackToStart={requestFullReset}
              onOpenExtras={() => { setIsExtrasOpen(true); setActiveTool('MENU'); }}
              onShare={handleShareGame}
              onAddPlayer={openAddPlayerDialog}
              onSelectPlayer={(id) => !isReordering && selectPlayer(id)}
              onEditPlayer={openEditPlayerDialog}
              onMovePlayer={movePlayer}
              onReorderPlayers={handleReorderPlayers}
              onRequestResetGame={requestResetGame}
              onOpenPicker={() => {
                  if (hasUsedWhoStarts) return;
                  setIsExtrasOpen(true);
                  setActiveTool('PICKER');
                  setPickerDone(false);
                  setPickerId(null);
              }}
              onSaveGame={handleSaveGame}
              onEndGame={handleEndGame}
              t={t as any}
              getPlayerInitials={getPlayerInitials}
              getActivePlayerId={getActivePlayerId}
            />
          )
      )}
      
      {/* Toast Notification */}
      {showSaveNotification && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
               <div className="bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/10">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="font-bold text-sm">{toastMessage || t('gameSaved')}</span>
               </div>
          </div>
      )}

      {/* About Modal - casting t to any to avoid strict type mismatch with interface */}
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
        t={t as any} 
        onShowToast={triggerToast}
      />
    </div>
  );
}