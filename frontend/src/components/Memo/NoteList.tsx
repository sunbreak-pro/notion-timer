import { useState, useEffect, useRef } from "react";
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useNoteContext } from "../../hooks/useNoteContext";
import { useTagContext } from "../../hooks/useTagContext";
import type { NoteSortMode } from "../../types/note";

const SORT_LABELS: Record<NoteSortMode, string> = {
  updatedAt: "Updated",
  createdAt: "Created",
  title: "Title",
};

function getContentPreview(content: string, maxLength = 40): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    const text = extractText(parsed);
    return text.slice(0, maxLength) || "";
  } catch {
    return content.slice(0, maxLength);
  }
}

function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (n.type === "text" && typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) {
    return n.content.map(extractText).join(" ");
  }
  return "";
}

export function NoteList() {
  const {
    sortedFilteredNotes,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    filterTagIds,
    setFilterTagIds,
    createNote,
    softDeleteNote,
    getTagsForNote,
  } = useNoteContext();

  const { tags } = useTagContext();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, setSearchQuery]);

  const toggleTagFilter = (tagId: number) => {
    setFilterTagIds((prev: number[]) =>
      prev.includes(tagId) ? prev.filter((id: number) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="w-64 shrink-0 border-r border-notion-border h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-notion-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-notion-text">
            <StickyNote size={16} />
            <span className="text-sm font-medium">Notes</span>
          </div>
          <button
            onClick={() => createNote()}
            className="p-1 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
            title="New note"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-notion-text-secondary"
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-notion-bg-secondary border border-notion-border rounded-md text-notion-text placeholder:text-notion-text-secondary focus:outline-none focus:border-notion-primary"
          />
        </div>
      </div>

      {/* Sort + Tag filter row */}
      <div className="px-3 py-1 flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-notion-text-secondary hover:text-notion-text rounded transition-colors"
          >
            <ArrowUpDown size={12} />
            {SORT_LABELS[sortMode]}
          </button>
          {showSortMenu && (
            <div className="absolute top-full left-0 mt-1 bg-notion-bg border border-notion-border rounded-md shadow-lg z-10 py-1">
              {(Object.keys(SORT_LABELS) as NoteSortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSortMode(mode);
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-notion-hover transition-colors ${
                    sortMode === mode
                      ? "text-notion-primary font-medium"
                      : "text-notion-text"
                  }`}
                >
                  {SORT_LABELS[mode]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="px-3 pb-2 flex gap-1 flex-wrap">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTagFilter(tag.id)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                filterTagIds.includes(tag.id)
                  ? "border-transparent text-white"
                  : "border-notion-border text-notion-text-secondary hover:text-notion-text"
              }`}
              style={
                filterTagIds.includes(tag.id)
                  ? { backgroundColor: tag.color }
                  : undefined
              }
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Note items */}
      <div className="flex-1 overflow-y-auto p-1">
        {sortedFilteredNotes.length === 0 && (
          <p className="text-xs text-notion-text-secondary text-center py-4">
            {searchQuery || filterTagIds.length > 0
              ? "No matching notes"
              : "No notes yet"}
          </p>
        )}
        {sortedFilteredNotes.map((note) => {
          const noteTags = getTagsForNote(note.id);
          return (
            <div key={note.id} className="group relative">
              <button
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedNoteId === note.id
                    ? "bg-notion-hover"
                    : "hover:bg-notion-hover"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {note.isPinned && (
                    <Pin
                      size={10}
                      className="text-notion-primary shrink-0"
                    />
                  )}
                  <span className="text-sm text-notion-text truncate font-medium">
                    {note.title || "Untitled"}
                  </span>
                </div>
                {note.content && (
                  <p className="text-xs text-notion-text-secondary truncate mt-0.5">
                    {getContentPreview(note.content)}
                  </p>
                )}
                {noteTags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {noteTags.map((t) => (
                      <div
                        key={t.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      />
                    ))}
                  </div>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  softDeleteNote(note.id);
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-red-500 rounded transition-all"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
