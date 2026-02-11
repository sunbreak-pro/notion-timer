import { X } from 'lucide-react';
import { useTagContext } from '../../hooks/useTagContext';

export function TagFilter() {
  const { tags, filterTagIds, hasTagFilter, toggleFilterTag, clearFilter } = useTagContext();

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 flex-wrap">
      {tags.map(tag => {
        const isActive = filterTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => toggleFilterTag(tag.id)}
            className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            }`}
            style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
          >
            {tag.name}
          </button>
        );
      })}
      {hasTagFilter && (
        <button
          onClick={clearFilter}
          className="text-notion-text-secondary hover:text-notion-text p-0.5 rounded"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
