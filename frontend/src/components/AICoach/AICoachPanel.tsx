import { Sparkles, Loader2, X, Settings } from 'lucide-react';
import { useAICoach } from '../../hooks/useAICoach';
import { AIRequestButtons } from './AIRequestButtons';
import { AIAdviceDisplay } from './AIAdviceDisplay';
import type { AIRequestType } from '../../types/ai';

interface AICoachPanelProps {
  taskTitle: string;
  taskContent?: string;
  onNavigateToSettings?: () => void;
}

export function AICoachPanel({ taskTitle, taskContent, onNavigateToSettings }: AICoachPanelProps) {
  const { advice, isLoading, error, errorCode, requestAdvice, clearAdvice } = useAICoach();

  const handleRequest = (type: AIRequestType) => {
    requestAdvice(taskTitle, taskContent, type);
  };

  const showSettingsLink = errorCode === 'API_KEY_NOT_CONFIGURED' || errorCode === 'INVALID_API_KEY';

  return (
    <div className="border-t border-notion-border pt-6 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-notion-accent" />
        <span className="text-sm font-medium text-notion-text-secondary">
          AI Coach
        </span>
      </div>

      <AIRequestButtons onRequest={handleRequest} isLoading={isLoading} />

      {isLoading && (
        <div className="flex items-center gap-2 mt-4 text-notion-text-secondary text-sm">
          <Loader2 size={14} className="animate-spin" />
          <span>考え中...</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-md bg-notion-danger/10 text-notion-danger text-sm">
          <div className="flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={clearAdvice} className="shrink-0 hover:opacity-70">
              <X size={14} />
            </button>
          </div>
          {showSettingsLink && onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="mt-2 inline-flex items-center gap-1 text-xs text-notion-accent hover:underline"
            >
              <Settings size={12} />
              Settings でAPIキーを設定する
            </button>
          )}
        </div>
      )}

      {advice && !isLoading && (
        <AIAdviceDisplay advice={advice} onClose={clearAdvice} />
      )}
    </div>
  );
}
