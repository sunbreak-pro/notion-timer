import { useState } from 'react';
import { ShortcutsTab } from './ShortcutsTab';
import { TasksTab } from './TasksTab';
import { TimerTab } from './TimerTab';
import { CalendarTab } from './CalendarTab';
import { EditorTab } from './EditorTab';

const TABS = [
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'timer', label: 'Timer' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'editor', label: 'Editor' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function Tips() {
  const [activeTab, setActiveTab] = useState<TabId>('shortcuts');

  const renderTab = () => {
    switch (activeTab) {
      case 'shortcuts':
        return <ShortcutsTab />;
      case 'tasks':
        return <TasksTab />;
      case 'timer':
        return <TimerTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'editor':
        return <EditorTab />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-notion-text">Tips</h2>

      <div className="flex gap-1 border-b border-notion-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? 'text-notion-text border-b-2 border-notion-accent'
                : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderTab()}</div>
    </div>
  );
}
