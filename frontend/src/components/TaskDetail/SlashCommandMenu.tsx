import { useRef } from 'react';
import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Quote,
  Minus,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useSlashCommand } from '../../hooks/useSlashCommand';

interface CommandItem {
  title: string;
  icon: ComponentType<{ size?: number }>;
  command: (editor: Editor) => void;
}

const COMMANDS: CommandItem[] = [
  {
    title: 'Heading 1',
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Ordered List',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Code Block',
    icon: Code2,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Blockquote',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Horizontal Rule',
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
}

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { isOpen, position, selectedIndex, filteredCommands, executeCommand } =
    useSlashCommand(editor, COMMANDS);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1 w-56"
      style={{ top: position.top, left: position.left }}
    >
      {filteredCommands.map((cmd, i) => {
        const Icon = (cmd as CommandItem).icon;
        return (
          <button
            key={cmd.title}
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand(i);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-notion-text hover:bg-notion-hover transition-colors ${
              i === selectedIndex ? 'bg-notion-hover' : ''
            }`}
          >
            <Icon size={16} />
            <span>{cmd.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',
});
