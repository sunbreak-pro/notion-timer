import { useCallback } from "react";
import { CheckCircle2, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTimerContext } from "../../hooks/useTimerContext";
import { useAudioContext } from "../../hooks/useAudioContext";
import { TimerDisplay } from "./TimerDisplay";
import { TimerProgressBar } from "./TimerProgressBar";
import { PomodoroSettings } from "./PomodoroSettings";
import { SoundMixer } from "./SoundMixer";
import { TaskSelector } from "./TaskSelector";

interface WorkScreenProps {
  onCompleteTask?: () => void;
}

export function WorkScreen({
  onCompleteTask,
}: WorkScreenProps) {
  const { t } = useTranslation();
  const timer = useTimerContext();
  const audio = useAudioContext();
  const {
    workMixer,
    restMixer,
    toggleWorkSound,
    toggleRestSound,
    setWorkVolume,
    setRestVolume,
    customSounds,
    workscreenSelections,
  } = audio;

  const title = timer.activeTask?.title ?? t('work.freeSession');

  const handleCompleteSession = useCallback(() => {
    if (timer.isRunning) timer.pause();
    timer.startRest();
  }, [timer]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with buttons */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-notion-border">
        <TaskSelector currentTitle={title} />
        <div className="flex items-center gap-2">
          {timer.sessionType === 'WORK' && (
            <button
              onClick={handleCompleteSession}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
            >
              <SkipForward size={14} />
              {t('work.sessionComplete')}
            </button>
          )}
          {timer.activeTask && onCompleteTask && (
            <button
              onClick={onCompleteTask}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 rounded-lg transition-colors"
            >
              <CheckCircle2 size={14} />
              {t('work.taskComplete')}
            </button>
          )}
          <PomodoroSettings
            workDurationMinutes={timer.workDurationMinutes}
            breakDurationMinutes={timer.breakDurationMinutes}
            longBreakDurationMinutes={timer.longBreakDurationMinutes}
            sessionsBeforeLongBreak={timer.sessionsBeforeLongBreak}
            onChangeWorkDuration={timer.setWorkDurationMinutes}
            onChangeBreakDuration={timer.setBreakDurationMinutes}
            onChangeLongBreakDuration={timer.setLongBreakDurationMinutes}
            onChangeSessionsBeforeLongBreak={timer.setSessionsBeforeLongBreak}
            disabled={timer.isRunning}
          />
        </div>
      </div>

      {/* Timer center */}
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

        <div className="w-full max-w-xl">
          <TimerProgressBar progress={timer.progress} />
        </div>
      </div>

      {/* Sound mixer footer */}
      <div className="px-6 pb-6">
        <div className="max-w-xl mx-auto">
          <SoundMixer
            workMixer={workMixer}
            restMixer={restMixer}
            onToggleWorkSound={toggleWorkSound}
            onToggleRestSound={toggleRestSound}
            onSetWorkVolume={setWorkVolume}
            onSetRestVolume={setRestVolume}
            customSounds={customSounds}
            activeSessionType={timer.sessionType}
            channelPositions={audio.channelPositions}
            onSeekSound={audio.seekSound}
            workscreenSelections={workscreenSelections}
          />
        </div>
      </div>
    </div>
  );
}
