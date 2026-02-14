import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useMemoContext } from "../../hooks/useMemoContext";
import { useCalendarContext } from "../../hooks/useCalendarContext";
import { useCalendar } from "../../hooks/useCalendar";
import { getDescendantTasks } from "../../utils/getDescendantTasks";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarTagFilter } from "./CalendarTagFilter";
import { TaskCreatePopover } from "./TaskCreatePopover";
import { TaskPreviewPopup } from "./TaskPreviewPopup";
import { MonthlyView } from "./MonthlyView";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";
import type { MemoNode } from "../../types/memo";

interface CalendarViewProps {
  onSelectTask: (taskId: string) => void;
  onCreateTask?: (date: Date, title?: string) => void;
  onSelectMemo?: (date: string) => void;
  onStartTimer?: (taskId: string) => void;
}

function getInitialWeekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalendarView({
  onSelectTask,
  onCreateTask,
  onSelectMemo,
  onStartTimer,
}: CalendarViewProps) {
  const { t } = useTranslation();
  const { nodes, getTaskColor, getFolderTagForTask } = useTaskTreeContext();
  const { memos } = useMemoContext();
  const { activeCalendar } = useCalendarContext();

  // Filter nodes by active calendar's folder subtree
  const filteredNodes = useMemo(() => {
    if (!activeCalendar) return nodes;
    return getDescendantTasks(activeCalendar.folderId, nodes);
  }, [activeCalendar, nodes]);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "week" | "3day">("month");
  const [filter, setFilter] = useState<"incomplete" | "completed">(
    "incomplete",
  );
  const [weekStartDate, setWeekStartDate] = useState<Date>(getInitialWeekStart);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [createPopover, setCreatePopover] = useState<{
    date: Date;
    position: { x: number; y: number };
  } | null>(null);
  const [previewPopup, setPreviewPopup] = useState<{
    taskId: string;
    position: { x: number; y: number };
  } | null>(null);

  const { tasksByDate, calendarDays, weekDays, threeDays } = useCalendar(
    filteredNodes,
    year,
    month,
    filter,
    weekStartDate,
  );

  // Build memos lookup by date
  const memosByDate = useMemo(() => {
    const map = new Map<string, MemoNode>();
    for (const memo of memos) {
      map.set(memo.date, memo);
    }
    return map;
  }, [memos]);

  /* eslint-disable react-hooks/exhaustive-deps -- React Compiler auto-memoizes */
  const handlePrev = () => {
    if (viewMode === "week") {
      setWeekStartDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      });
    } else if (viewMode === "3day") {
      setWeekStartDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 3);
        return d;
      });
    } else {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setWeekStartDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      });
    } else if (viewMode === "3day") {
      setWeekStartDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 3);
        return d;
      });
    } else {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    if (viewMode === "3day") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setWeekStartDate(d);
    } else {
      setWeekStartDate(getInitialWeekStart());
    }
  };

  // Collect available tags from visible tasks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const [, tasks] of tasksByDate) {
      for (const task of tasks) {
        tagSet.add(getFolderTagForTask(task.id) || t("calendar.inbox"));
      }
    }
    if (memosByDate.size > 0) {
      tagSet.add(t("calendar.memo"));
    }
    return Array.from(tagSet).sort();
  }, [tasksByDate, getFolderTagForTask, memosByDate, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = e.target as Element | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (el?.getAttribute("contenteditable") === "true") return;
      if (el?.closest?.('[contenteditable="true"]')) return;

      if (e.key === "j") {
        e.preventDefault();
        handleNext();
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        handlePrev();
        return;
      }
      if (e.key === "t") {
        e.preventDefault();
        handleToday();
        return;
      }
      if (e.key === "m") {
        e.preventDefault();
        setViewMode((v) =>
          v === "month" ? "week" : v === "week" ? "3day" : "month",
        );
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, handleToday]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Filter tasksByDate by tag
  const filteredTasksByDate = useMemo(() => {
    if (!tagFilter) return tasksByDate;
    if (tagFilter === t("calendar.memo"))
      return new Map<string, typeof nodes>();
    const map = new Map<string, typeof nodes>();
    for (const [date, tasks] of tasksByDate) {
      const matching = tasks.filter(
        (task) =>
          (getFolderTagForTask(task.id) || t("calendar.inbox")) === tagFilter,
      );
      if (matching.length > 0) map.set(date, matching);
    }
    return map;
  }, [tasksByDate, tagFilter, getFolderTagForTask, t]);

  // Filter memosByDate by tag
  const filteredMemosByDate = useMemo(() => {
    if (!tagFilter || tagFilter === t("calendar.memo")) return memosByDate;
    return new Map<string, MemoNode>();
  }, [tagFilter, memosByDate, t]);

  const handleRequestCreate = (date: Date, e: React.MouseEvent) => {
    setPreviewPopup(null);
    setCreatePopover({ date, position: { x: e.clientX, y: e.clientY } });
  };

  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    setCreatePopover(null);
    setPreviewPopup({ taskId, position: { x: e.clientX, y: e.clientY } });
  };

  const previewTask = previewPopup
    ? (filteredNodes.find((n) => n.id === previewPopup.taskId) ??
      nodes.find((n) => n.id === previewPopup.taskId))
    : null;

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

        {/* Filter tabs + tag filter */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter("incomplete")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === "incomplete"
                ? "bg-notion-accent/10 text-notion-accent"
                : "text-notion-text-secondary hover:bg-notion-hover"
            }`}
          >
            {t("calendar.incomplete")}
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === "completed"
                ? "bg-notion-accent/10 text-notion-accent"
                : "text-notion-text-secondary hover:bg-notion-hover"
            }`}
          >
            {t("calendar.completed")}
          </button>
          {availableTags.length > 0 && (
            <>
              <div className="w-px h-4 bg-notion-border" />
              <CalendarTagFilter
                tags={availableTags}
                value={tagFilter}
                onChange={setTagFilter}
              />
            </>
          )}
        </div>

        {viewMode === "month" ? (
          <MonthlyView
            days={calendarDays}
            tasksByDate={filteredTasksByDate}
            onSelectTask={handleTaskClick}
            onCreateTask={onCreateTask ? handleRequestCreate : undefined}
            getTaskColor={getTaskColor}
            getFolderTag={getFolderTagForTask}
            memosByDate={filteredMemosByDate}
            onSelectMemo={onSelectMemo}
          />
        ) : (
          <WeeklyTimeGrid
            days={viewMode === "3day" ? threeDays : weekDays}
            tasksByDate={filteredTasksByDate}
            onSelectTask={handleTaskClick}
            onCreateTask={onCreateTask ? handleRequestCreate : undefined}
            getTaskColor={getTaskColor}
            getFolderTag={getFolderTagForTask}
            memosByDate={filteredMemosByDate}
            onSelectMemo={onSelectMemo}
          />
        )}
      </div>

      {createPopover && (
        <TaskCreatePopover
          position={createPopover.position}
          onSubmit={(title) => {
            onCreateTask?.(createPopover.date, title);
            setCreatePopover(null);
          }}
          onClose={() => setCreatePopover(null)}
        />
      )}

      {previewPopup && previewTask && (
        <TaskPreviewPopup
          task={previewTask}
          position={previewPopup.position}
          color={getTaskColor(previewTask.id)}
          folderTag={getFolderTagForTask(previewTask.id)}
          onOpenDetail={() => {
            onSelectTask(previewTask.id);
            setPreviewPopup(null);
          }}
          onStartTimer={() => {
            onStartTimer?.(previewTask.id);
            setPreviewPopup(null);
          }}
          onClose={() => setPreviewPopup(null)}
        />
      )}
    </div>
  );
}
