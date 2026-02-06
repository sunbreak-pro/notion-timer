interface TimerProgressBarProps {
  progress: number;
}

export function TimerProgressBar({ progress }: TimerProgressBarProps) {
  return (
    <div className="w-full h-1 bg-notion-border rounded-full overflow-hidden">
      <div
        className="h-full bg-notion-accent transition-all duration-1000 ease-linear rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
