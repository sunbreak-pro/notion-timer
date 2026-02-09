import { useState } from 'react';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import { useCalendar } from '../../hooks/useCalendar';
import { CalendarHeader } from './CalendarHeader';
import { MonthlyView } from './MonthlyView';
import { WeeklyTimeGrid } from './WeeklyTimeGrid';

interface CalendarViewProps {
  onSelectTask: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
}

export function CalendarView({ onSelectTask, onCreateTask }: CalendarViewProps) {
  const { nodes, getTaskColor, getFolderTagForTask } = useTaskTreeContext();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filter, setFilter] = useState<'incomplete' | 'completed'>('incomplete');

  const { tasksByDate, calendarDays, weekDays } = useCalendar(nodes, year, month, filter);

  const handlePrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-5xl mx-auto w-full px-8 py-6 flex-1">
        <CalendarHeader
          year={year}
          month={month}
          viewMode={viewMode}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
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

        {viewMode === 'month' ? (
          <MonthlyView
            days={calendarDays}
            tasksByDate={tasksByDate}
            onSelectTask={onSelectTask}
            onCreateTask={onCreateTask}
            getTaskColor={getTaskColor}
            getFolderTag={getFolderTagForTask}
          />
        ) : (
          <WeeklyTimeGrid
            days={weekDays}
            tasksByDate={tasksByDate}
            onSelectTask={onSelectTask}
            onCreateTask={onCreateTask}
            getTaskColor={getTaskColor}
            getFolderTag={getFolderTagForTask}
          />
        )}
      </div>
    </div>
  );
}
