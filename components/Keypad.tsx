import React from 'react';
import { Delete } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({ 
  onKeyPress, 
  onDelete, 
  onClear,
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+/-', '0'];
  
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = React.useRef(false);

  const handleStart = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onClear();
    }, 600);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (!isLongPress.current) {
      onDelete();
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKeyPress(k)}
          className="h-11 sm:h-14 rounded-lg bg-white dark:bg-gray-800 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-700 active:scale-95 transition-all"
        >
          {k}
        </button>
      ))}
      <button
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onClick={handleClick}
        className="h-11 sm:h-14 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 dark:text-red-400 flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-700 active:scale-95 transition-all shadow-sm"
      >
        <Delete size={24} />
      </button>
    </div>
  );
};