import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { FontSize } from '../../context/ThemeContext';

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export function AppearanceSettings() {
  const { theme, fontSize, toggleTheme, setFontSize } = useTheme();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-notion-text">Appearance</h3>

      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium text-notion-text">Dark Mode</p>
          <p className="text-xs text-notion-text-secondary">Switch between light and dark themes</p>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            theme === 'dark' ? 'bg-notion-accent' : 'bg-notion-border'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          >
            {theme === 'dark' ? <Moon size={12} className="text-notion-accent" /> : <Sun size={12} className="text-yellow-500" />}
          </div>
        </button>
      </div>

      <div className="py-3">
        <p className="text-sm font-medium text-notion-text mb-2">Font Size</p>
        <div className="flex gap-2">
          {FONT_SIZES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFontSize(value)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                fontSize === value
                  ? 'border-notion-accent bg-notion-accent/10 text-notion-accent'
                  : 'border-notion-border text-notion-text-secondary hover:border-notion-text-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
