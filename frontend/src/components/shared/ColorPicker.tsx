import { useEffect, useRef } from 'react';
import { FOLDER_COLORS, getTextColorForBg } from '../../constants/folderColors';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  currentColor?: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export function ColorPicker({ currentColor, onSelect, onClose }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg p-2 w-[180px]"
    >
      <p className="text-[10px] text-notion-text-secondary mb-1.5 px-1">Folder Color</p>
      <div className="grid grid-cols-5 gap-1.5">
        {FOLDER_COLORS.map((color) => {
          const isSelected = currentColor === color;
          return (
            <button
              key={color}
              onClick={() => { onSelect(color); onClose(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 0 2px ${getTextColorForBg(color)}` : undefined,
              }}
            >
              {isSelected && <Check size={12} style={{ color: getTextColorForBg(color) }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
