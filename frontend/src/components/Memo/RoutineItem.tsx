import { useState } from "react";
import { Check, Flame, MoreHorizontal, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RoutineNode, RoutineStats } from "../../types/routine";

interface RoutineItemProps {
  routine: RoutineNode;
  stats: RoutineStats;
  todayCompleted: boolean;
  todayApplicable: boolean;
  onToggleToday: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DAY_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export function RoutineItem({
  routine,
  stats,
  todayCompleted,
  todayApplicable,
  onToggleToday,
  onEdit,
  onDelete,
}: RoutineItemProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group px-3 py-2.5 border-b border-notion-border last:border-b-0 hover:bg-notion-hover/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Today's check button */}
        {todayApplicable ? (
          <button
            onClick={onToggleToday}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              todayCompleted
                ? "bg-green-500 border-green-500 text-white"
                : "border-notion-border hover:border-green-400"
            }`}
          >
            {todayCompleted && <Check size={12} strokeWidth={3} />}
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center shrink-0 text-notion-text-secondary/40">
            <Minus size={12} />
          </div>
        )}

        {/* Title + Streak */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-notion-text truncate">
              {routine.title}
            </span>
            {stats.currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-500 shrink-0">
                <Flame size={12} />
                {stats.currentStreak}
              </span>
            )}
          </div>
        </div>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-notion-hover text-notion-text-secondary transition-opacity"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-notion-text hover:bg-notion-hover transition-colors"
                >
                  {t("routine.edit")}
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        t("routine.deleteConfirm", { name: routine.title }),
                      )
                    ) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-notion-hover transition-colors"
                >
                  {t("routine.delete")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Last 7 days indicator */}
      <div className="flex gap-1 mt-2 ml-8">
        {stats.last7Days.map((day, i) => {
          const dayOfWeek = new Date(day.date + "T00:00:00").getDay();
          return (
            <div key={day.date} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-notion-text-secondary/60">
                {DAY_LABELS_SHORT[dayOfWeek]}
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  !day.applicable
                    ? "text-notion-text-secondary/30"
                    : day.completed
                      ? "bg-green-500/20 text-green-600"
                      : i === 6
                        ? "border border-dashed border-notion-border text-notion-text-secondary/40"
                        : "bg-notion-bg-secondary text-notion-text-secondary/40"
                }`}
              >
                {!day.applicable ? (
                  "-"
                ) : day.completed ? (
                  <Check size={10} strokeWidth={3} />
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly summary */}
      {stats.monthlySummaries.length > 0 && (
        <div className="flex gap-1.5 mt-1.5 ml-8">
          {stats.monthlySummaries.map((ms) => (
            <span
              key={ms.month}
              className="text-[10px] px-1.5 py-0.5 rounded bg-notion-bg-secondary text-notion-text-secondary"
            >
              {ms.month}: {ms.completed}/{ms.total}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
