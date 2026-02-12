import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileDown, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTemplates } from '../../hooks/useTemplates';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import type { TaskNode } from '../../types/taskTree';

interface TemplateDialogProps {
  onClose: () => void;
}

export function TemplateDialog({ onClose }: TemplateDialogProps) {
  const { t } = useTranslation();
  const { templates, deleteTemplate } = useTemplates();
  const { addNode, updateNode } = useTaskTreeContext();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleApply = (template: { nodesJson: string }) => {
    try {
      const originalNodes: TaskNode[] = JSON.parse(template.nodesJson);
      // Sort: parents before children (root folder first, then by depth)
      const sorted = [...originalNodes].sort((a, b) => {
        const aDepth = getDepth(a.id, originalNodes);
        const bDepth = getDepth(b.id, originalNodes);
        return aDepth - bDepth;
      });

      const idMap = new Map<string, string>();

      for (const node of sorted) {
        const newParentId = node.parentId ? (idMap.get(node.parentId) ?? null) : null;
        const created = addNode(node.type, newParentId, node.title);
        if (created) {
          idMap.set(node.id, created.id);
          // Set extra fields if present
          const updates: Partial<TaskNode> = {};
          if (node.content) updates.content = node.content;
          if (node.workDurationMinutes) updates.workDurationMinutes = node.workDurationMinutes;
          if (Object.keys(updates).length > 0) {
            updateNode(created.id, updates);
          }
        }
      }
      onClose();
    } catch (e) {
      console.warn('[Templates] apply:', e);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={dialogRef} className="bg-notion-bg rounded-lg shadow-xl w-96 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-notion-border">
          <h3 className="text-lg font-semibold text-notion-text">{t('templates.title')}</h3>
          <button onClick={onClose} className="text-notion-text-secondary hover:text-notion-text">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-sm text-notion-text-secondary">
              <p>{t('templates.empty')}</p>
              <p className="mt-1">{t('templates.hint')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-notion-hover group"
                >
                  <span className="flex-1 text-sm text-notion-text truncate">{template.name}</span>
                  <button
                    onClick={() => handleApply(template)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-notion-accent hover:text-notion-accent/80"
                    title={t('templates.apply')}
                  >
                    <FileDown size={14} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger"
                    title={t('templates.deleteTemplate')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function getDepth(nodeId: string, nodes: TaskNode[]): number {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return 0;
  return 1 + getDepth(node.parentId, nodes);
}
