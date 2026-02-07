import { useState } from 'react';
import { Folder, Inbox, Plus } from 'lucide-react';
import type { TaskNode } from '../../types/taskTree';

interface SubSidebarProps {
  folders: TaskNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (title: string) => void;
}

export function SubSidebar({ folders, selectedFolderId, onSelectFolder, onCreateFolder }: SubSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  const handleSubmit = () => {
    const trimmed = newFolderTitle.trim();
    if (trimmed) {
      onCreateFolder(trimmed);
      setNewFolderTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') {
      setNewFolderTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-40 h-screen bg-notion-bg border-r border-notion-border flex flex-col">
      <div className="px-3 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-notion-text-secondary">
          Projects
        </span>
      </div>

      <nav className="flex-1 px-1 space-y-0.5 overflow-y-auto">
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
            selectedFolderId === null
              ? 'bg-notion-hover text-notion-text'
              : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text'
          }`}
        >
          <Inbox size={14} />
          <span className="truncate">Inbox</span>
        </button>

        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              selectedFolderId === folder.id
                ? 'bg-notion-hover text-notion-text'
                : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text'
            }`}
          >
            <Folder size={14} className="shrink-0" />
            <span className="truncate">{folder.title}</span>
          </button>
        ))}
      </nav>

      <div className="px-1 pb-2">
        {isAdding ? (
          <input
            autoFocus
            type="text"
            value={newFolderTitle}
            onChange={(e) => setNewFolderTitle(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            placeholder="Folder name..."
            className="w-full px-2 py-1.5 text-sm bg-transparent outline-none text-notion-text border-b border-notion-accent"
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
          >
            <Plus size={14} />
            <span>New Folder</span>
          </button>
        )}
      </div>
    </div>
  );
}
