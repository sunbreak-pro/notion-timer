import { useState, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateKey } from '../../utils/dateKey';
import { formatScheduleRange } from '../../utils/formatSchedule';
import { useClickOutside } from '../../hooks/useClickOutside';

interface DateTimeRangePickerProps {
  startValue?: string;
  endValue?: string;
  isAllDay?: boolean;
  onStartChange: (value: string | undefined) => void;
  onEndChange: (value: string | undefined) => void;
  onAllDayChange: (value: boolean) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function DateTimeRangePicker({
  startValue,
  endValue,
  isAllDay,
  onStartChange,
  onEndChange,
  onAllDayChange,
}: DateTimeRangePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const startDate = startValue ? new Date(startValue) : new Date();
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate.getMonth());
  const [startHour, setStartHour] = useState(startDate.getHours());
  const [startMinute, setStartMinute] = useState(startDate.getMinutes());

  const endDate = endValue ? new Date(endValue) : null;
  const [endHour, setEndHour] = useState(endDate?.getHours() ?? startDate.getHours() + 1);
  const [endMinute, setEndMinute] = useState(endDate?.getMinutes() ?? 0);

  const [selectingEnd, setSelectingEnd] = useState(false);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(ref, closeDropdown, open);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = formatDateKey(new Date());
  const startKey = startValue ? formatDateKey(new Date(startValue)) : null;
  const endKey = endValue ? formatDateKey(new Date(endValue)) : null;

  const hasEndDate = !!endValue;

  const handleSelectDate = (day: number) => {
    if (!hasEndDate) {
      // No end date mode: always update start
      const dt = new Date(viewYear, viewMonth, day, isAllDay ? 0 : startHour, isAllDay ? 0 : startMinute);
      onStartChange(dt.toISOString());
    } else if (!selectingEnd) {
      const dt = new Date(viewYear, viewMonth, day, isAllDay ? 0 : startHour, isAllDay ? 0 : startMinute);
      onStartChange(dt.toISOString());
      setSelectingEnd(true);
    } else {
      const dt = new Date(viewYear, viewMonth, day, isAllDay ? 23 : endHour, isAllDay ? 59 : endMinute);
      const startDt = startValue ? new Date(startValue) : new Date();
      if (dt < startDt) {
        onStartChange(dt.toISOString());
        onEndChange(startDt.toISOString());
      } else {
        onEndChange(dt.toISOString());
      }
      setSelectingEnd(false);
    }
  };

  const handleToggleEndDate = (enabled: boolean) => {
    if (enabled) {
      // Default end = start + 1 hour
      const s = startValue ? new Date(startValue) : new Date();
      const e = new Date(s);
      e.setHours(e.getHours() + 1);
      setEndHour(e.getHours());
      setEndMinute(e.getMinutes());
      onEndChange(e.toISOString());
    } else {
      onEndChange(undefined);
      setSelectingEnd(false);
    }
  };

  const handleStartTimeChange = (h: number, m: number) => {
    setStartHour(h);
    setStartMinute(m);
    if (startValue) {
      const dt = new Date(startValue);
      dt.setHours(h, m);
      onStartChange(dt.toISOString());
    }
  };

  const handleEndTimeChange = (h: number, m: number) => {
    setEndHour(h);
    setEndMinute(m);
    if (endValue) {
      const dt = new Date(endValue);
      dt.setHours(h, m);
      onEndChange(dt.toISOString());
    }
  };

  const handleClear = () => {
    onStartChange(undefined);
    setSelectingEnd(false);
    setOpen(false);
  };

  const displayText = (() => {
    if (!startValue) return t('taskDetail.schedule');
    const text = formatScheduleRange(startValue, endValue, isAllDay);
    if (isAllDay) return `${text} (${t('taskDetail.allDay')})`;
    return text;
  })();

  const isInRange = (key: string) => {
    if (!startKey || !endKey) return false;
    return key >= startKey && key <= endKey;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-md transition-colors ${
          startValue
            ? 'text-notion-accent bg-notion-accent/10'
            : 'text-notion-text-secondary hover:bg-notion-hover'
        }`}
      >
        <CalendarIcon size={14} />
        <span>{displayText}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg p-3 w-72">
          {/* Toggles row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-notion-text-secondary">
              {selectingEnd ? t('taskDetail.endTime') : t('taskDetail.startTime')}
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs text-notion-text-secondary">{t('taskDetail.showEndTime')}</span>
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => handleToggleEndDate(e.target.checked)}
                  disabled={!!isAllDay}
                  className="w-3.5 h-3.5 rounded accent-notion-accent disabled:opacity-40"
                />
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs text-notion-text-secondary">{t('taskDetail.allDay')}</span>
                <input
                  type="checkbox"
                  checked={!!isAllDay}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onAllDayChange(checked);
                    if (checked) {
                      setSelectingEnd(false);
                    }
                  }}
                  className="w-3.5 h-3.5 rounded accent-notion-accent"
                />
              </label>
            </div>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                else setViewMonth(m => m - 1);
              }}
              className="p-1 rounded hover:bg-notion-hover text-notion-text-secondary"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-medium text-notion-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                else setViewMonth(m => m + 1);
              }}
              className="p-1 rounded hover:bg-notion-hover text-notion-text-secondary"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs text-notion-text-secondary py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = key === today;
              const isStart = key === startKey;
              const isEnd = key === endKey;
              const inRange = isInRange(key);
              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  className={`text-xs py-1 rounded transition-colors ${
                    isStart || isEnd
                      ? 'bg-notion-accent text-white'
                      : inRange
                      ? 'bg-notion-accent/20 text-notion-accent'
                      : isToday
                      ? 'bg-notion-accent/10 text-notion-accent font-bold'
                      : 'text-notion-text hover:bg-notion-hover'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time selectors */}
          {!isAllDay && (
            <div className="mt-3 pt-3 border-t border-notion-border space-y-2">
              {/* Start time */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-notion-text-secondary w-8">{t('taskDetail.startTime')}</span>
                <select
                  value={startHour}
                  onChange={e => handleStartTimeChange(Number(e.target.value), startMinute)}
                  className="flex-1 text-sm bg-notion-bg-secondary border border-notion-border rounded px-2 py-1 text-notion-text"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-notion-text-secondary">:</span>
                <select
                  value={startMinute}
                  onChange={e => handleStartTimeChange(startHour, Number(e.target.value))}
                  className="flex-1 text-sm bg-notion-bg-secondary border border-notion-border rounded px-2 py-1 text-notion-text"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>

              {/* End time (only if end date is enabled) */}
              {hasEndDate && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-notion-text-secondary w-8">{t('taskDetail.endTime')}</span>
                  <select
                    value={endHour}
                    onChange={e => handleEndTimeChange(Number(e.target.value), endMinute)}
                    className="flex-1 text-sm bg-notion-bg-secondary border border-notion-border rounded px-2 py-1 text-notion-text"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-notion-text-secondary">:</span>
                  <select
                    value={endMinute}
                    onChange={e => handleEndTimeChange(endHour, Number(e.target.value))}
                    className="flex-1 text-sm bg-notion-bg-secondary border border-notion-border rounded px-2 py-1 text-notion-text"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Clear button */}
          {startValue && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 mt-2 text-xs text-notion-text-secondary hover:text-notion-danger transition-colors"
            >
              <X size={12} />
              <span>{t('taskDetail.clearSchedule')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
