import { X } from 'lucide-react';
import type { AIAdviceResponse } from '../../types/ai';

interface AIAdviceDisplayProps {
  advice: AIAdviceResponse;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  breakdown: 'ステップ分解',
  encouragement: '励まし',
  review: 'レビュー',
};

export function AIAdviceDisplay({ advice, onClose }: AIAdviceDisplayProps) {
  return (
    <div className="mt-4 p-4 rounded-md bg-notion-bg-secondary border border-notion-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-notion-accent">
          {typeLabels[advice.requestType] ?? advice.requestType}
        </span>
        <button
          onClick={onClose}
          className="text-notion-text-secondary hover:text-notion-text transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed">
        {advice.advice}
      </div>
    </div>
  );
}
