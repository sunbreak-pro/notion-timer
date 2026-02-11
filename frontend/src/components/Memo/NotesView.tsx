import { lazy, Suspense, useCallback } from "react";
import { Pin, PinOff, StickyNote } from "lucide-react";
import { useNoteContext } from "../../hooks/useNoteContext";
import { NoteList } from "./NoteList";
import { NoteTagBar } from "./NoteTagBar";

const MemoEditor = lazy(() =>
  import("../TaskDetail/MemoEditor").then((m) => ({ default: m.MemoEditor })),
);

export function NotesView() {
  const { selectedNote, updateNote, togglePin } = useNoteContext();

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedNote) {
        updateNote(selectedNote.id, { title: e.target.value });
      }
    },
    [selectedNote, updateNote],
  );

  const handleContentUpdate = useCallback(
    (content: string) => {
      if (selectedNote) {
        updateNote(selectedNote.id, { content });
      }
    },
    [selectedNote, updateNote],
  );

  return (
    <div className="flex h-full">
      <NoteList />

      <div className="flex-1 overflow-y-auto">
        {selectedNote ? (
          <div className="max-w-3xl mx-auto px-8 py-6">
            {/* Title + Pin */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={selectedNote.title}
                onChange={handleTitleChange}
                placeholder="Untitled"
                className="flex-1 text-lg font-semibold text-notion-text bg-transparent border-none outline-none placeholder:text-notion-text-secondary"
              />
              <button
                onClick={() => togglePin(selectedNote.id)}
                className={`p-1.5 rounded transition-colors ${
                  selectedNote.isPinned
                    ? "text-notion-primary hover:text-notion-primary/70"
                    : "text-notion-text-secondary hover:text-notion-text"
                }`}
                title={selectedNote.isPinned ? "Unpin" : "Pin"}
              >
                {selectedNote.isPinned ? (
                  <PinOff size={16} />
                ) : (
                  <Pin size={16} />
                )}
              </button>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <NoteTagBar noteId={selectedNote.id} />
            </div>

            {/* Editor */}
            <Suspense
              fallback={
                <div className="text-notion-text-secondary text-sm">
                  Loading editor...
                </div>
              }
            >
              <MemoEditor
                taskId={selectedNote.id}
                initialContent={selectedNote.content}
                onUpdate={handleContentUpdate}
              />
            </Suspense>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-notion-text-secondary">
            <StickyNote size={48} strokeWidth={1} className="mb-3 opacity-30" />
            <p className="text-sm">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
