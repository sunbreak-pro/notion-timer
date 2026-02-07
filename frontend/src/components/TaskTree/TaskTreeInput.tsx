import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Plus } from "lucide-react";

interface TaskTreeInputProps {
  placeholder: string;
  onSubmit: (title: string) => void;
  indent?: number;
}

export function TaskTreeInput({
  placeholder,
  onSubmit,
  indent = 0,
}: TaskTreeInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") setValue("");
  };

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 text-notion-text-secondary hover:bg-notion-hover rounded-md"
      style={{ paddingLeft: `${indent * 20 + 8}px` }}
    >
      <button
        onClick={handleSubmit}
        className="p-0.5 hover:bg-notion-hover rounded"
      >
        <Plus size={14} />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-notion-text-secondary text-notion-text"
      />
    </div>
  );
}
