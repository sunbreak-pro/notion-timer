import { SOUND_TYPES } from '../../constants/sounds';
import type { SoundMixerState } from '../../hooks/useLocalSoundMixer';
import { SoundCard } from './SoundCard';

interface SoundMixerProps {
  mixer: SoundMixerState;
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
}

export function SoundMixer({ mixer, onToggle, onVolumeChange }: SoundMixerProps) {
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
    </div>
  );
}
