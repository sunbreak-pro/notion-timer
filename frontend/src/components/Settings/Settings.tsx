import { useState } from 'react';
import { Settings2, Bell, Sparkles, Database, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppearanceSettings } from './AppearanceSettings';
import { LanguageSettings } from './LanguageSettings';
import { NotificationSettings } from './NotificationSettings';
import { AISettings } from './AISettings';
import { TrashBin } from './TrashBin';
import { DataManagement } from './DataManagement';
import { UpdateSettings } from './UpdateSettings';
import { PerformanceMonitor } from './PerformanceMonitor';
import { LogViewer } from './LogViewer';

type SettingsTab = 'general' | 'notifications' | 'ai' | 'data' | 'advanced';

const TABS: { id: SettingsTab; labelKey: string; icon: typeof Settings2 }[] = [
  { id: 'general', labelKey: 'settings.general', icon: Settings2 },
  { id: 'notifications', labelKey: 'settings.notificationsTab', icon: Bell },
  { id: 'ai', labelKey: 'settings.aiTab', icon: Sparkles },
  { id: 'data', labelKey: 'settings.dataTab', icon: Database },
  { id: 'advanced', labelKey: 'settings.advancedTab', icon: Wrench },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-notion-text mb-6">{t('settings.title')}</h2>
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'general' && (
            <div className="space-y-8">
              <AppearanceSettings />
              <div className="border-t border-notion-border" />
              <LanguageSettings />
            </div>
          )}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'ai' && <AISettings />}
          {activeTab === 'data' && (
            <div className="space-y-8">
              <DataManagement />
              <div className="border-t border-notion-border" />
              <TrashBin />
            </div>
          )}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              <UpdateSettings />
              <div className="border-t border-notion-border" />
              <PerformanceMonitor />
              <div className="border-t border-notion-border" />
              <LogViewer />
            </div>
          )}
        </div>

        {/* Right side nav */}
        <nav className="w-40 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-notion-accent/10 text-notion-accent border border-notion-accent/30'
                    : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text border border-transparent'
                }`}
              >
                <Icon size={16} />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
