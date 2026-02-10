import { Music } from 'lucide-react';
import { SOUND_TYPES } from '../../constants/sounds';
import type { SoundMixerState } from '../../hooks/useLocalSoundMixer';
import type { CustomSoundMeta } from '../../types/customSound';
import { SoundCard } from './SoundCard';
import { AddSoundCard } from './AddSoundCard';

interface SoundMixerProps {
  mixer: SoundMixerState;
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  customSounds?: CustomSoundMeta[];
  onAddSound?: (file: File) => Promise<{ error?: string }>;
  onRemoveSound?: (id: string) => void;
}

export function SoundMixer({
  mixer,
  onToggle,
  onVolumeChange,
  customSounds = [],
  onAddSound,
  onRemoveSound,
}: SoundMixerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {SOUND_TYPES.map(sound => {
        const state = mixer[sound.id] ?? { enabled: false, volume: 50 };
        return (
          <SoundCard
            key={sound.id}
            label={sound.label}
            icon={sound.icon}
            enabled={state.enabled}
            volume={state.volume}
            onToggle={() => onToggle(sound.id)}
            onVolumeChange={(v) => onVolumeChange(sound.id, v)}
          />
        );
      })}
      {customSounds.map(sound => {
        const state = mixer[sound.id] ?? { enabled: false, volume: 50 };
        return (
          <SoundCard
            key={sound.id}
            label={sound.label}
            icon={Music}
            enabled={state.enabled}
            volume={state.volume}
            onToggle={() => onToggle(sound.id)}
            onVolumeChange={(v) => onVolumeChange(sound.id, v)}
            onDelete={onRemoveSound ? () => onRemoveSound(sound.id) : undefined}
          />
        );
      })}
      {onAddSound && (
        <AddSoundCard onAddSound={onAddSound} />
      )}
    </div>
  );
}
