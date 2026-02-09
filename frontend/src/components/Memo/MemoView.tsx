import { lazy, Suspense, useCallback } from 'react';
import { useMemoContext } from '../../hooks/useMemoContext';
import { MemoDateList } from './MemoDateList';

const MemoEditor = lazy(() =>
  import('../TaskDetail/MemoEditor').then((m) => ({ default: m.MemoEditor })),
);

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function MemoView() {
  const { memos, selectedDate, setSelectedDate, selectedMemo, upsertMemo, deleteMemo } = useMemoContext();
  const todayKey = getTodayKey();

  const handleUpdate = useCallback((content: string) => {
    upsertMemo(selectedDate, content);
  }, [selectedDate, upsertMemo]);

  const handleCreateToday = useCallback(() => {
    setSelectedDate(todayKey);
    // Create an empty memo for today if it doesn't exist
    if (!memos.some(m => m.date === todayKey)) {
      upsertMemo(todayKey, '');
    }
  }, [todayKey, setSelectedDate, memos, upsertMemo]);

  const handleDelete = useCallback((date: string) => {
    deleteMemo(date);
    if (selectedDate === date) {
      setSelectedDate(todayKey);
    }
  }, [deleteMemo, selectedDate, setSelectedDate, todayKey]);

  return (
    <div className="h-full flex">
      <MemoDateList
        memos={memos}
        selectedDate={selectedDate}
        todayKey={todayKey}
        onSelectDate={setSelectedDate}
        onCreateToday={handleCreateToday}
        onDelete={handleDelete}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <h2 className="text-lg font-semibold text-notion-text mb-4">
            {formatDateHeading(selectedDate)}
          </h2>
          <Suspense fallback={<div className="text-notion-text-secondary text-sm">Loading editor...</div>}>
            <MemoEditor
              taskId={selectedDate}
              initialContent={selectedMemo?.content}
              onUpdate={handleUpdate}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
