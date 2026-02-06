import { CloudRain, CloudLightning, Wind, Waves, Bird, Flame, type LucideIcon } from 'lucide-react';

export interface SoundType {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SOUND_TYPES: SoundType[] = [
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'thunder', label: 'Thunder', icon: CloudLightning },
  { id: 'wind', label: 'Wind', icon: Wind },
  { id: 'ocean', label: 'Ocean', icon: Waves },
  { id: 'birds', label: 'Birds', icon: Bird },
  { id: 'fire', label: 'Fire', icon: Flame },
];
