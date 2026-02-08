import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  year: number;
  month: number;
  viewMode: 'month' | 'week';
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onViewModeChange: (mode: 'month' | 'week') => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarHeader({
  year,
  month,
  viewMode,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewModeChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-notion-text">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 rounded-md text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNextMonth}
            className="p-1 rounded-md text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={onToday}
          className="px-2 py-1 text-xs rounded-md border border-notion-border text-notion-text-secondary hover:bg-notion-hover transition-colors"
        >
          Today
        </button>
      </div>

      <div className="flex items-center gap-1 bg-notion-bg-secondary rounded-md p-0.5">
        <button
          onClick={() => onViewModeChange('month')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'month'
              ? 'bg-notion-bg text-notion-text shadow-sm'
              : 'text-notion-text-secondary hover:text-notion-text'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'week'
              ? 'bg-notion-bg text-notion-text shadow-sm'
              : 'text-notion-text-secondary hover:text-notion-text'
          }`}
        >
          Week
        </button>
      </div>
    </div>
  );
}
