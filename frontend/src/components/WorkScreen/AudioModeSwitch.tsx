import { useTranslation } from "react-i18next";
import type { AudioMode } from "../../types/playlist";

interface AudioModeSwitchProps {
  audioMode: AudioMode;
  onSwitch: (mode: AudioMode) => void;
}

export function AudioModeSwitch({ audioMode, onSwitch }: AudioModeSwitchProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-notion-bg-secondary rounded-lg p-0.5">
      <button
        onClick={() => onSwitch("mixer")}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          audioMode === "mixer"
            ? "bg-notion-bg text-notion-text shadow-sm"
            : "text-notion-text-secondary hover:text-notion-text"
        }`}
      >
        {t("playlist.modeMixer")}
      </button>
      <button
        onClick={() => onSwitch("playlist")}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          audioMode === "playlist"
            ? "bg-notion-bg text-notion-text shadow-sm"
            : "text-notion-text-secondary hover:text-notion-text"
        }`}
      >
        {t("playlist.modePlaylist")}
      </button>
    </div>
  );
}
