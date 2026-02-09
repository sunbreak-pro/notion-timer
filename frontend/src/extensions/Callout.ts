import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: '\u{1F4A1}',
        parseHTML: (element) => element.getAttribute('data-emoji') || '\u{1F4A1}',
        renderHTML: (attributes) => ({ 'data-emoji': attributes.emoji }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        class: 'callout',
      }),
      ['span', { class: 'callout-emoji', contenteditable: 'false' }, node.attrs.emoji],
      ['span', { class: 'callout-text' }, 0],
    ];
  },
});
