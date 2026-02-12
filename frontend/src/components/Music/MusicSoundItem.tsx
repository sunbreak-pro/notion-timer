import { useState, useRef, useEffect, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { Volume2, VolumeX, Trash2, Pencil, Clock, Check } from 'lucide-react';
import { useAudioContext } from '../../hooks/useAudioContext';
import { SOUND_TYPES } from '../../constants/sounds';
import { SoundTagEditor } from './SoundTagEditor';
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
  toggleWorkscreenSelection?: (soundId: string, category: 'WORK' | 'REST') => void;
  isWorkscreenSelected?: (soundId: string, category: 'WORK' | 'REST') => boolean;
}

export function MusicSoundItem({ soundId, defaultLabel, isCustom, soundTagState, toggleWorkscreenSelection, isWorkscreenSelected }: MusicSoundItemProps) {
  const audio = useAudioContext();
  const mixer = audio.workMixer;
  const soundState = mixer[soundId];
  const enabled = soundState?.enabled ?? false;
  const volume = soundState?.volume ?? 50;

  const displayName = soundTagState.getDisplayName(soundId) || defaultLabel;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get built-in icon
  const builtIn = SOUND_TYPES.find(s => s.id === soundId);
  const Icon = builtIn?.icon;

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
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(displayName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-notion-bg-secondary border border-notion-border hover:border-notion-accent/30 transition-colors group">
      {/* Icon */}
      <div className="w-8 h-8 rounded-md bg-notion-hover flex items-center justify-center shrink-0">
        {Icon ? <Icon size={16} className="text-notion-text-secondary" /> : (
          <Volume2 size={16} className="text-notion-text-secondary" />
        )}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-sm font-medium bg-transparent outline-none border-b border-notion-accent text-notion-text w-full"
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
                className="p-0.5 text-notion-accent hover:text-green-500 transition-colors"
                title="Save"
              >
                <Check size={14} />
              </button>
            </>
          ) : (
            <span
              className="text-sm font-medium text-notion-text truncate cursor-pointer hover:text-notion-accent transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {displayName}
            </span>
          )}
          {!isEditing && !showSaved && (
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-notion-text-secondary hover:text-notion-text transition-opacity"
            >
              <Pencil size={12} />
            </button>
          )}
          {showSaved && (
            <span className="text-xs text-green-500 font-medium ml-1">Saved!</span>
          )}
        </div>
        <SoundTagEditor soundId={soundId} soundTagState={soundTagState} />
      </div>

      {/* Volume + Seek sliders */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => audio.toggleWorkSound(soundId)}
            className={`p-1 rounded transition-colors ${
              enabled ? 'text-notion-accent' : 'text-notion-text-secondary hover:text-notion-text'
            }`}
          >
            {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => audio.setWorkVolume(soundId, Number(e.target.value))}
            className="w-20 accent-notion-accent"
          />
          <span className="text-xs text-notion-text-secondary w-7 text-right tabular-nums">
            {volume}
          </span>
        </div>
        {enabled && (audio.channelPositions[soundId]?.duration ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-notion-text-secondary p-0.5" />
            <input
              type="range"
              min={0}
              max={audio.channelPositions[soundId]?.duration ?? 0}
              step={0.1}
              value={audio.channelPositions[soundId]?.currentTime ?? 0}
              onChange={(e) => audio.seekSound(soundId, Number(e.target.value))}
              className="w-20 accent-notion-text-secondary"
            />
            <span className="text-[10px] text-notion-text-secondary w-7 text-right tabular-nums">
              {formatSeekTime(audio.channelPositions[soundId]?.currentTime ?? 0)}
            </span>
          </div>
        )}
      </div>

      {/* W/R workscreen selection toggles */}
      {toggleWorkscreenSelection && isWorkscreenSelected && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => toggleWorkscreenSelection(soundId, 'WORK')}
            className={`px-2 h-7 text-xs font-bold rounded transition-colors ${
              isWorkscreenSelected(soundId, 'WORK')
                ? 'bg-blue-500 text-white'
                : 'bg-notion-hover text-notion-text-secondary hover:text-notion-text'
            }`}
            title="WorkScreen Work phase"
          >
            Work
          </button>
          <button
            onClick={() => toggleWorkscreenSelection(soundId, 'REST')}
            className={`px-2 h-7 text-xs font-bold rounded transition-colors ${
              isWorkscreenSelected(soundId, 'REST')
                ? 'bg-green-500 text-white'
                : 'bg-notion-hover text-notion-text-secondary hover:text-notion-text'
            }`}
            title="WorkScreen Rest phase"
          >
            Rest
          </button>
        </div>
      )}

      {/* Delete (custom only) */}
      {isCustom && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 bg-notion-bg rounded-lg border border-notion-border shadow-xl p-5 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-notion-text mb-4">
              &ldquo;{displayName}&rdquo; を削除しますか？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm text-notion-text-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  audio.removeSound(soundId);
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
