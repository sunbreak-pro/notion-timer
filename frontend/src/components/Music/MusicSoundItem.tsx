import { useState, useRef, useEffect, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { Volume2, VolumeX, Trash2, Pencil, Clock, Check, Play, Pause, Music2, Minus, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAudioContext } from '../../hooks/useAudioContext';
import { SoundTagEditor } from './SoundTagEditor';
import { SOUND_TYPES } from '../../constants/sounds';
import type { useSoundTags } from '../../hooks/useSoundTags';

function formatSeekTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface MusicSoundItemProps {
  soundId: string;
  defaultLabel: string;
  isCustom: boolean;
  soundTagState: ReturnType<typeof useSoundTags>;
  toggleWorkscreenSelection?: (soundId: string) => void;
  isWorkscreenSelected?: (soundId: string) => boolean;
  isPreviewing: boolean;
  onTogglePreview: () => void;
}

export function MusicSoundItem({ soundId, defaultLabel, isCustom, soundTagState, toggleWorkscreenSelection, isWorkscreenSelected, isPreviewing: _isPreviewing, onTogglePreview: _onTogglePreview }: MusicSoundItemProps) {
  const { t } = useTranslation();
  const audio = useAudioContext();
  const mixer = audio.mixer;
  const soundState = mixer[soundId];
  const enabled = soundState?.enabled ?? false;
  const volume = soundState?.volume ?? 50;

  const displayName = soundTagState.getDisplayName(soundId) || defaultLabel;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve sound type icon
  const SoundIcon = SOUND_TYPES.find(s => s.id === soundId)?.icon ?? Music2;

  // Force re-render when tag cache changes
  void soundTagState.version;

  useEffect(() => {
    setEditValue(soundTagState.getDisplayName(soundId) || defaultLabel);
  }, [soundId, defaultLabel, soundTagState]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const [showSaved, setShowSaved] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) {
      soundTagState.updateDisplayName(soundId, trimmed);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
    }
    setIsEditing(false);
  }, [editValue, soundId, soundTagState]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(displayName);
      setIsEditing(false);
    }
  };

  const selected = isWorkscreenSelected?.(soundId) ?? false;
  const currentTags = soundTagState.getTagsForSound(soundId);
  const showSeek = enabled && (audio.channelPositions[soundId]?.duration ?? 0) > 0;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors group ${
        enabled
          ? 'border-notion-accent/40 bg-notion-accent/5'
          : 'border-notion-border bg-notion-bg-secondary'
      }`}
    >
      {/* Play/Pause toggle */}
      <button
        onClick={() => audio.toggleSound(soundId)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          enabled
            ? 'bg-notion-accent text-white'
            : 'bg-notion-hover text-notion-text-secondary hover:text-notion-text hover:bg-notion-accent/20'
        }`}
        title={enabled ? t('music.disable') : t('music.enable')}
      >
        {enabled ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>

      {/* Sound type icon (decorative) */}
      <div className={`p-1.5 rounded-md shrink-0 ${
        enabled ? 'text-notion-accent' : 'text-notion-text-secondary'
      }`}>
        <SoundIcon size={16} />
      </div>

      {/* Edit name (always visible, before name) */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors shrink-0"
          title={t('music.editName')}
        >
          <Pencil size={14} />
        </button>
      )}

      {/* Name + tag dots */}
      {isEditing ? (
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-sm font-medium bg-transparent outline-none border-b border-notion-accent text-notion-text flex-1 min-w-0"
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
            className="p-0.5 text-notion-accent hover:text-green-500 transition-colors shrink-0"
            title={t('music.save')}
          >
            <Check size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0 shrink-0 w-[160px]">
          <span
            className={`text-sm font-medium truncate ${
              enabled ? 'text-notion-text' : 'text-notion-text-secondary'
            }`}
            title={displayName}
          >
            {displayName}
          </span>
          {showSaved && (
            <span className="text-xs text-green-500 font-medium shrink-0">&#10003;</span>
          )}
          {/* Tag dots */}
          {currentTags.length > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {currentTags.slice(0, 4).map(tag => (
                <span
                  key={tag.id}
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                />
              ))}
              {currentTags.length > 4 && (
                <span className="text-[9px] text-notion-text-secondary">+{currentTags.length - 4}</span>
              )}
            </div>
          )}
          {/* Tag editor (+ button, hover only) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity relative shrink-0">
            <SoundTagEditor soundId={soundId} soundTagState={soundTagState} hidePills />
          </div>
        </div>
      )}

      {/* Volume slider */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {enabled ? (
          <Volume2 size={16} className="text-notion-text-secondary shrink-0" />
        ) : (
          <VolumeX size={16} className="text-notion-text-secondary shrink-0" />
        )}
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => audio.setVolume(soundId, Number(e.target.value))}
          className="w-20 h-1 accent-[--color-accent] cursor-pointer"
        />
        <span className="text-[10px] text-notion-text-secondary w-6 text-right tabular-nums">
          {volume}
        </span>
      </div>

      {/* Seek bar */}
      {showSeek ? (
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Clock size={14} className="text-notion-text-secondary shrink-0" />
          <input
            type="range"
            min={0}
            max={audio.channelPositions[soundId]?.duration ?? 0}
            step={0.1}
            value={audio.channelPositions[soundId]?.currentTime ?? 0}
            onChange={(e) => audio.seekSound(soundId, Number(e.target.value))}
            className="w-60 h-1 accent-[--color-text-secondary] cursor-pointer"
          />
          <span className="text-[10px] text-notion-text-secondary tabular-nums shrink-0">
            {formatSeekTime(audio.channelPositions[soundId]?.currentTime ?? 0)}
          </span>
        </div>
      ) : null}

      {/* Spacer to push action buttons to the right */}
      <div className="flex-1" />

      {/* Hover-only action buttons */}
      <div className="flex items-center gap-0.5 shrink-0 transition-opacity opacity-0 group-hover:opacity-100">
        {/* Add/Remove workscreen */}
        {toggleWorkscreenSelection && isWorkscreenSelected && (
          <button
            onClick={() => toggleWorkscreenSelection(soundId)}
            className={`p-1.5 rounded transition-colors ${
              selected
                ? 'text-notion-accent hover:text-notion-text-secondary'
                : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
            }`}
            title={selected ? t('music.removeFromWorkscreen') : t('music.addToWorkscreen')}
          >
            {selected ? <Minus size={14} /> : <PlusCircle size={14} />}
          </button>
        )}

        {/* Delete (custom only) */}
        {isCustom && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded text-notion-text-secondary hover:text-notion-danger hover:bg-notion-hover transition-colors"
            title={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 bg-notion-bg rounded-lg border border-notion-border shadow-xl p-5 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-notion-text mb-4">
              {t('music.deleteConfirm', { name: displayName })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm text-notion-text-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  audio.removeSound(soundId);
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
