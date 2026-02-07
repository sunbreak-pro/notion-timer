import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const slashPosRef = useRef<number | null>(null);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    slashPosRef.current = null;
  }, []);

  const executeCommand = useCallback((index: number) => {
    const cmd = filteredCommands[index];
    if (!cmd) return;

    // Delete the "/" and query text
    if (slashPosRef.current !== null) {
      const from = slashPosRef.current;
      const to = from + 1 + query.length;
      editor.chain().focus().deleteRange({ from, to }).run();
    }

    cmd.command(editor);
    close();
  }, [editor, filteredCommands, query, close]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(selectedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredCommands.length, executeCommand, close]);

  useEffect(() => {
    const handleTransaction = () => {
      const { state } = editor;
      const { $head } = state.selection;
      const textBefore = $head.parent.textContent.slice(0, $head.parentOffset);

      const slashMatch = textBefore.match(/\/([a-zA-Z0-9 ]*)$/);
      if (slashMatch) {
        const coords = editor.view.coordsAtPos($head.pos);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setPosition({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
        setQuery(slashMatch[1]);
        setSelectedIndex(0);
        slashPosRef.current = $head.pos - slashMatch[0].length;
        setIsOpen(true);
      } else {
        if (isOpen) close();
      }
    };

    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor, isOpen, close]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1 w-56"
      style={{ top: position.top, left: position.left }}
    >
      {filteredCommands.map((cmd, i) => {
        const Icon = cmd.icon;
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
