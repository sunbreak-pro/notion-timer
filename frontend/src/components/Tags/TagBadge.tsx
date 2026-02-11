import type { Tag } from '../../types/tag';

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md';
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagBadge({ tag, size = 'sm', onClick, onRemove }: TagBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0'
    : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
      onClick={onClick}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-60 leading-none"
        >
          &times;
        </button>
      )}
    </span>
  );
}
