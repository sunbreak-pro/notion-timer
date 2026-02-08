import { lazy, Suspense } from "react";
import type { TaskNode } from "../../types/taskTree";
import { TaskDetailHeader } from "./TaskDetailHeader";
import { EmptyState } from "./EmptyState";
import { AICoachPanel } from "../AICoach";

const MemoEditor = lazy(() =>
  import("./MemoEditor").then((m) => ({ default: m.MemoEditor })),
);

interface TaskDetailProps {
  task: TaskNode | null;
  allNodes: TaskNode[];
  globalWorkDuration: number;
  onPlay: () => void;
  onDelete: () => void;
  onUpdateContent?: (content: string) => void;
  onDurationChange?: (minutes: number) => void;
  onNavigateToSettings?: () => void;
}

export function TaskDetail({
  task,
  allNodes,
  globalWorkDuration,
  onPlay,
  onDelete,
  onUpdateContent,
  onDurationChange,
  onNavigateToSettings,
}: TaskDetailProps) {
  if (!task) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-3xl mx-auto w-full px-12 py-8 flex-1">
        <TaskDetailHeader
          task={task}
          allNodes={allNodes}
          globalWorkDuration={globalWorkDuration}
          onPlay={onPlay}
          onDelete={onDelete}
          onDurationChange={onDurationChange}
        />
        <div className="mt-6">
          <Suspense fallback={<div className="min-h-50" />}>
            <MemoEditor
              key={task.id}
              taskId={task.id}
              initialContent={task.content}
              onUpdate={(content) => onUpdateContent?.(content)}
            />
          </Suspense>
        </div>
        <AICoachPanel
          key={`ai-${task.id}`}
          taskTitle={task.title}
          taskContent={task.content}
          onNavigateToSettings={onNavigateToSettings}
        />
      </div>
    </div>
  );
}
