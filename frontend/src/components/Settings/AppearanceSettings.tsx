import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

const FONT_SIZE_PX: Record<number, number> = {
  1: 12, 2: 13, 3: 14, 4: 16, 5: 18,
  6: 19, 7: 20, 8: 22, 9: 23, 10: 25,
};

export function AppearanceSettings() {
  const { theme, fontSize, toggleTheme, setFontSize } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-notion-text">{t('settings.appearance')}</h3>

      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium text-notion-text">{t('settings.darkMode')}</p>
          <p className="text-xs text-notion-text-secondary">{t('settings.darkModeDesc')}</p>
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
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-notion-text">{t('settings.fontSize')}</p>
          <span className="text-xs text-notion-text-secondary tabular-nums">
            {FONT_SIZE_PX[fontSize] ?? 18}px
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-[var(--notion-accent)]"
        />
        <div className="flex justify-between text-xs text-notion-text-secondary mt-1">
          <span>{t('settings.fontSizeSmall')}</span>
          <span>{t('settings.fontSizeLarge')}</span>
        </div>
      </div>
    </div>
  );
}
