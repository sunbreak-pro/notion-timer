import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import { flattenFolders } from '../../utils/flattenFolders';

interface FolderFilterDropdownProps {
  filterFolderId: string | null;
  onFilterChange: (folderId: string | null) => void;
}

export function FolderFilterDropdown({ filterFolderId, onFilterChange }: FolderFilterDropdownProps) {
  const { nodes } = useTaskTreeContext();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const folders = flattenFolders(nodes);
  const activeFolder = folders.find(f => f.id === filterFolderId);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
          filterFolderId
            ? 'bg-notion-accent/10 text-notion-accent'
            : 'text-notion-text-secondary hover:text-notion-text'
        }`}
        title={t('folderFilter.filterByFolder')}
      >
        <Filter size={10} />
        <span className="max-w-[80px] truncate">
          {activeFolder ? activeFolder.title : t('folderFilter.all')}
        </span>
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1 min-w-[160px] max-h-[240px] overflow-y-auto">
          <button
            onClick={() => { onFilterChange(null); setIsOpen(false); }}
            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
              !filterFolderId
                ? 'bg-notion-accent/10 text-notion-accent font-medium'
                : 'text-notion-text hover:bg-notion-hover'
            }`}
          >
            {t('folderFilter.all')}
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => { onFilterChange(f.id); setIsOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                filterFolderId === f.id
                  ? 'bg-notion-accent/10 text-notion-accent font-medium'
                  : 'text-notion-text hover:bg-notion-hover'
              }`}
              style={{ paddingLeft: `${12 + f.depth * 12}px` }}
            >
              {f.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
