import { ListTodo, Heart, CheckCircle2 } from 'lucide-react';
import type { AIRequestType } from '../../types/ai';

interface AIRequestButtonsProps {
  onRequest: (type: AIRequestType) => void;
  isLoading: boolean;
}

const buttons: { type: AIRequestType; label: string; icon: typeof ListTodo }[] = [
  { type: 'breakdown', label: 'ステップ分解', icon: ListTodo },
  { type: 'encouragement', label: '励まし', icon: Heart },
  { type: 'review', label: 'レビュー', icon: CheckCircle2 },
];

export function AIRequestButtons({ onRequest, isLoading }: AIRequestButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onRequest(type)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md
            border border-notion-border text-notion-text-secondary
            hover:bg-notion-hover hover:text-notion-text
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
