import { useState, useMemo } from 'react';
import { X, Search, Volume2, Plus } from 'lucide-react';
import { SOUND_TYPES } from '../../constants/sounds';
import { SoundTagFilter } from './SoundTagFilter';
import type { CustomSoundMeta } from '../../types/customSound';
import type { useSoundTags } from '../../hooks/useSoundTags';

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSound: (soundId: string) => void;
  excludeSoundIds: string[];
  customSounds: CustomSoundMeta[];
  onAddCustomSound: () => void;
  soundTagState: ReturnType<typeof useSoundTags>;
}

export function SoundPickerModal({
  isOpen,
  onClose,
  onSelectSound,
  excludeSoundIds,
  customSounds,
  onAddCustomSound,
  soundTagState,
}: SoundPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const allSounds = useMemo(() => {
    const builtIn = SOUND_TYPES.map(s => ({
      id: s.id,
      label: s.label,
      icon: s.icon,
      isCustom: false,
    }));
    const custom = customSounds.map(s => ({
      id: s.id,
      label: s.label,
      icon: null as typeof builtIn[0]['icon'] | null,
      isCustom: true,
    }));
    return [...builtIn, ...custom];
  }, [customSounds]);

  const filteredSounds = useMemo(() => {
    let result = allSounds.filter(s => !excludeSoundIds.includes(s.id));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        const displayName = soundTagState.getDisplayName(s.id);
        const name = displayName || s.label;
        return name.toLowerCase().includes(q);
      });
    }

    if (soundTagState.filterTagIds.length > 0) {
      result = result.filter(s => soundTagState.soundPassesFilter(s.id));
    }

    return result;
  }, [allSounds, excludeSoundIds, searchQuery, soundTagState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-notion-bg rounded-xl border border-notion-border shadow-xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-notion-text">Select Sound</h2>
          <button
            onClick={onClose}
            className="p-1 text-notion-text-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sounds..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-notion-bg-secondary border border-notion-border rounded-lg text-notion-text outline-none focus:border-notion-accent transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-notion-text-secondary hover:text-notion-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tag filter */}
        <div className="px-4 pb-2">
          <SoundTagFilter soundTagState={soundTagState} />
        </div>

        {/* Sound list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredSounds.map(sound => {
            const displayName = soundTagState.getDisplayName(sound.id) || sound.label;
            const Icon = sound.icon;
            return (
              <button
                key={sound.id}
                onClick={() => {
                  onSelectSound(sound.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-notion-hover transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-md bg-notion-bg-secondary flex items-center justify-center shrink-0">
                  {Icon ? <Icon size={14} className="text-notion-text-secondary" /> : (
                    <Volume2 size={14} className="text-notion-text-secondary" />
                  )}
                </div>
                <span className="text-sm text-notion-text truncate flex-1">{displayName}</span>
                {sound.isCustom && (
                  <span className="text-[10px] text-notion-text-secondary px-1.5 py-0.5 rounded bg-notion-hover">
                    Custom
                  </span>
                )}
              </button>
            );
          })}

          {filteredSounds.length === 0 && (
            <div className="text-center py-6 text-sm text-notion-text-secondary">
              No sounds available
            </div>
          )}
        </div>

        {/* Add Custom Sound */}
        <div className="border-t border-notion-border px-4 py-3">
          <button
            onClick={() => {
              onAddCustomSound();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-notion-text-secondary hover:text-notion-accent hover:bg-notion-hover transition-colors"
          >
            <Plus size={14} />
            <span>Add Custom Sound</span>
          </button>
        </div>
      </div>
    </div>
  );
}
