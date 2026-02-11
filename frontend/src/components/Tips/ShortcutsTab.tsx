import { isMac } from '../../utils/platform';

interface ShortcutEntry {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  category: string;
  shortcuts: ShortcutEntry[];
}

const mod = isMac ? '\u2318' : 'Ctrl';

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Global',
    shortcuts: [
      { keys: `${mod} + ,`, description: 'Open Settings' },
      { keys: 'Space', description: 'Play / Pause timer (when not typing)' },
      { keys: 'n', description: 'Create new task (when not typing)' },
      { keys: 'Escape', description: 'Close timer modal' },
    ],
  },
  {
    category: 'Tasks',
    shortcuts: [
      { keys: 'Delete / Backspace', description: 'Delete selected task' },
      { keys: 'Drag & Drop', description: 'Reorder tasks or move into folders' },
      { keys: 'Click task', description: 'Select task and view details' },
      { keys: '\u25B6 button', description: 'Start timer for a task' },
    ],
  },
  {
    category: 'Timer',
    shortcuts: [
      { keys: 'Space', description: 'Toggle play/pause' },
      { keys: 'Escape', description: 'Close timer overlay' },
    ],
  },
  {
    category: 'Calendar',
    shortcuts: [
      { keys: '\u2190 / \u2192', description: 'Navigate previous / next month or week' },
      { keys: 'Click day cell', description: 'Create task on that date' },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-notion-hover border border-notion-border rounded text-notion-text">
      {children}
    </kbd>
  );
}

export function ShortcutsTab() {
  return (
    <div className="space-y-6">
      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.category}>
          <h3 className="text-lg font-semibold text-notion-text mb-3">{group.category}</h3>
          <table className="w-full text-sm">
            <tbody>
              {group.shortcuts.map((s, i) => (
                <tr key={i} className="border-b border-notion-border/50">
                  <td className="py-2 pr-4 w-48">
                    <Kbd>{s.keys}</Kbd>
                  </td>
                  <td className="py-2 text-notion-text-secondary">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
