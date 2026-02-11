import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-notion-bg rounded-lg shadow-xl w-80 p-4">
        <p className="text-sm text-notion-text mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-notion-text-secondary hover:text-notion-text rounded-md hover:bg-notion-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm text-white bg-notion-accent hover:bg-notion-accent/90 rounded-md transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
