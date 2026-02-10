import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export function ToggleListView({ node, updateAttributes }: NodeViewProps) {
  const isOpen = node.attrs.open;

  return (
    <NodeViewWrapper className="toggle-list" data-open={isOpen ? 'true' : 'false'}>
      <button
        className="toggle-arrow"
        contentEditable={false}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateAttributes({ open: !isOpen });
        }}
        tabIndex={-1}
        type="button"
      >
        {'\u25B6'}
      </button>
      <div className="toggle-body">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}
