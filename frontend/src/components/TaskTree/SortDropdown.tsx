import { useState, useRef, useCallback } from "react";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "../../hooks/useClickOutside";
import type { SortMode } from "../../utils/sortTaskNodes";

interface SortDropdownProps {
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}

const SORT_OPTIONS: SortMode[] = ["manual", "status", "scheduledAt"];

export function SortDropdown({ sortMode, onSortChange }: SortDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown, isOpen);

  const labelMap: Record<SortMode, string> = {
    manual: t("taskTree.sortManual"),
    status: t("taskTree.sortStatus"),
    scheduledAt: t("taskTree.sortSchedule"),
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
          sortMode !== "manual"
            ? "bg-notion-accent/10 text-notion-accent"
            : "text-notion-text-secondary hover:text-notion-text"
        }`}
        title={t("taskTree.sort")}
      >
        <ArrowUpDown size={10} />
        <span>{labelMap[sortMode]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1 min-w-28">
          {SORT_OPTIONS.map((mode) => (
            <button
              key={mode}
              onClick={() => {
                onSortChange(mode);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                sortMode === mode
                  ? "bg-notion-accent/10 text-notion-accent font-medium"
                  : "text-notion-text hover:bg-notion-hover"
              }`}
            >
              {labelMap[mode]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
