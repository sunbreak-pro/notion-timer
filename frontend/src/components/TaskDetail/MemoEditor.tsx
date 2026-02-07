import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommandMenu } from './SlashCommandMenu';

interface MemoEditorProps {
  taskId: string;
  initialContent?: string;
  onUpdate: (content: string) => void;
}

export function MemoEditor({ taskId, initialContent, onUpdate }: MemoEditorProps) {
  const debounceRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
    ],
    content: initialContent ? tryParseJSON(initialContent) : undefined,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const json = JSON.stringify(editor.getJSON());
      debounceRef.current = window.setTimeout(() => {
        onUpdateRef.current(json);
      }, 800);
    },
    editorProps: {
      attributes: {
        class: 'memo-editor outline-none min-h-[200px]',
      },
    },
  }, [taskId]);

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      {editor && <SlashCommandMenu editor={editor} />}
    </div>
  );
}

function tryParseJSON(str: string): Record<string, unknown> | string {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
