interface TaskNodeIndentProps {
  depth: number;
  isLastChild?: boolean;
}

export function TaskNodeIndent({ depth, isLastChild }: TaskNodeIndentProps) {
  if (depth <= 0) return null;

  return (
    <div
      className="flex shrink-0 self-stretch"
      style={{ width: `${depth * 12}px` }}
    >
      {Array.from({ length: depth }, (_, i) => (
        <div key={i} className="w-5 flex justify-center">
          <div
            className={`w-px h-full ${i === depth - 1 && isLastChild ? "h-1/2 self-start" : ""} bg-notion-text`}
          />
        </div>
      ))}
    </div>
  );
}
