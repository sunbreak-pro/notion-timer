import { useState, useRef } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "../../hooks/useClickOutside";
import { truncateFolderTag } from "../../utils/folderTag";

interface CalendarTagFilterProps {
  tags: string[];
  value: string;
  onChange: (tag: string) => void;
}

export function CalendarTagFilter({
  tags,
  value,
  onChange,
}: CalendarTagFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  const handleSelect = (tag: string) => {
    onChange(tag);
    setOpen(false);
  };

  const isActive = value !== "";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
          isActive
            ? "bg-notion-accent/10 text-notion-accent"
            : "text-notion-text-secondary hover:bg-notion-hover"
        }`}
      >
        <Filter size={13} />
        {isActive ? (
          <span className="max-w-[120px] truncate">
            {truncateFolderTag(value)}
          </span>
        ) : (
          <span>{t("calendar.all")}</span>
        )}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] max-w-[240px] bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1">
          <button
            onClick={() => handleSelect("")}
            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
              value === ""
                ? "bg-notion-accent/10 text-notion-accent font-medium"
                : "text-notion-text hover:bg-notion-hover"
            }`}
          >
            {t("calendar.all")}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSelect(tag)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors truncate ${
                value === tag
                  ? "bg-notion-accent/10 text-notion-accent font-medium"
                  : "text-notion-text hover:bg-notion-hover"
              }`}
            >
              {truncateFolderTag(tag)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
