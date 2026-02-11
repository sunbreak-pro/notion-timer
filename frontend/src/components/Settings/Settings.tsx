import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { AISettings } from './AISettings';
import { TrashBin } from './TrashBin';
import { TagManager } from '../Tags/TagManager';
import { DataManagement } from './DataManagement';
import { UpdateSettings } from './UpdateSettings';
import { PerformanceMonitor } from './PerformanceMonitor';
import { LogViewer } from './LogViewer';

export function Settings() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-notion-text">Settings</h2>
      <UpdateSettings />
      <div className="border-t border-notion-border" />
      <AppearanceSettings />
      <div className="border-t border-notion-border" />
      <NotificationSettings />
      <div className="border-t border-notion-border" />
      <TagManager />
      <div className="border-t border-notion-border" />
      <AISettings />
      <div className="border-t border-notion-border" />
      <DataManagement />
      <div className="border-t border-notion-border" />
      <PerformanceMonitor />
      <div className="border-t border-notion-border" />
      <LogViewer />
      <div className="border-t border-notion-border" />
      <TrashBin />
    </div>
  );
}
