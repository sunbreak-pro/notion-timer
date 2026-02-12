import { Plus } from 'lucide-react';

interface EmptySlotProps {
  onAddClick: () => void;
}

export function EmptySlot({ onAddClick }: EmptySlotProps) {
  return (
    <button
      onClick={onAddClick}
      className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-notion-border hover:border-notion-accent/50 hover:bg-notion-accent/5 transition-colors group"
    >
      <Plus size={16} className="text-notion-text-secondary group-hover:text-notion-accent transition-colors" />
      <span className="text-sm text-notion-text-secondary group-hover:text-notion-accent transition-colors">
        Add Sound
      </span>
    </button>
  );
}
