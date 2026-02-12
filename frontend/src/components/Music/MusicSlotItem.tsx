import { useState, useRef, useEffect, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { Volume2, VolumeX, X, Clock, Pencil, Check } from 'lucide-react';
import { SOUND_TYPES } from '../../constants/sounds';
import { SoundTagEditor } from './SoundTagEditor';
import type { SoundMixerState } from '../../hooks/useLocalSoundMixer';
import type { useSoundTags } from '../../hooks/useSoundTags';

function formatSeekTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface MusicSlotItemProps {
  soundId: string;
  defaultLabel: string;
  isCustom: boolean;
  soundTagState: ReturnType<typeof useSoundTags>;
  mixer: SoundMixerState;
  onToggle: (id: string) => void;
  onSetVolume: (id: string, volume: number) => void;
  channelPositions: Record<string, { currentTime: number; duration: number }>;
  onSeek: (id: string, time: number) => void;
  onRemove: () => void;
}

export function MusicSlotItem({
  soundId,
  defaultLabel,
  isCustom,
  soundTagState,
  mixer,
  onToggle,
  onSetVolume,
  channelPositions,
  onSeek,
  onRemove,
}: MusicSlotItemProps) {
  const soundState = mixer[soundId];
  const enabled = soundState?.enabled ?? false;
  const volume = soundState?.volume ?? 50;
  const displayName = soundTagState.getDisplayName(soundId) || defaultLabel;

  const builtIn = SOUND_TYPES.find(s => s.id === soundId);
  const Icon = builtIn?.icon;

  // Force re-render when tag cache changes
  void soundTagState.version;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayName);
  const [showSaved, setShowSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(soundTagState.getDisplayName(soundId) || defaultLabel);
  }, [soundId, defaultLabel, soundTagState]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
            onClick={() => onToggle(soundId)}
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
            onChange={(e) => onSetVolume(soundId, Number(e.target.value))}
            className="w-20 accent-notion-accent"
          />
          <span className="text-xs text-notion-text-secondary w-7 text-right tabular-nums">
            {volume}
          </span>
        </div>
        {enabled && (channelPositions[soundId]?.duration ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-notion-text-secondary p-0.5" />
            <input
              type="range"
              min={0}
              max={channelPositions[soundId]?.duration ?? 0}
              step={0.1}
              value={channelPositions[soundId]?.currentTime ?? 0}
              onChange={(e) => onSeek(soundId, Number(e.target.value))}
              className="w-20 accent-notion-text-secondary"
            />
            <span className="text-[10px] text-notion-text-secondary w-7 text-right tabular-nums">
              {formatSeekTime(channelPositions[soundId]?.currentTime ?? 0)}
            </span>
          </div>
        )}
      </div>

      {/* Remove from slot */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
        title="Remove from slot"
      >
        <X size={14} />
      </button>
    </div>
  );
}
