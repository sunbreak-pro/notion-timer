import { useEffect } from 'react';
import { RotateCcw, Trash2, Folder, FileText, StickyNote } from 'lucide-react';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import { useNoteContext } from '../../hooks/useNoteContext';

export function TrashBin() {
  const { deletedNodes, restoreNode, permanentDelete } = useTaskTreeContext();
  const { deletedNotes, loadDeletedNotes, restoreNote, permanentDeleteNote } = useNoteContext();

  useEffect(() => {
    loadDeletedNotes();
  }, [loadDeletedNotes]);

  const topLevelDeleted = deletedNodes.filter(n => {
    if (!n.parentId) return true;
    return !deletedNodes.some(d => d.id === n.parentId);
  });

  const isEmpty = topLevelDeleted.length === 0 && deletedNotes.length === 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-notion-text">Trash</h3>

      {isEmpty ? (
        <p className="text-sm text-notion-text-secondary py-4">Trash is empty</p>
      ) : (
        <div className="space-y-4">
          {/* Tasks section */}
          {topLevelDeleted.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-notion-text-secondary uppercase tracking-wide px-1">Tasks</h4>
              {topLevelDeleted.map(node => {
                const Icon = node.type === 'task' ? FileText : Folder;
                return (
                  <div
                    key={node.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-notion-hover group"
                  >
                    <Icon size={16} className="text-notion-text-secondary shrink-0" />
                    <span className="flex-1 text-sm text-notion-text truncate">{node.title}</span>
                    <span className="text-xs text-notion-text-secondary">{node.type}</span>
                    <button
                      onClick={() => restoreNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-success transition-opacity"
                      title="Restore"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => permanentDelete(node.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
                      title="Delete permanently"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes section */}
          {deletedNotes.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-notion-text-secondary uppercase tracking-wide px-1">Notes</h4>
              {deletedNotes.map(note => (
                <div
                  key={note.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-notion-hover group"
                >
                  <StickyNote size={16} className="text-notion-text-secondary shrink-0" />
                  <span className="flex-1 text-sm text-notion-text truncate">{note.title}</span>
                  <span className="text-xs text-notion-text-secondary">note</span>
                  <button
                    onClick={() => restoreNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-success transition-opacity"
                    title="Restore"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => permanentDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
                    title="Delete permanently"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
