import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTagContext } from '../../hooks/useTagContext';
import { TagBadge } from './TagBadge';
import type { Tag } from '../../types/tag';

const DEFAULT_COLORS = ['#808080', '#E03E3E', '#D9730D', '#DFAB01', '#0F7B6C', '#2EAADC', '#6940A5', '#AD1457'];

interface TagEditorProps {
  taskId: string;
}

export function TagEditor({ taskId }: TagEditorProps) {
  const { tags, getTagsForTask, loadTagsForTask, setTagsForTask, createTag, taskTagsVersion } = useTagContext();
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const taskTags = getTagsForTask(taskId);

  useEffect(() => {
    loadTagsForTask(taskId);
  }, [taskId, loadTagsForTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const toggleTag = (tag: Tag) => {
    const current = taskTags.map(t => t.id);
    const next = current.includes(tag.id)
      ? current.filter(id => id !== tag.id)
      : [...current, tag.id];
    setTagsForTask(taskId, next);
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const tag = await createTag(trimmed, newTagColor);
    const current = taskTags.map(t => t.id);
    setTagsForTask(taskId, [...current, tag.id]);
    setNewTagName('');
  };

  // Force re-render when cache changes
  void taskTagsVersion;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1 flex-wrap">
        {taskTags.map(tag => (
          <TagBadge
            key={tag.id}
            tag={tag}
            size="md"
            onRemove={() => toggleTag(tag)}
          />
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-0.5 text-xs text-notion-text-secondary hover:text-notion-text px-1.5 py-0.5 rounded hover:bg-notion-hover transition-colors"
        >
          <Plus size={12} />
          <span>Tag</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg w-56 max-h-72 overflow-auto">
          {/* Existing tags */}
          <div className="p-1">
            {tags.length === 0 && (
              <div className="px-3 py-2 text-xs text-notion-text-secondary">No tags yet</div>
            )}
            {tags.map(tag => {
              const isSelected = taskTags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isSelected ? 'bg-notion-accent/10' : 'hover:bg-notion-hover'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-notion-text truncate">{tag.name}</span>
                  {isSelected && <span className="ml-auto text-notion-accent text-xs">&#10003;</span>}
                </button>
              );
            })}
          </div>

          {/* Create new tag */}
          <div className="border-t border-notion-border p-2">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      newTagColor === color ? 'scale-125 ring-1 ring-notion-text' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); }}
                placeholder="New tag..."
                className="flex-1 text-xs px-2 py-1 rounded bg-notion-hover text-notion-text border-none outline-none"
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="text-xs px-2 py-1 rounded bg-notion-accent text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
