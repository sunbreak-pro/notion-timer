import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RoutineCreateDialogProps {
  onSubmit: (
    title: string,
    frequencyType: "daily" | "custom",
    frequencyDays: number[],
  ) => void;
  onClose: () => void;
  initial?: {
    title: string;
    frequencyType: "daily" | "custom";
    frequencyDays: number[];
  };
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function RoutineCreateDialog({
  onSubmit,
  onClose,
  initial,
}: RoutineCreateDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [frequencyType, setFrequencyType] = useState<"daily" | "custom">(
    initial?.frequencyType ?? "daily",
  );
  const [frequencyDays, setFrequencyDays] = useState<number[]>(
    initial?.frequencyDays ?? [1, 2, 3, 4, 5],
  );

  const toggleDay = (day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(
      title.trim(),
      frequencyType,
      frequencyType === "daily" ? [] : frequencyDays,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-notion-bg border border-notion-border rounded-xl shadow-2xl p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-notion-text mb-4">
          {initial ? t("routine.edit") : t("routine.addRoutine")}
        </h3>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={t("routine.titlePlaceholder")}
          className="w-full px-3 py-2 text-sm bg-transparent border border-notion-border rounded-lg outline-none focus:border-notion-accent text-notion-text placeholder:text-notion-text-secondary mb-3"
          autoFocus
        />

        <div className="mb-3">
          <label className="text-xs text-notion-text-secondary mb-1 block">
            {t("routine.frequency")}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFrequencyType("daily")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                frequencyType === "daily"
                  ? "bg-notion-accent/10 text-notion-accent border border-notion-accent/30"
                  : "text-notion-text-secondary border border-notion-border hover:bg-notion-hover"
              }`}
            >
              {t("routine.daily")}
            </button>
            <button
              onClick={() => setFrequencyType("custom")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                frequencyType === "custom"
                  ? "bg-notion-accent/10 text-notion-accent border border-notion-accent/30"
                  : "text-notion-text-secondary border border-notion-border hover:bg-notion-hover"
              }`}
            >
              {t("routine.custom")}
            </button>
          </div>
        </div>

        {frequencyType === "custom" && (
          <div className="flex gap-1 mb-4">
            {DAY_KEYS.map((key, i) => (
              <button
                key={key}
                onClick={() => toggleDay(i)}
                className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                  frequencyDays.includes(i)
                    ? "bg-notion-accent text-white"
                    : "text-notion-text-secondary border border-notion-border hover:bg-notion-hover"
                }`}
              >
                {t(`routine.${key}`)}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-notion-text-secondary hover:bg-notion-hover rounded-lg transition-colors"
          >
            {t("routine.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !title.trim() ||
              (frequencyType === "custom" && frequencyDays.length === 0)
            }
            className="px-3 py-1.5 text-xs bg-notion-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {t("routine.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
