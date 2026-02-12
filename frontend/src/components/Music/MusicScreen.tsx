import { useState, useMemo } from 'react';
import { Settings2, Search, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAudioContext } from '../../hooks/useAudioContext';
import { usePreviewAudio } from '../../hooks/usePreviewAudio';
import { SOUND_TYPES } from '../../constants/sounds';
import { useSoundTags } from '../../hooks/useSoundTags';
import { SoundTagManager } from './SoundTagManager';
import { SoundTagFilter } from './SoundTagFilter';
import { MusicSoundItem } from './MusicSoundItem';

export function MusicScreen() {
  const audio = useAudioContext();
  const soundTagState = useSoundTags();
  const preview = usePreviewAudio();
  const { t } = useTranslation();
  const [showTagManager, setShowTagManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allSoundsList = useMemo(() => {
    const items = [
      ...SOUND_TYPES.map(s => ({ id: s.id, label: s.label, isCustom: false })),
      ...audio.customSounds.map(s => ({ id: s.id, label: s.label, isCustom: true })),
    ];
    const search = searchQuery.toLowerCase().trim();
    let filtered = items;
    if (search) {
      filtered = filtered.filter(s => {
        const displayName = soundTagState.getDisplayName(s.id) || s.label;
        return displayName.toLowerCase().includes(search);
      });
    }
    if (soundTagState.filterTagIds.length > 0) {
      filtered = filtered.filter(s => soundTagState.soundPassesFilter(s.id));
    }
    return filtered;
  }, [searchQuery, audio.customSounds, soundTagState]);

  const handleAddCustomSound = async () => {
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
      <div className="max-w-4xl mx-auto w-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-notion-text">{t('music.title')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTagManager(v => !v)}
              className={`p-1.5 rounded-md transition-colors ${
                showTagManager
                  ? 'bg-notion-accent text-white'
                  : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
              }`}
              title={t('music.manageTags')}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>

        {showTagManager && (
          <div className="mb-4">
            <SoundTagManager soundTagState={soundTagState} />
          </div>
        )}

        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('music.searchSounds')}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-notion-bg-secondary border border-notion-border text-notion-text placeholder:text-notion-text-secondary focus:outline-none focus:border-notion-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-notion-text-secondary hover:text-notion-text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tag filter */}
        <div className="mb-3">
          <SoundTagFilter soundTagState={soundTagState} />
        </div>

        {/* Sound list */}
        <div className="space-y-1.5">
          {allSoundsList.map(s => (
            <MusicSoundItem
              key={s.id}
              soundId={s.id}
              defaultLabel={s.label}
              isCustom={s.isCustom}
              soundTagState={soundTagState}
              toggleWorkscreenSelection={audio.toggleWorkscreenSelection}
              isWorkscreenSelected={audio.isWorkscreenSelected}
              isPreviewing={preview.previewingId === s.id}
              onTogglePreview={() => preview.togglePreview(s.id, audio.soundSources[s.id])}
            />
          ))}
        </div>

        {allSoundsList.length === 0 && (
          <div className="text-center py-8 text-notion-text-secondary text-sm">
            {t('music.noSoundsAll')}
          </div>
        )}

        {/* Add custom sound button */}
        <button
          onClick={handleAddCustomSound}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-notion-border text-sm text-notion-text-secondary hover:text-notion-text hover:border-notion-accent/50 transition-colors"
        >
          <Plus size={16} />
          {t('music.addCustomSound')}
        </button>
      </div>
    </div>
  );
}
