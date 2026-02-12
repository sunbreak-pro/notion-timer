import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isMac } from '../../utils/platform';
import { ShortcutsTab } from './ShortcutsTab';
import { TasksTab } from './TasksTab';
import { TimerTab } from './TimerTab';
import { CalendarTab } from './CalendarTab';
import { MemoTab } from './MemoTab';
import { AnalyticsTab } from './AnalyticsTab';
import { EditorTab } from './EditorTab';

const TAB_IDS = ['shortcuts', 'tasks', 'timer', 'calendar', 'memo', 'analytics', 'editor'] as const;

type TabId = (typeof TAB_IDS)[number];

const TAB_LABEL_KEYS: Record<TabId, string> = {
  shortcuts: 'tips.shortcuts',
  tasks: 'tips.tasks',
  timer: 'tips.timer',
  calendar: 'tips.calendar',
  memo: 'tips.memo',
  analytics: 'tips.analytics',
  editor: 'tips.editor',
};

export function Tips() {
  const [activeTab, setActiveTab] = useState<TabId>('shortcuts');
  const [showMac, setShowMac] = useState(isMac);
  const { t } = useTranslation();

  const renderTab = () => {
    switch (activeTab) {
      case 'shortcuts':
        return <ShortcutsTab showMac={showMac} onToggleOS={setShowMac} />;
      case 'tasks':
        return <TasksTab showMac={showMac} />;
      case 'timer':
        return <TimerTab showMac={showMac} />;
      case 'calendar':
        return <CalendarTab />;
      case 'memo':
        return <MemoTab />;
      case 'analytics':
        return <AnalyticsTab showMac={showMac} />;
      case 'editor':
        return <EditorTab />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-notion-text">{t('tips.title')}</h2>

      <div className="flex gap-1 border-b border-notion-border">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === id
                ? 'text-notion-text border-b-2 border-notion-accent'
                : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
            }`}
          >
            {t(TAB_LABEL_KEYS[id])}
          </button>
        ))}
      </div>

      <div>{renderTab()}</div>
    </div>
  );
}
