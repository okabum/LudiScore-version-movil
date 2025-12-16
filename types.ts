
export interface Turn {
  id: string;
  amount: number;
  timestamp: number;
  source?: 'QUICK' | 'KEYPAD' | 'MANUAL';
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  history: Turn[];
  color: string;
}

export type ViewState = 'START' | 'LIST' | 'SCORING' | 'SETTINGS' | 'VICTORY' | 'QUICK_GAME';

export interface GameSettings {
  targetScore: number | null; // null means no limit
  maxTurns: number | null;
}

export interface SavedGame {
  id: string;
  name: string;
  date: number;
  players: Player[];
  settings: GameSettings;
}

export type PresetCategory = 'BOARD' | 'CARD' | 'OTHER';

export interface GamePreset {
  id: string;
  name: string;
  defaultTargetScore: number | null;
  defaultMaxTurns: number | null;
  defaultPlayerCount?: number;
  defaultPlayerNames?: string[];
  icon?: string;
  category: PresetCategory;
}