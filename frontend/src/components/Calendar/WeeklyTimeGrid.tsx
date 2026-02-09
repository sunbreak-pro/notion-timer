import { useEffect, useRef, useState, useMemo } from 'react';
import type { TaskNode } from '../../types/taskTree';
import type { MemoNode } from '../../types/memo';
import { TIME_GRID } from '../../constants/timeGrid';
import { TimeGridTaskBlock } from './TimeGridTaskBlock';
import { formatDateKey } from '../../hooks/useCalendar';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: TIME_GRID.END_HOUR - TIME_GRID.START_HOUR }, (_, i) => i + TIME_GRID.START_HOUR);
const GUTTER_WIDTH = 52;

interface WeeklyTimeGridProps {
  days: { date: Date; isCurrentMonth: boolean }[];
  tasksByDate: Map<string, TaskNode[]>;
  onSelectTask: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  getTaskColor?: (taskId: string) => string | undefined;
  getFolderTag?: (taskId: string) => string;
  memosByDate?: Map<string, MemoNode>;
  onSelectMemo?: (date: string) => void;
}

interface PositionedTask {
  task: TaskNode;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

function getTaskPosition(task: TaskNode): { hour: number; minute: number } {
  if (!task.scheduledAt) return { hour: 12, minute: 0 };
  const d = new Date(task.scheduledAt);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

function layoutOverlappingTasks(tasks: TaskNode[]): PositionedTask[] {
  const positioned: PositionedTask[] = tasks.map(task => {
    const { hour, minute } = getTaskPosition(task);
    const top = (hour - TIME_GRID.START_HOUR) * TIME_GRID.SLOT_HEIGHT + (minute / 60) * TIME_GRID.SLOT_HEIGHT;
    const duration = task.workDurationMinutes ?? 25;
    const height = Math.max((duration / 60) * TIME_GRID.SLOT_HEIGHT, 20);
    return { task, top, height, column: 0, totalColumns: 1 };
  });

  positioned.sort((a, b) => a.top - b.top);

  const groups: PositionedTask[][] = [];
  for (const item of positioned) {
    let placed = false;
    for (const group of groups) {
      const overlaps = group.some(g => item.top < g.top + g.height && item.top + item.height > g.top);
      if (overlaps) {
        item.column = group.length;
        group.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      item.column = 0;
      groups.push([item]);
    }
  }

  for (const group of groups) {
    const total = Math.min(group.length, 5);
    for (const item of group) {
      item.totalColumns = total;
    }
  }

  return positioned;
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function WeeklyTimeGrid({ days, tasksByDate, onSelectTask, onCreateTask, getTaskColor, getFolderTag, memosByDate, onSelectMemo }: WeeklyTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayKey = formatDateKey(new Date());
  const totalHeight = (TIME_GRID.END_HOUR - TIME_GRID.START_HOUR) * TIME_GRID.SLOT_HEIGHT;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 1) * TIME_GRID.SLOT_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  const positionedByDay = useMemo(() => {
    const map = new Map<string, PositionedTask[]>();
    for (const day of days) {
      const key = formatDateKey(day.date);
      const tasks = (tasksByDate.get(key) ?? []).filter(t => t.scheduledAt);
      map.set(key, layoutOverlappingTasks(tasks));
    }
    return map;
  }, [days, tasksByDate]);

  const handleColumnClick = (dayDate: Date, e: React.MouseEvent<HTMLDivElement>) => {
    if (!onCreateTask) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawHour = y / TIME_GRID.SLOT_HEIGHT + TIME_GRID.START_HOUR;
    const snappedMinute = Math.round((rawHour % 1) * 60 / 15) * 15;
    const hour = Math.floor(rawHour);
    const date = new Date(dayDate);
    date.setHours(hour, snappedMinute >= 60 ? 0 : snappedMinute, 0, 0);
    if (snappedMinute >= 60) date.setHours(hour + 1);
    onCreateTask(date);
  };

  const currentTimeTop = (currentTime.getHours() - TIME_GRID.START_HOUR) * TIME_GRID.SLOT_HEIGHT
    + (currentTime.getMinutes() / 60) * TIME_GRID.SLOT_HEIGHT;

  return (
    <div className="border border-notion-border rounded-lg overflow-hidden bg-notion-bg">
      {/* Header row */}
      <div className="flex border-b border-notion-border sticky top-0 bg-notion-bg z-20">
        <div style={{ width: GUTTER_WIDTH }} className="flex-shrink-0" />
        {days.map((day, i) => {
          const key = formatDateKey(day.date);
          const isToday = key === todayKey;
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-notion-border">
              <div className="text-xs text-notion-text-secondary">{DAY_NAMES[day.date.getDay()]}</div>
              <div className="flex items-center justify-center gap-1">
                <div className={`text-sm font-medium ${
                  isToday
                    ? 'w-7 h-7 flex items-center justify-center rounded-full bg-notion-accent text-white'
                    : 'text-notion-text'
                }`}>
                  {day.date.getDate()}
                </div>
                {memosByDate?.has(key) && (
                  <button
                    onClick={() => onSelectMemo?.(key)}
                    className="w-2 h-2 rounded-full flex-shrink-0 hover:scale-125 transition-transform"
                    style={{ backgroundColor: '#F59E0B' }}
                    title="Memo"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <div className="flex relative" style={{ height: totalHeight }}>
          {/* Time gutter */}
          <div style={{ width: GUTTER_WIDTH }} className="flex-shrink-0 relative">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute right-2 text-[10px] text-notion-text-secondary -translate-y-1/2"
                style={{ top: (hour - TIME_GRID.START_HOUR) * TIME_GRID.SLOT_HEIGHT }}
              >
                {hour > 0 && formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => {
            const key = formatDateKey(day.date);
            const isToday = key === todayKey;
            const positioned = positionedByDay.get(key) ?? [];

            return (
              <div
                key={i}
                className="flex-1 relative border-l border-notion-border cursor-pointer"
                onClick={(e) => handleColumnClick(day.date, e)}
              >
                {/* Hour grid lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-notion-border/50"
                    style={{ top: (hour - TIME_GRID.START_HOUR) * TIME_GRID.SLOT_HEIGHT }}
                  />
                ))}

                {/* Current time indicator */}
                {isToday && (
                  <div
                    className="absolute w-full z-30 pointer-events-none"
                    style={{ top: currentTimeTop }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Task blocks */}
                {positioned.map((p) => (
                  <TimeGridTaskBlock
                    key={p.task.id}
                    task={p.task}
                    top={p.top}
                    height={p.height}
                    left={`${(p.column / p.totalColumns) * 100}%`}
                    width={`${(1 / p.totalColumns) * 100}%`}
                    color={getTaskColor?.(p.task.id)}
                    tag={getFolderTag?.(p.task.id)}
                    onClick={() => onSelectTask(p.task.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
