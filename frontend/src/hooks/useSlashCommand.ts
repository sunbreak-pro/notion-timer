import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Editor } from '@tiptap/react';

interface CommandItem {
  title: string;
  command: (editor: Editor) => void;
  icon?: unknown;
}

export function useSlashCommand(editor: Editor, commands: CommandItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slashPosRef = useRef<number | null>(null);

  const filteredCommands = useMemo(() => commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  ), [commands, query]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    slashPosRef.current = null;
  }, []);

  const executeCommand = useCallback((index: number) => {
    const cmd = filteredCommands[index];
    if (!cmd) return;

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

  return { isOpen, position, selectedIndex, filteredCommands, executeCommand };
}
