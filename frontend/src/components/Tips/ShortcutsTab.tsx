import { isMac } from '../../utils/platform';

interface ShortcutEntry {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  category: string;
  shortcuts: ShortcutEntry[];
}

const mod = isMac ? '⌘' : 'Ctrl';
const shift = isMac ? '⇧' : 'Shift';

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Global',
    shortcuts: [
      { keys: `${mod} + K`, description: 'Open command palette' },
      { keys: `${mod} + ,`, description: 'Open Settings' },
      { keys: `${mod} + ${shift} + T`, description: 'Toggle timer modal' },
      { keys: 'Space', description: 'Play / Pause timer (when not typing)' },
      { keys: 'n', description: 'Create new task (when not typing)' },
      { keys: 'r', description: 'Reset timer (when not typing)' },
      { keys: 'Escape', description: 'Close modal / dialog' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: `${mod} + 1`, description: 'Go to Tasks' },
      { keys: `${mod} + 2`, description: 'Go to Session' },
      { keys: `${mod} + 3`, description: 'Go to Calendar' },
      { keys: `${mod} + 4`, description: 'Go to Analytics' },
      { keys: `${mod} + 5`, description: 'Go to Settings' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: `${mod} + .`, description: 'Toggle left sidebar' },
      { keys: `${mod} + ${shift} + .`, description: 'Toggle right sidebar' },
    ],
  },
  {
    category: 'Task Tree',
    shortcuts: [
      { keys: '↑ / ↓', description: 'Move between tasks' },
      { keys: '→', description: 'Expand folder' },
      { keys: '←', description: 'Collapse folder' },
      { keys: `${mod} + Enter`, description: 'Toggle task completion' },
      { keys: 'Tab', description: 'Indent (move into previous folder)' },
      { keys: `${shift} + Tab`, description: 'Outdent (move to parent level)' },
      { keys: 'Delete / Backspace', description: 'Delete selected task' },
      { keys: 'Drag & Drop', description: 'Reorder or move into folders' },
    ],
  },
  {
    category: 'Timer',
    shortcuts: [
      { keys: 'Space', description: 'Toggle play / pause' },
      { keys: 'r', description: 'Reset timer' },
      { keys: 'Escape', description: 'Close timer modal' },
    ],
  },
  {
    category: 'Calendar',
    shortcuts: [
      { keys: 'j', description: 'Next month / week' },
      { keys: 'k', description: 'Previous month / week' },
      { keys: 't', description: 'Jump to today' },
      { keys: 'm', description: 'Toggle month / week view' },
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
