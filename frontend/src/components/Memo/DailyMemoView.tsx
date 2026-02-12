import { lazy, Suspense, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMemoContext } from "../../hooks/useMemoContext";
import { formatDateTime } from "../../utils/formatRelativeDate";
import { MemoDateList } from "./MemoDateList";

const MemoEditor = lazy(() =>
  import("../TaskDetail/MemoEditor").then((m) => ({ default: m.MemoEditor })),
);

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DailyMemoView() {
  const {
    memos,
    selectedDate,
    setSelectedDate,
    selectedMemo,
    upsertMemo,
    deleteMemo,
  } = useMemoContext();
  const { t } = useTranslation();
  const todayKey = getTodayKey();

  const handleUpdate = useCallback(
    (content: string) => {
      upsertMemo(selectedDate, content);
    },
    [selectedDate, upsertMemo],
  );

  const handleCreateToday = useCallback(() => {
    setSelectedDate(todayKey);
    if (!memos.some((m) => m.date === todayKey)) {
      upsertMemo(todayKey, "");
    }
  }, [todayKey, setSelectedDate, memos, upsertMemo]);

  const handleDelete = useCallback(
    (date: string) => {
      deleteMemo(date);
      if (selectedDate === date) {
        setSelectedDate(todayKey);
      }
    },
    [deleteMemo, selectedDate, setSelectedDate, todayKey],
  );

  return (
    <div className="flex h-full">
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
          <h2 className="text-lg font-semibold text-notion-text mb-1">
            {formatDateHeading(selectedDate)}
          </h2>
          {selectedMemo?.updatedAt && (
            <p className="text-[11px] text-notion-text-secondary/60 mb-4">
              {t('dateTime.updated')}: {formatDateTime(selectedMemo.updatedAt)}
            </p>
          )}
          {!selectedMemo?.updatedAt && <div className="mb-4" />}
          <Suspense
            fallback={
              <div className="text-notion-text-secondary text-sm">
                {t('dateTime.loadingEditor')}
              </div>
            }
          >
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
