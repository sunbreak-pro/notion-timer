import { useEffect } from 'react';
import { Coffee, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SessionCompletionModalProps {
  onExtend: (minutes: number) => void;
  onStartRest: () => void;
  onDismiss: () => void;
  onCompleteTask?: () => void;
}

const EXTEND_OPTIONS = [5, 10, 15, 20, 25, 30];

export function SessionCompletionModal({
  onExtend,
  onStartRest,
  onDismiss,
  onCompleteTask,
}: SessionCompletionModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 w-full max-w-sm mx-4 bg-notion-bg rounded-xl shadow-2xl border border-notion-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-notion-text text-center mb-4">
          {t('sessionModal.workComplete')}
        </h2>

        <div className="space-y-4">
          <button
            onClick={onStartRest}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-notion-accent text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Coffee size={18} />
            {t('sessionModal.takeBreak')}
          </button>

          {onCompleteTask && (
            <button
              onClick={onCompleteTask}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              <CheckCircle2 size={18} />
              {t('sessionModal.completeTask')}
            </button>
          )}

          <div>
            <p className="text-sm text-notion-text-secondary mb-2 text-center">{t('sessionModal.extend')}</p>
            <div className="grid grid-cols-3 gap-2">
              {EXTEND_OPTIONS.map((min) => (
                <button
                  key={min}
                  onClick={() => onExtend(min)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-notion-text bg-notion-hover rounded-lg hover:bg-notion-border transition-colors"
                >
                  <Clock size={14} />
                  {t('sessionModal.minutes', { min })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
