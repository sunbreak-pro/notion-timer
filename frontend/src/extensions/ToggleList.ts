import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

export const ToggleList = Node.create({
  name: 'toggleList',
  group: 'block',
  content: 'toggleSummary toggleContent',
  defining: true,

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        // If inside toggleContent and at end, create new paragraph outside
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === 'toggleContent') {
            const parentDepth = depth - 1;
            if ($from.node(parentDepth).type.name === 'toggleList') {
              const isAtEnd = $from.parentOffset === $from.parent.content.size;
              const isEmpty = $from.parent.content.size === 0;
              if (isAtEnd && isEmpty) {
                // Exit toggle list by creating a paragraph after it
                const pos = $from.after(parentDepth);
                const tr = state.tr.insert(pos, state.schema.nodes.paragraph.create());
                tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
                editor.view.dispatch(tr);
                return true;
              }
            }
          }
        }
        return false;
      },
    };
  },
});

export const ToggleSummary = Node.create({
  name: 'toggleSummary',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'summary' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0];
  },
});

export const ToggleContent = Node.create({
  name: 'toggleContent',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-toggle-content]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-toggle-content': '' }), 0];
  },
});
