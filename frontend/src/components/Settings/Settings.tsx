import { AppearanceSettings } from './AppearanceSettings';
import { AISettings } from './AISettings';
import { TrashBin } from './TrashBin';

export function Settings() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-notion-text">Settings</h2>
      <AppearanceSettings />
      <div className="border-t border-notion-border" />
      <AISettings />
      <div className="border-t border-notion-border" />
      <TrashBin />
    </div>
  );
}
