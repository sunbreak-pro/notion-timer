import { useState, useMemo } from 'react';
import { Play, Square, Settings2, Search, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAudioContext } from '../../hooks/useAudioContext';
import { SOUND_TYPES } from '../../constants/sounds';
import { useSoundTags } from '../../hooks/useSoundTags';
import { SoundTagManager } from './SoundTagManager';
import { SoundTagFilter } from './SoundTagFilter';
import { EmptySlot } from './EmptySlot';
import { MusicSlotItem } from './MusicSlotItem';
import { MusicSoundItem } from './MusicSoundItem';
import { SoundPickerModal } from './SoundPickerModal';

const MAX_SLOTS = 6;

export function MusicScreen() {
  const audio = useAudioContext();
  const soundTagState = useSoundTags();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'WORK' | 'REST' | 'ALL'>('WORK');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [allSoundsSearch, setAllSoundsSearch] = useState('');

  const selectedIds = activeTab === 'WORK'
    ? audio.workscreenSelections.work
    : audio.workscreenSelections.rest;

  const activeMixer = activeTab === 'WORK' ? audio.workMixer : audio.restMixer;
  const toggleFn = activeTab === 'WORK' ? audio.toggleWorkSound : audio.toggleRestSound;
  const volumeFn = activeTab === 'WORK' ? audio.setWorkVolume : audio.setRestVolume;

  const allSoundsMap = useMemo(() => {
    const map = new Map<string, { label: string; isCustom: boolean }>();
    for (const s of SOUND_TYPES) {
      map.set(s.id, { label: s.label, isCustom: false });
    }
    for (const s of audio.customSounds) {
      map.set(s.id, { label: s.label, isCustom: true });
    }
    return map;
  }, [audio.customSounds]);

  const allSoundsList = useMemo(() => {
    const items = [
      ...SOUND_TYPES.map(s => ({ id: s.id, label: s.label, isCustom: false })),
      ...audio.customSounds.map(s => ({ id: s.id, label: s.label, isCustom: true })),
    ];
    const search = allSoundsSearch.toLowerCase().trim();
    let filtered = items;
    if (search) {
      filtered = filtered.filter(s => {
        const displayName = soundTagState.getDisplayName(s.id) || s.label;
        return displayName.toLowerCase().includes(search);
      });
    }
    if (soundTagState.filterTagIds.length > 0) {
      filtered = filtered.filter(s => {
        const tags = soundTagState.getSoundTagIds(s.id);
        return soundTagState.filterTagIds.some(fid => tags.includes(fid));
      });
    }
    return filtered;
  }, [allSoundsSearch, audio.customSounds, soundTagState]);

  const handleAddSound = () => {
    if (selectedIds.length >= MAX_SLOTS) return;
    setPickerOpen(true);
  };

  const handleSelectSound = (soundId: string) => {
    audio.toggleWorkscreenSelection(soundId, activeTab);
  };

  const handleRemoveSound = (soundId: string) => {
    audio.toggleWorkscreenSelection(soundId, activeTab);
  };

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

  const emptySlotCount = MAX_SLOTS - selectedIds.length;

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-3xl mx-auto w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-notion-text">{t('music.title')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={audio.toggleManualPlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                audio.manualPlay
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-notion-hover text-notion-text-secondary hover:text-notion-text'
              }`}
            >
              {audio.manualPlay ? <Square size={14} /> : <Play size={14} />}
              <span>{audio.manualPlay ? t('music.stop') : t('music.play')}</span>
            </button>
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

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-notion-bg-secondary rounded-lg p-1 border border-notion-border">
          <button
            onClick={() => setActiveTab('WORK')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'WORK'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
            }`}
          >
            <span>{t('music.work')}</span>
            <span className={`text-xs px-1.5 py-0 rounded-full ${
              activeTab === 'WORK' ? 'bg-white/20' : 'bg-notion-hover'
            }`}>
              {audio.workscreenSelections.work.length}/{MAX_SLOTS}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('REST')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'REST'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
            }`}
          >
            <span>{t('music.rest')}</span>
            <span className={`text-xs px-1.5 py-0 rounded-full ${
              activeTab === 'REST' ? 'bg-white/20' : 'bg-notion-hover'
            }`}>
              {audio.workscreenSelections.rest.length}/{MAX_SLOTS}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ALL'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
            }`}
          >
            <span>{t('music.allSounds')}</span>
            <span className={`text-xs px-1.5 py-0 rounded-full ${
              activeTab === 'ALL' ? 'bg-white/20' : 'bg-notion-hover'
            }`}>
              {SOUND_TYPES.length + audio.customSounds.length}
            </span>
          </button>
        </div>

        {activeTab !== 'ALL' ? (
          <>
            {/* Slots */}
            <div className="space-y-2">
              {selectedIds.map(soundId => {
                const info = allSoundsMap.get(soundId);
                if (!info) return null;
                return (
                  <MusicSlotItem
                    key={soundId}
                    soundId={soundId}
                    defaultLabel={info.label}
                    isCustom={info.isCustom}
                    soundTagState={soundTagState}
                    mixer={activeMixer}
                    onToggle={toggleFn}
                    onSetVolume={volumeFn}
                    channelPositions={audio.channelPositions}
                    onSeek={audio.seekSound}
                    onRemove={() => handleRemoveSound(soundId)}
                  />
                );
              })}

              {emptySlotCount > 0 && (
                <EmptySlot onAddClick={handleAddSound} />
              )}
            </div>

            {selectedIds.length === 0 && (
              <div className="text-center py-8 text-notion-text-secondary text-sm">
                {activeTab === 'WORK' ? t('music.noSoundsWork') : t('music.noSoundsRest')}
                <br />
                {t('music.addSoundHint')}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Search bar */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-text-secondary" />
              <input
                type="text"
                value={allSoundsSearch}
                onChange={(e) => setAllSoundsSearch(e.target.value)}
                placeholder={t('music.searchSounds')}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-notion-bg-secondary border border-notion-border text-notion-text placeholder:text-notion-text-secondary focus:outline-none focus:border-notion-accent"
              />
              {allSoundsSearch && (
                <button
                  onClick={() => setAllSoundsSearch('')}
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
            <div className="space-y-2">
              {allSoundsList.map(s => (
                <MusicSoundItem
                  key={s.id}
                  soundId={s.id}
                  defaultLabel={s.label}
                  isCustom={s.isCustom}
                  soundTagState={soundTagState}
                  toggleWorkscreenSelection={audio.toggleWorkscreenSelection}
                  isWorkscreenSelected={audio.isWorkscreenSelected}
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
          </>
        )}
      </div>

      {/* Sound Picker Modal */}
      <SoundPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectSound={handleSelectSound}
        excludeSoundIds={selectedIds}
        customSounds={audio.customSounds}
        onAddCustomSound={handleAddCustomSound}
        soundTagState={soundTagState}
      />
    </div>
  );
}
