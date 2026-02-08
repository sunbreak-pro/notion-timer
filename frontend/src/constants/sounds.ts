import { CloudRain, CloudLightning, Wind, Waves, Bird, Flame, type LucideIcon } from 'lucide-react';

export interface SoundType {
  id: string;
  label: string;
  icon: LucideIcon;
  file: string;
}

export const SOUND_TYPES: SoundType[] = [
  { id: 'rain', label: 'Rain', icon: CloudRain, file: '/sounds/rain.mp3' },
  { id: 'thunder', label: 'Thunder', icon: CloudLightning, file: '/sounds/thunder.mp3' },
  { id: 'wind', label: 'Wind', icon: Wind, file: '/sounds/wind.mp3' },
  { id: 'ocean', label: 'Ocean', icon: Waves, file: '/sounds/ocean.mp3' },
  { id: 'birds', label: 'Birds', icon: Bird, file: '/sounds/birds.mp3' },
  { id: 'fire', label: 'Fire', icon: Flame, file: '/sounds/fire.mp3' },
];
