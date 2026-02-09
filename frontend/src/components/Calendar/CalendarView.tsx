import { useState, useMemo } from 'react';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import { useMemoContext } from '../../hooks/useMemoContext';
import { useCalendar } from '../../hooks/useCalendar';
import { CalendarHeader } from './CalendarHeader';
import { MonthlyView } from './MonthlyView';
import { WeeklyTimeGrid } from './WeeklyTimeGrid';
import type { MemoNode } from '../../types/memo';

interface CalendarViewProps {
  onSelectTask: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  onSelectMemo?: (date: string) => void;
}

function getInitialWeekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalendarView({ onSelectTask, onCreateTask, onSelectMemo }: CalendarViewProps) {
  const { nodes, getTaskColor, getFolderTagForTask } = useTaskTreeContext();
  const { memos } = useMemoContext();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filter, setFilter] = useState<'incomplete' | 'completed'>('incomplete');
  const [weekStartDate, setWeekStartDate] = useState<Date>(getInitialWeekStart);
  const [tagFilter, setTagFilter] = useState<string>('');

  const { tasksByDate, calendarDays, weekDays } = useCalendar(nodes, year, month, filter, weekStartDate);

  // Build memos lookup by date
  const memosByDate = useMemo(() => {
    const map = new Map<string, MemoNode>();
    for (const memo of memos) {
      map.set(memo.date, memo);
    }
    return map;
  }, [memos]);

  const handlePrev = () => {
    if (viewMode === 'week') {
      setWeekStartDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      });
    } else {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setWeekStartDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      });
    } else {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setWeekStartDate(getInitialWeekStart());
  };

  // Collect available tags from visible tasks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const [, tasks] of tasksByDate) {
      for (const task of tasks) {
        tagSet.add(getFolderTagForTask(task.id) || 'Inbox');
      }
    }
    if (memosByDate.size > 0) {
      tagSet.add('Memo');
    }
    return Array.from(tagSet).sort();
  }, [tasksByDate, getFolderTagForTask, memosByDate]);

  // Filter tasksByDate by tag
  const filteredTasksByDate = useMemo(() => {
    if (!tagFilter) return tasksByDate;
    if (tagFilter === 'Memo') return new Map<string, typeof nodes>();
    const map = new Map<string, typeof nodes>();
    for (const [date, tasks] of tasksByDate) {
      const matching = tasks.filter(t => (getFolderTagForTask(t.id) || 'Inbox') === tagFilter);
      if (matching.length > 0) map.set(date, matching);
    }
    return map;
  }, [tasksByDate, tagFilter, getFolderTagForTask]);

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-5xl mx-auto w-full px-8 py-6 flex-1">
        <CalendarHeader
          year={year}
          month={month}
          viewMode={viewMode}
          weekStartDate={weekStartDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onViewModeChange={setViewMode}
        />

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter('incomplete')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === 'incomplete'
                ? 'bg-notion-accent/10 text-notion-accent'
                : 'text-notion-text-secondary hover:bg-notion-hover'
            }`}
          >
            Incomplete
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === 'completed'
                ? 'bg-notion-accent/10 text-notion-accent'
                : 'text-notion-text-secondary hover:bg-notion-hover'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Tag filter chips */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            <button
              onClick={() => setTagFilter('')}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                tagFilter === ''
                  ? 'bg-notion-accent/10 text-notion-accent font-medium'
                  : 'bg-notion-bg-secondary text-notion-text-secondary hover:bg-notion-hover'
              }`}
            >
              All
            </button>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  tagFilter === tag
                    ? 'bg-notion-accent/10 text-notion-accent font-medium'
                    : 'bg-notion-bg-secondary text-notion-text-secondary hover:bg-notion-hover'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {viewMode === 'month' ? (
          <MonthlyView
            days={calendarDays}
            tasksByDate={filteredTasksByDate}
            onSelectTask={onSelectTask}
            onCreateTask={onCreateTask}
            getTaskColor={getTaskColor}
            getFolderTag={getFolderTagForTask}
            memosByDate={memosByDate}
            onSelectMemo={onSelectMemo}
          />
        ) : (
          <WeeklyTimeGrid
            days={weekDays}
            tasksByDate={filteredTasksByDate}
            onSelectTask={onSelectTask}
            onCreateTask={onCreateTask}
            getTaskColor={getTaskColor}
            getFolderTag={getFolderTagForTask}
            memosByDate={memosByDate}
            onSelectMemo={onSelectMemo}
          />
        )}
      </div>
    </div>
  );
}
