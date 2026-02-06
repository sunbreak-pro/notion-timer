import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAdd: (title: string) => void;
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setValue('');  // 先にクリア（重複防止）
    await onAdd(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 text-notion-text-secondary hover:bg-notion-hover rounded-md group">
      <button
        type="button"
        onClick={handleSubmit}
        className="p-1 hover:bg-notion-hover rounded"
      >
        <Plus size={18} className="text-notion-text-secondary" />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="新しいタスクを追加..."
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-notion-text-secondary text-notion-text"
      />
    </div>
  );
}
