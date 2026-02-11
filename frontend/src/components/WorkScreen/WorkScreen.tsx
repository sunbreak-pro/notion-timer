import { useEffect, useCallback } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useTimerContext } from "../../hooks/useTimerContext";
import { useAudioContext } from "../../hooks/useAudioContext";
import { TimerDisplay } from "./TimerDisplay";
import { TimerProgressBar } from "./TimerProgressBar";
import { PomodoroSettings } from "./PomodoroSettings";
import { SoundMixer } from "./SoundMixer";
import { TaskSelector } from "./TaskSelector";
import { SessionCompletionModal } from "./SessionCompletionModal";

interface WorkScreenProps {
  isOverlay?: boolean;
  onClose?: () => void;
  onCompleteTask?: () => void;
}

export function WorkScreen({
  isOverlay = false,
  onClose,
  onCompleteTask,
}: WorkScreenProps) {
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

  const handleManualTabSwitch = useCallback(
    (tab: "WORK" | "REST") => {
      // If switching to the natural tab for the current session, clear override
      const naturalTab = timer.sessionType === "WORK" ? "WORK" : "REST";
      if (tab === naturalTab) {
        audio.setMixerOverride(null);
      } else {
        audio.setMixerOverride(tab);
      }
      audio.resetAllPlayback();
    },
    [timer.sessionType, audio],
  );

  const title = timer.activeTask?.title ?? "Free Session";

  useEffect(() => {
    if (!isOverlay || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOverlay, onClose]);

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-notion-border">
        <TaskSelector currentTitle={title} />
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

        {timer.activeTask && onCompleteTask && (
          <button
            onClick={onCompleteTask}
            className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
          >
            <CheckCircle2 size={16} />
            タスクを完了する
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

        <div className="w-full max-w-xl">
          <TimerProgressBar progress={timer.progress} />
        </div>
      </div>

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
            onManualTabSwitch={handleManualTabSwitch}
            channelPositions={audio.channelPositions}
            onSeekSound={audio.seekSound}
            workscreenSelections={workscreenSelections}
          />
        </div>
      </div>
    </div>
  );

  const completionModal = timer.showCompletionModal && (
    <SessionCompletionModal
      onExtend={timer.extendWork}
      onStartRest={timer.startRest}
      onDismiss={timer.dismissCompletionModal}
      onCompleteTask={
        timer.activeTask && onCompleteTask ? onCompleteTask : undefined
      }
    />
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-10 w-[75vw] mx-4 bg-notion-bg rounded-xl shadow-2xl border border-notion-border max-h-[90vh] overflow-y-auto">
          {content}
        </div>
        {completionModal}
      </div>
    );
  }

  return (
    <div className="h-full min-h-[calc(100vh-4rem)]">
      {content}
      {completionModal}
    </div>
  );
}
