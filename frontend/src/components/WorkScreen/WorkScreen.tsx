import { X } from 'lucide-react';
import { useLocalTimer } from '../../hooks/useLocalTimer';
import { useLocalSoundMixer } from '../../hooks/useLocalSoundMixer';
import { TimerDisplay } from './TimerDisplay';
import { TimerProgressBar } from './TimerProgressBar';
import { SoundMixer } from './SoundMixer';

interface WorkScreenProps {
  taskTitle?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export function WorkScreen({ taskTitle, isOverlay = false, onClose }: WorkScreenProps) {
  const timer = useLocalTimer();
  const { mixer, toggleSound, setVolume } = useLocalSoundMixer();

  const title = taskTitle ?? 'Free Session';

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-notion-border">
        <h2 className="text-lg font-semibold text-notion-text truncate">{title}</h2>
        {isOverlay && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
        <TimerDisplay
          sessionType={timer.sessionType}
          remainingSeconds={timer.remainingSeconds}
          isRunning={timer.isRunning}
          completedSessions={timer.completedSessions}
          sessionsBeforeLongBreak={timer.sessionsBeforeLongBreak}
          formatTime={timer.formatTime}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
        />

        <div className="w-full max-w-md">
          <TimerProgressBar progress={timer.progress} />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="max-w-md mx-auto">
          <SoundMixer
            mixer={mixer}
            onToggle={toggleSound}
            onVolumeChange={setVolume}
          />
        </div>
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 bg-notion-bg">
        {content}
      </div>
    );
  }

  return (
    <div className="h-full min-h-[calc(100vh-4rem)]">
      {content}
    </div>
  );
}
