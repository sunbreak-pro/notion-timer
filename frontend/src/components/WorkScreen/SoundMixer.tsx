import { useMemo } from "react";
import { Music, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SOUND_TYPES } from "../../constants/sounds";
import type { SoundMixerState } from "../../hooks/useLocalSoundMixer";
import type { CustomSoundMeta } from "../../types/customSound";
import { SoundListItem } from "./SoundListItem";

interface SoundMixerProps {
  mixer: SoundMixerState;
  onToggleSound: (id: string) => void;
  onSetVolume: (id: string, volume: number) => void;
  customSounds?: CustomSoundMeta[];
  channelPositions?: Record<string, { currentTime: number; duration: number }>;
  onSeekSound?: (id: string, time: number) => void;
  workscreenSelections: string[];
  getDisplayName?: (soundId: string) => string | undefined;
  onOpenPicker: () => void;
}

export function SoundMixer({
  mixer,
  onToggleSound,
  onSetVolume,
  customSounds = [],
  channelPositions,
  onSeekSound,
  workscreenSelections,
  getDisplayName,
  onOpenPicker,
}: SoundMixerProps) {
  const { t } = useTranslation();

  // Build lookup maps for sound info
  const soundMap = useMemo(() => {
    const map = new Map<string, { label: string; icon: typeof Music }>();
    for (const s of SOUND_TYPES) {
      map.set(s.id, { label: getDisplayName?.(s.id) || s.label, icon: s.icon });
    }
    for (const s of customSounds) {
      map.set(s.id, { label: getDisplayName?.(s.id) || s.label, icon: Music });
    }
    return map;
  }, [customSounds, getDisplayName]);

  const filteredSounds = useMemo(() => {
    return workscreenSelections
      .map(id => {
        const info = soundMap.get(id);
        if (!info) return null;
        return { id, ...info };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [workscreenSelections, soundMap]);

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {filteredSounds.map((sound) => {
          const state = mixer[sound.id] ?? { enabled: false, volume: 50 };
          const pos = channelPositions?.[sound.id];
          return (
            <SoundListItem
              key={sound.id}
              label={sound.label}
              icon={sound.icon}
              enabled={state.enabled}
              volume={state.volume}
              onToggle={() => onToggleSound(sound.id)}
              onVolumeChange={(v) => onSetVolume(sound.id, v)}
              currentTime={pos?.currentTime}
              duration={pos?.duration}
              onSeek={onSeekSound ? (t) => onSeekSound(sound.id, t) : undefined}
            />
          );
        })}

        {filteredSounds.length === 0 && (
          <div className="text-center py-6 text-notion-text-secondary text-sm">
            {t('music.noSoundsWork')}
          </div>
        )}

        {/* Add Sound button */}
        <button
          onClick={onOpenPicker}
          className="flex items-center justify-center gap-1.5 py-2 text-sm text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover rounded-lg transition-colors"
        >
          <Plus size={14} />
          {t('music.addSound')}
        </button>
      </div>
    </div>
  );
}
