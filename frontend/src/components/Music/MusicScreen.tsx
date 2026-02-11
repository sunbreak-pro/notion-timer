import { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useAudioContext } from '../../hooks/useAudioContext';
import { SOUND_TYPES } from '../../constants/sounds';
import { useSoundTags } from '../../hooks/useSoundTags';
import { useWorkscreenSelections } from '../../hooks/useWorkscreenSelections';
import { MusicSoundItem } from './MusicSoundItem';
import { SoundTagFilter } from './SoundTagFilter';

export function MusicScreen() {
  const audio = useAudioContext();
  const soundTagState = useSoundTags();
  const wsSelections = useWorkscreenSelections();
  const [searchQuery, setSearchQuery] = useState('');

  const allSounds = useMemo(() => {
    const builtIn = SOUND_TYPES.map(s => ({
      id: s.id,
      label: s.label,
      isCustom: false,
    }));
    const custom = audio.customSounds.map(s => ({
      id: s.id,
      label: s.label,
      isCustom: true,
    }));
    return [...builtIn, ...custom];
  }, [audio.customSounds]);

  const filteredSounds = useMemo(() => {
    let result = allSounds;

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
  }, [allSounds, searchQuery, soundTagState]);

  const handleAddSound = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mp3,audio/wav,audio/ogg,audio/mpeg,.mp3,.wav,.ogg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const result = await audio.addSound(file);
        if (result.error) {
          console.warn('[Music] addSound error:', result.error);
        }
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-4xl mx-auto w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-notion-text">Music</h1>
            <div className="flex items-center gap-2 text-xs text-notion-text-secondary">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                W: {wsSelections.selections.work.length}/6
              </span>
              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-medium">
                R: {wsSelections.selections.rest.length}/6
              </span>
            </div>
          </div>
          <button
            onClick={handleAddSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-notion-accent text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span>Add Sound</span>
          </button>
        </div>

        {/* Search + Tag filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sounds..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-notion-bg-secondary border border-notion-border rounded-lg text-notion-text outline-none focus:border-notion-accent transition-colors"
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

        <SoundTagFilter soundTagState={soundTagState} />

        {/* Sound list */}
        <div className="space-y-2 mt-4">
          {filteredSounds.map(sound => (
            <MusicSoundItem
              key={sound.id}
              soundId={sound.id}
              defaultLabel={sound.label}
              isCustom={sound.isCustom}
              soundTagState={soundTagState}
              wsSelections={wsSelections}
            />
          ))}

          {filteredSounds.length === 0 && (
            <div className="text-center py-8 text-notion-text-secondary text-sm">
              {searchQuery || soundTagState.filterTagIds.length > 0
                ? 'No sounds match the current filter.'
                : 'No sounds available.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
