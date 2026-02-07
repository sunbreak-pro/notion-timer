import { FileText } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-notion-text-secondary gap-4">
      <FileText size={48} strokeWidth={1} />
      <p className="text-sm">Select a task to view details</p>
    </div>
  );
}
