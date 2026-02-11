import { useState } from 'react';
import { Pencil, Trash2, Check, X, CheckSquare, FileText } from 'lucide-react';
import { useTagContext } from '../../hooks/useTagContext';
import type { TagOperations } from '../../context/TagContext';
import type { Tag } from '../../types/tag';

const DEFAULT_COLORS = ['#808080', '#E03E3E', '#D9730D', '#DFAB01', '#0F7B6C', '#2EAADC', '#6940A5', '#AD1457'];

interface TagSectionProps {
  title: string;
  icon: React.ReactNode;
  ops: TagOperations;
}

function TagSection({ title, icon, ops }: TagSectionProps) {
  const { tags, createTag, updateTag, deleteTag } = ops;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);

  const startEdit = (id: number, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const saveEdit = async () => {
    if (editingId === null || !editName.trim()) return;
    await updateTag(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createTag(trimmed, newColor);
    setNewName('');
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-notion-text mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>

      <div className="space-y-1.5 mb-3">
        {tags.map((tag: Tag) => (
          <div key={tag.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-notion-hover group">
            {editingId === tag.id ? (
              <>
                <div className="flex gap-0.5">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className={`w-4 h-4 rounded-full ${editColor === color ? 'ring-1 ring-notion-text scale-125' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 text-sm px-2 py-0.5 rounded bg-notion-hover text-notion-text border-none outline-none"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1 text-notion-success"><Check size={14} /></button>
                <button onClick={() => setEditingId(null)} className="p-1 text-notion-text-secondary"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="flex-1 text-sm text-notion-text">{tag.name}</span>
                <button
                  onClick={() => startEdit(tag.id, tag.name, tag.color)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-text transition-opacity"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-notion-text-secondary px-2">No tags created yet.</p>
        )}
      </div>

      {/* Create new tag */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {DEFAULT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setNewColor(color)}
              className={`w-4 h-4 rounded-full transition-transform ${newColor === color ? 'ring-1 ring-notion-text scale-125' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          placeholder="New tag name..."
          className="flex-1 text-sm px-2 py-1 rounded bg-notion-hover text-notion-text border-none outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="text-sm px-3 py-1 rounded bg-notion-accent text-white disabled:opacity-40"
        >
          Create
        </button>
      </div>
    </div>
  );
}

export function TagManager() {
  const { taskTags, noteTags } = useTagContext();

  return (
    <div>
      <h3 className="text-lg font-semibold text-notion-text mb-4">Tags</h3>
      <div className="space-y-6">
        <TagSection title="Task Tags" icon={<CheckSquare size={14} />} ops={taskTags} />
        <TagSection title="Note Tags" icon={<FileText size={14} />} ops={noteTags} />
      </div>
    </div>
  );
}
