import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "../../hooks/useClickOutside";

interface TaskCreatePopoverProps {
  position: { x: number; y: number };
  onSubmit: (title: string) => void;
  onClose: () => void;
}

export function TaskCreatePopover({
  position,
  onSubmit,
  onClose,
}: TaskCreatePopoverProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(ref, onClose, true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (title.trim()) {
        onSubmit(title.trim());
      } else {
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const left = Math.min(position.x, window.innerWidth - 240 - 16);
  const top = Math.min(position.y, window.innerHeight - 60 - 16);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-notion-bg border border-notion-border rounded-lg shadow-xl p-2"
      style={{ left, top, width: 240 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("calendar.taskNamePlaceholder")}
        className="w-full px-2 py-1.5 text-sm bg-transparent border border-notion-border rounded-md outline-none focus:border-notion-accent text-notion-text placeholder:text-notion-text-secondary"
      />
    </div>
  );
}
