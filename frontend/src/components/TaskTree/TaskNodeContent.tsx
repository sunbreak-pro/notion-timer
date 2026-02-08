interface TaskNodeContentProps {
  title: string;
  isDone: boolean;
  isFolder: boolean;
  onSelectTask?: (id: string) => void;
  onStartEditing: () => void;
  onToggleExpand?: () => void;
  nodeId: string;
}

export function TaskNodeContent({
  title,
  isDone,
  isFolder,
  onSelectTask,
  onStartEditing,
  onToggleExpand,
  nodeId,
}: TaskNodeContentProps) {
  return (
    <span
      onClick={() => {
        if (isFolder) {
          onToggleExpand?.();
          return;
        }
        if (onSelectTask) onSelectTask(nodeId);
      }}
      onDoubleClick={() => {
        onStartEditing();
      }}
      className={`flex-1 text-sm cursor-pointer truncate ${
        isDone
          ? "line-through text-notion-text-secondary"
          : "text-notion-text"
      } ${isFolder ? "font-medium" : ""}`}
    >
      {title}
    </span>
  );
}
