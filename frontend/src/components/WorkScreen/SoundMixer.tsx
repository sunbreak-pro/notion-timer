import { useState, useMemo, useRef } from "react";
import { Music } from "lucide-react";
import { SOUND_TYPES } from "../../constants/sounds";
import type { SoundMixerState } from "../../hooks/useLocalSoundMixer";
import type { CustomSoundMeta } from "../../types/customSound";
import type { SessionType } from "../../types/timer";
import type { WorkscreenSelections } from "../../hooks/useWorkscreenSelections";
import { SoundListItem } from "./SoundListItem";

interface SoundMixerProps {
  workMixer: SoundMixerState;
  restMixer: SoundMixerState;
  onToggleWorkSound: (id: string) => void;
  onToggleRestSound: (id: string) => void;
  onSetWorkVolume: (id: string, volume: number) => void;
  onSetRestVolume: (id: string, volume: number) => void;
  customSounds?: CustomSoundMeta[];
  activeSessionType: SessionType;
  onManualTabSwitch?: (tab: 'WORK' | 'REST') => void;
  channelPositions?: Record<string, { currentTime: number; duration: number }>;
  onSeekSound?: (id: string, time: number) => void;
  workscreenSelections: WorkscreenSelections;
}

type TabType = "WORK" | "REST";

export function SoundMixer({
  workMixer,
  restMixer,
  onToggleWorkSound,
  onToggleRestSound,
  onSetWorkVolume,
  onSetRestVolume,
  customSounds = [],
  activeSessionType,
  onManualTabSwitch,
  channelPositions,
  onSeekSound,
  workscreenSelections,
}: SoundMixerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(
    activeSessionType === "WORK" ? "WORK" : "REST",
  );

  // React-recommended getDerivedStateFromProps pattern (no useEffect cascade)
  const lastSyncedRef = useRef(activeSessionType);
  if (lastSyncedRef.current !== activeSessionType) {
    lastSyncedRef.current = activeSessionType;
    const newTab: TabType = activeSessionType === 'WORK' ? 'WORK' : 'REST';
    if (activeTab !== newTab) setActiveTab(newTab);
  }

  const mixer = activeTab === "WORK" ? workMixer : restMixer;
  const onToggle = activeTab === "WORK" ? onToggleWorkSound : onToggleRestSound;
  const onVolumeChange =
    activeTab === "WORK" ? onSetWorkVolume : onSetRestVolume;

  // Build lookup maps for sound info
  const soundMap = useMemo(() => {
    const map = new Map<string, { label: string; icon: typeof Music }>();
    for (const s of SOUND_TYPES) {
      map.set(s.id, { label: s.label, icon: s.icon });
    }
    for (const s of customSounds) {
      map.set(s.id, { label: s.label, icon: Music });
    }
    return map;
  }, [customSounds]);

  // Filter to only selected sounds for the current tab
  const selectedIds = activeTab === "WORK"
    ? workscreenSelections.work
    : workscreenSelections.rest;

  const filteredSounds = useMemo(() => {
    return selectedIds
      .map(id => {
        const info = soundMap.get(id);
        if (!info) return null;
        return { id, ...info };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [selectedIds, soundMap]);

  return (
    <div>
      <div className="flex gap-1 mb-3 p-1 bg-notion-hover rounded-lg">
        <button
          onClick={() => { setActiveTab("WORK"); onManualTabSwitch?.("WORK"); }}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "WORK"
              ? "bg-notion-bg text-notion-text shadow-sm"
              : "text-notion-text-secondary hover:text-notion-text"
          }`}
        >
          Work
        </button>
        <button
          onClick={() => { setActiveTab("REST"); onManualTabSwitch?.("REST"); }}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "REST"
              ? "bg-notion-bg text-notion-text shadow-sm"
              : "text-notion-text-secondary hover:text-notion-text"
          }`}
        >
          Rest
        </button>
      </div>

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
              onToggle={() => onToggle(sound.id)}
              onVolumeChange={(v) => onVolumeChange(sound.id, v)}
              currentTime={pos?.currentTime}
              duration={pos?.duration}
              onSeek={onSeekSound ? (t) => onSeekSound(sound.id, t) : undefined}
            />
          );
        })}

        {filteredSounds.length === 0 && (
          <div className="text-center py-6 text-notion-text-secondary text-sm">
            No sounds selected. Add sounds from the Music screen.
          </div>
        )}
      </div>
    </div>
  );
}
