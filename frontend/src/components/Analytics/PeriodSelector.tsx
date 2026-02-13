import { useTranslation } from "react-i18next";

export type Period = "day" | "week" | "month";

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();
  const periods: Period[] = ["day", "week", "month"];

  return (
    <div className="flex gap-1 bg-notion-bg-secondary rounded-lg p-1 border border-notion-border">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === p
              ? "bg-notion-accent text-white shadow-sm"
              : "text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover"
          }`}
        >
          {t(`analytics.period.${p}`)}
        </button>
      ))}
    </div>
  );
}
