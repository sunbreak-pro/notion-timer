import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useTagContext } from "../../hooks/useTagContext";

interface NoteTagBarProps {
  noteId: string;
}

export function NoteTagBar({ noteId }: NoteTagBarProps) {
  const { noteTags: { tags, getTagsForEntity, loadTagsForEntity, setTagsForEntity, entityTagsVersion } } = useTagContext();
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadTagsForEntity(noteId);
  }, [noteId, loadTagsForEntity]);

  // Force re-render when cache changes
  void entityTagsVersion;

  const noteTags = getTagsForEntity(noteId);
  const noteTagIds = noteTags.map((t) => t.id);
  const availableTags = tags.filter((t) => !noteTagIds.includes(t.id));

  const handleAdd = (tagId: number) => {
    const newIds = [...noteTagIds, tagId];
    setTagsForEntity(noteId, newIds);
    setShowPicker(false);
  };

  const handleRemove = (tagId: number) => {
    const newIds = noteTagIds.filter((id) => id !== tagId);
    setTagsForEntity(noteId, newIds);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {noteTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          <button
            onClick={() => handleRemove(tag.id)}
            className="hover:opacity-70 transition-opacity"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      {availableTags.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-0.5 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
            title="Add tag"
          >
            <Plus size={14} />
          </button>
          {showPicker && (
            <div className="absolute top-full left-0 mt-1 bg-notion-bg border border-notion-border rounded-md shadow-lg z-10 py-1 min-w-[120px]">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAdd(tag.id)}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-notion-hover transition-colors text-notion-text"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
