import type { TaskNode } from '../../types/taskTree';
import { TaskDetailHeader } from './TaskDetailHeader';
import { MemoEditor } from './MemoEditor';
import { EmptyState } from './EmptyState';

interface TaskDetailProps {
  task: TaskNode | null;
  allNodes: TaskNode[];
  globalWorkDuration: number;
  onPlay: () => void;
  onDelete: () => void;
  onUpdateContent?: (content: string) => void;
  onDurationChange?: (minutes: number) => void;
}

export function TaskDetail({
  task,
  allNodes,
  globalWorkDuration,
  onPlay,
  onDelete,
  onUpdateContent,
  onDurationChange,
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
          <MemoEditor
            key={task.id}
            taskId={task.id}
            initialContent={task.content}
            onUpdate={(content) => onUpdateContent?.(content)}
          />
        </div>
      </div>
    </div>
  );
}
