import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Quote,
  Minus,
  CheckSquare,
  ChevronRight,
  Table2,
  Lightbulb,
  ImageIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';

interface CommandInfo {
  name: string;
  icon: ComponentType<{ size?: number }>;
  description: string;
}

const SLASH_COMMANDS: CommandInfo[] = [
  { name: 'Heading 1', icon: Heading1, description: 'Large section heading' },
  { name: 'Heading 2', icon: Heading2, description: 'Medium section heading' },
  { name: 'Heading 3', icon: Heading3, description: 'Small section heading' },
  { name: 'Bullet List', icon: List, description: 'Unordered bullet list' },
  { name: 'Ordered List', icon: ListOrdered, description: 'Numbered list' },
  { name: 'Code Block', icon: Code2, description: 'Fenced code block' },
  { name: 'Blockquote', icon: Quote, description: 'Indented quote block' },
  { name: 'Horizontal Rule', icon: Minus, description: 'Divider line' },
  { name: 'Task List', icon: CheckSquare, description: 'Checklist with checkboxes' },
  { name: 'Toggle List', icon: ChevronRight, description: 'Collapsible content block' },
  { name: 'Table', icon: Table2, description: '3\u00D73 table with header row' },
  { name: 'Callout', icon: Lightbulb, description: 'Highlighted callout box with emoji' },
  { name: 'Image', icon: ImageIcon, description: 'Insert image from URL' },
];

const FORMAT_HINTS = [
  { syntax: '**bold**', result: 'Bold text' },
  { syntax: '*italic*', result: 'Italic text' },
  { syntax: '`code`', result: 'Inline code' },
  { syntax: '~~strike~~', result: 'Strikethrough' },
  { syntax: '---', result: 'Horizontal rule' },
  { syntax: '> quote', result: 'Blockquote' },
  { syntax: '```', result: 'Code block' },
];

export function EditorTab() {
  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title="Slash Commands">
        <p className="mb-3">
          Type <Kbd>/</Kbd> in the editor to open the command menu. Start typing to filter commands.
        </p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-notion-border">
              <th className="text-left py-2 pr-4 text-notion-text font-medium">Command</th>
              <th className="text-left py-2 text-notion-text font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {SLASH_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <tr key={cmd.name} className="border-b border-notion-border/50">
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-2 text-notion-text">
                      <Icon size={14} />
                      {cmd.name}
                    </span>
                  </td>
                  <td className="py-2">{cmd.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Markdown Shortcuts">
        <p className="mb-3">
          The editor supports Markdown-style formatting as you type.
        </p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-notion-border">
              <th className="text-left py-2 pr-4 text-notion-text font-medium w-40">Syntax</th>
              <th className="text-left py-2 text-notion-text font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {FORMAT_HINTS.map((hint) => (
              <tr key={hint.syntax} className="border-b border-notion-border/50">
                <td className="py-2 pr-4">
                  <code className="text-xs bg-notion-hover px-1.5 py-0.5 rounded">{hint.syntax}</code>
                </td>
                <td className="py-2">{hint.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-notion-text mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-notion-hover border border-notion-border rounded text-notion-text">
      {children}
    </kbd>
  );
}
