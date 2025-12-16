
import React, { useRef } from 'react';
import { ArrowLeft, LayoutTemplate, Plus, X, Dices, CreditCard, Box, Folder, Pencil, Trash2, Users, Trophy, Hourglass } from 'lucide-react';
import { Button } from './Button';
import { GamePreset, PresetCategory } from '../types';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  editingPresetId: string | null;
  setEditingPresetId: (id: string | null) => void;
  
  // Form State
  formName: string;
  setFormName: (val: string) => void;
  formTarget: string;
  setFormTarget: (val: string) => void;
  formMaxTurns: string;
  setFormMaxTurns: (val: string) => void;
  formCategory: PresetCategory;
  setFormCategory: (val: PresetCategory) => void;
  formPlayerCount: number;
  setFormPlayerCount: (val: React.SetStateAction<number>) => void;
  formPlayerNames: string;
  setFormPlayerNames: (val: string) => void;
  
  onSaveForm: () => void;
  
  // List State
  presets: GamePreset[];
  libraryFilter: PresetCategory | 'ALL';
  setLibraryFilter: (val: PresetCategory | 'ALL') => void;
  onLoadPreset: (preset: GamePreset) => void;
  onEditPreset: (preset: GamePreset, e: React.MouseEvent) => void;
  onDeletePreset: (id: string, e: React.MouseEvent) => void;
  
  t: (key: any) => string;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen, onClose, isCreating, setIsCreating, editingPresetId, setEditingPresetId,
  formName, setFormName, formTarget, setFormTarget, formMaxTurns, setFormMaxTurns,
  formCategory, setFormCategory, formPlayerCount, setFormPlayerCount, formPlayerNames, setFormPlayerNames,
  onSaveForm, presets, libraryFilter, setLibraryFilter, onLoadPreset, onEditPreset, onDeletePreset, t
}) => {
    const presetTargetRef = useRef<HTMLInputElement>(null);
    const presetMaxTurnsRef = useRef<HTMLInputElement>(null);
    const presetNamesRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const cyclePresetCategory = () => {
        if (formCategory === 'BOARD') setFormCategory('CARD');
        else if (formCategory === 'CARD') setFormCategory('OTHER');
        else setFormCategory('BOARD');
    };

    const getCategoryLabel = (cat: PresetCategory) => {
        switch(cat) {
            case 'BOARD': return t('boardGame');
            case 'CARD': return t('cardGame');
            case 'OTHER': return t('other');
            default: return t('other');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-5 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 h-auto max-h-[90dvh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-3 shrink-0 border-b border-gray-200 dark:border-gray-800 pb-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        {isCreating ? (
                            <button onClick={() => {
                                setIsCreating(false);
                                setEditingPresetId(null);
                            }} className="mr-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rtl:rotate-180">
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <LayoutTemplate size={20} />
                        )}
                        {isCreating ? (editingPresetId ? t('editGame') : t('newGame')) : t('library')}
                    </h3>
                    <div className="flex gap-2">
                        {!isCreating && (
                            <button 
                                onClick={() => {
                                    setFormName('');
                                    setFormTarget('');
                                    setFormMaxTurns('');
                                    setFormPlayerCount(3);
                                    setFormPlayerNames('');
                                    setFormCategory(libraryFilter === 'ALL' ? 'BOARD' : libraryFilter);
                                    setEditingPresetId(null);
                                    setIsCreating(true);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
                                title={t('add')}
                            >
                                <Plus size={20} />
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {!isCreating && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide shrink-0">
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
                {isCreating ? (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
                        
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{t('category')}</span>
                            <button 
                                onClick={cyclePresetCategory}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-700 dark:hover:text-white transition-colors"
                            >
                                <Folder size={14} className="text-yellow-500" />
                                {getCategoryLabel(formCategory)}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('gameNameLabel')}</label>
                                <input 
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Ej: Poker"
                                    autoFocus
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                    enterKeyHint="next"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            presetTargetRef.current?.focus();
                                        }
                                    }}
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('objective')} (Pts)</label>
                                <input 
                                    ref={presetTargetRef}
                                    type="number"
                                    value={formTarget}
                                    onChange={(e) => setFormTarget(e.target.value)}
                                    placeholder={t('targetScorePlaceholder')}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                    enterKeyHint="next"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            presetMaxTurnsRef.current?.focus();
                                        }
                                    }}
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('maxTurnsLabel')}</label>
                                <input 
                                    ref={presetMaxTurnsRef}
                                    type="number"
                                    value={formMaxTurns}
                                    onChange={(e) => setFormMaxTurns(e.target.value)}
                                    placeholder="∞"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                    enterKeyHint="next"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            presetNamesRef.current?.focus();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('howManyPlayers')}</label>
                            <div className="grid grid-cols-6 gap-2">
                                {[2,3,4,5,6].map(num => (
                                    <button 
                                        key={num}
                                        onClick={() => setFormPlayerCount(num)}
                                        className={`py-2 rounded-lg font-bold text-sm border transition-colors ${formPlayerCount === num ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setFormPlayerCount(c => c < 6 ? 7 : c + 1)}
                                    className={`flex items-center justify-center font-bold text-sm border rounded-lg transition-colors ${formPlayerCount > 6 ? 'bg-indigo-600 border-indigo-600 text-white' : 'text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    {formPlayerCount > 6 ? formPlayerCount : '+'}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('player')}s (Comma sep)</label>
                            <input 
                                ref={presetNamesRef}
                                type="text"
                                value={formPlayerNames}
                                onChange={(e) => setFormPlayerNames(e.target.value)}
                                placeholder="Juan, Maria, Pedro..."
                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm"
                                enterKeyHint="done"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        onSaveForm();
                                    }
                                }}
                            />
                        </div>

                        <Button fullWidth onClick={onSaveForm} disabled={!formName.trim()} className="mt-2">
                            {t('save')}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 pb-2">
                        {presets.filter(p => libraryFilter === 'ALL' || p.category === libraryFilter).length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-600 italic text-sm">
                                {t('noPresets')}
                            </div>
                        ) : (
                            presets
                            .filter(p => libraryFilter === 'ALL' || p.category === libraryFilter)
                            .map(preset => (
                                <div 
                                    key={preset.id}
                                    onClick={() => onLoadPreset(preset)}
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
                                            onClick={(e) => onEditPreset(preset, e)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                                            >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => onDeletePreset(preset.id, e)}
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
    );
};
