import { BookOpen, Plus, Trash2 } from 'lucide-react';
import type { MemoNode } from '../../types/memo';

interface MemoDateListProps {
  memos: MemoNode[];
  selectedDate: string;
  todayKey: string;
  onSelectDate: (date: string) => void;
  onCreateToday: () => void;
  onDelete: (date: string) => void;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const now = new Date();
  if (year !== now.getFullYear()) {
    return `${month} ${day}, ${year}`;
  }
  return `${month} ${day}`;
}

export function MemoDateList({
  memos,
  selectedDate,
  todayKey,
  onSelectDate,
  onCreateToday,
  onDelete,
}: MemoDateListProps) {
  const hasTodayMemo = memos.some(m => m.date === todayKey);

  return (
    <div className="w-60 flex-shrink-0 border-r border-notion-border h-full flex flex-col">
      <div className="p-3 border-b border-notion-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-notion-text">
            <BookOpen size={16} />
            <span className="text-sm font-medium">Memo</span>
          </div>
          {!hasTodayMemo && (
            <button
              onClick={onCreateToday}
              className="p-1 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
              title="Create today's memo"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {/* Today shortcut - always visible */}
        <button
          onClick={() => onSelectDate(todayKey)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            selectedDate === todayKey
              ? 'bg-notion-hover text-notion-text font-medium'
              : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text'
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          Today
        </button>

        {/* Memo date list */}
        {memos
          .filter(m => m.date !== todayKey)
          .map(memo => (
            <div key={memo.id} className="group relative">
              <button
                onClick={() => onSelectDate(memo.date)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedDate === memo.date
                    ? 'bg-notion-hover text-notion-text font-medium'
                    : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-notion-text-secondary/30 flex-shrink-0" />
                {formatDisplayDate(memo.date)}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memo.date);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-red-500 rounded transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
