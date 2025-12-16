
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: 'RESET_SCORES' | 'RESET_ALL' | 'LOAD_GAME' | 'DELETE_PRESET' | 'DELETE_SAVE' | 'DELETE_PLAYER' | 'PASS_TURN' | 'EXIT_CHESS' | 'OVERWRITE_CHESS' | 'OVERWRITE_CHESS_START' | null;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: any) => string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-red-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto shrink-0">
              <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
              {type === 'EXIT_CHESS' ? t('confirmExitChess') : 
               type === 'OVERWRITE_CHESS' ? t('confirmOverwriteChess') : 
               type === 'OVERWRITE_CHESS_START' ? t('confirmOverwriteChessStart') : t('confirmTitle')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">
              {type === 'RESET_SCORES' && t('confirmResetScores')}
              {type === 'RESET_ALL' && t('confirmResetAll')}
              {type === 'LOAD_GAME' && t('confirmLoadGame')}
              {type === 'DELETE_PRESET' && t('confirmDeletePreset')}
              {type === 'DELETE_SAVE' && t('confirmDeleteSave')}
              {type === 'DELETE_PLAYER' && t('confirmDeletePlayer')}
              {type === 'PASS_TURN' && t('confirmPassTurn')}
              {type === 'EXIT_CHESS' && t('confirmExitChessDesc')}
              {type === 'OVERWRITE_CHESS' && t('confirmOverwriteChessDesc')}
              {type === 'OVERWRITE_CHESS_START' && t('confirmOverwriteChessStartDesc')}
          </p>
          <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>
                  {t('cancel')}
              </Button>
              <Button variant="danger" fullWidth onClick={onConfirm}>
                  {type === 'EXIT_CHESS' ? t('exitWithoutSaving') : 
                   type === 'OVERWRITE_CHESS' ? t('save') : 
                   type === 'OVERWRITE_CHESS_START' ? t('startAnyway') : t('accept')}
              </Button>
          </div>
      </div>
    </div>
  );
};
