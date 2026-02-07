import type { LucideIcon } from "lucide-react";

interface SoundCardProps {
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}

export function SoundCard({
  label,
  icon: Icon,
  enabled,
  volume,
  onToggle,
  onVolumeChange,
}: SoundCardProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
        enabled
          ? "border-notion-accent bg-notion-accent/10"
          : "border-notion-border bg-notion-bg-secondary hover:border-notion-text-secondary"
      }`}
      onClick={onToggle}
    >
      <Icon
        size={24}
        className={
          enabled ? "text-notion-accent" : "text-notion-text-secondary"
        }
      />
      <span
        className={`text-xs font-medium ${enabled ? "text-notion-accent" : "text-notion-text-secondary"}`}
      >
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => {
          e.stopPropagation();
          onVolumeChange(Number(e.target.value));
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-1 accent-[--color-accent] cursor-pointer"
        disabled={!enabled}
      />
    </div>
  );
}
