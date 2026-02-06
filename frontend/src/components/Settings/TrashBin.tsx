import { RotateCcw, Trash2, Folder, FileText } from 'lucide-react';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';

export function TrashBin() {
  const { deletedNodes, restoreNode, permanentDelete } = useTaskTreeContext();

  const topLevelDeleted = deletedNodes.filter(n => {
    if (!n.parentId) return true;
    return !deletedNodes.some(d => d.id === n.parentId);
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-notion-text">Trash</h3>

      {topLevelDeleted.length === 0 ? (
        <p className="text-sm text-notion-text-secondary py-4">Trash is empty</p>
      ) : (
        <div className="space-y-1">
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
    </div>
  );
}
