import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { SOUND_TYPES } from '../../constants/sounds';
import type { SoundMixerState } from '../../hooks/useLocalSoundMixer';
import type { CustomSoundMeta } from '../../types/customSound';
import type { SessionType } from '../../types/timer';
import { SoundCard } from './SoundCard';
import { AddSoundCard } from './AddSoundCard';

interface SoundMixerProps {
  workMixer: SoundMixerState;
  restMixer: SoundMixerState;
  onToggleWorkSound: (id: string) => void;
  onToggleRestSound: (id: string) => void;
  onSetWorkVolume: (id: string, volume: number) => void;
  onSetRestVolume: (id: string, volume: number) => void;
  customSounds?: CustomSoundMeta[];
  onAddSound?: (file: File) => Promise<{ error?: string }>;
  onRemoveSound?: (id: string) => void;
  activeSessionType: SessionType;
}

type TabType = 'WORK' | 'REST';

export function SoundMixer({
  workMixer,
  restMixer,
  onToggleWorkSound,
  onToggleRestSound,
  onSetWorkVolume,
  onSetRestVolume,
  customSounds = [],
  onAddSound,
  onRemoveSound,
  activeSessionType,
}: SoundMixerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(activeSessionType === 'WORK' ? 'WORK' : 'REST');

  useEffect(() => {
    setActiveTab(activeSessionType === 'WORK' ? 'WORK' : 'REST');
  }, [activeSessionType]);

  const mixer = activeTab === 'WORK' ? workMixer : restMixer;
  const onToggle = activeTab === 'WORK' ? onToggleWorkSound : onToggleRestSound;
  const onVolumeChange = activeTab === 'WORK' ? onSetWorkVolume : onSetRestVolume;

  return (
    <div>
      <div className="flex gap-1 mb-3 p-1 bg-notion-hover rounded-lg">
        <button
          onClick={() => setActiveTab('WORK')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'WORK'
              ? 'bg-notion-bg text-notion-text shadow-sm'
              : 'text-notion-text-secondary hover:text-notion-text'
          }`}
        >
          Work
        </button>
        <button
          onClick={() => setActiveTab('REST')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'REST'
              ? 'bg-notion-bg text-notion-text shadow-sm'
              : 'text-notion-text-secondary hover:text-notion-text'
          }`}
        >
          Rest
        </button>
      </div>

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
    </div>
  );
}
