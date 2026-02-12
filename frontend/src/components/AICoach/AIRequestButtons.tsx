import { ListTodo, Heart, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AIRequestType } from '../../types/ai';

interface AIRequestButtonsProps {
  onRequest: (type: AIRequestType) => void;
  isLoading: boolean;
}

const buttons: { type: AIRequestType; labelKey: string; icon: typeof ListTodo }[] = [
  { type: 'breakdown', labelKey: 'aiButtons.breakdown', icon: ListTodo },
  { type: 'encouragement', labelKey: 'aiButtons.encouragement', icon: Heart },
  { type: 'review', labelKey: 'aiButtons.review', icon: CheckCircle2 },
];

export function AIRequestButtons({ onRequest, isLoading }: AIRequestButtonsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map(({ type, labelKey, icon: Icon }) => (
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
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
