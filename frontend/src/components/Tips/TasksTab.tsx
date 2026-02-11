import { isMac } from '../../utils/platform';

const mod = isMac ? '⌘' : 'Ctrl';
const shift = isMac ? '⇧' : 'Shift';

export function TasksTab() {
  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title="Creating Tasks & Folders">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Click the <Strong>+ icons</Strong> at the top of the sub-sidebar to create a new task or folder.</li>
          <li>Press <Kbd>n</Kbd> (when not typing) to quickly add a new task to the Inbox.</li>
          <li>Folders can be nested up to 5 levels deep. Tasks can be placed anywhere.</li>
        </ul>
      </Section>

      <Section title="Organizing with Drag & Drop">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Strong>Reorder</Strong>: Drag a task/folder to change its position among siblings.</li>
          <li><Strong>Move into folder</Strong>: Drag a task onto a folder to nest it inside.</li>
          <li>Circular references are prevented automatically.</li>
        </ul>
      </Section>

      <Section title="Task Details">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Click a task to view its detail panel on the right.</li>
          <li>Edit the title inline, add a rich-text memo, set a scheduled date, or adjust the work duration.</li>
          <li>The <Strong>play button</Strong> starts a focused timer session for that task.</li>
          <li>Press <Kbd>{`${mod} + Enter`}</Kbd> to toggle a task between completed and incomplete.</li>
          <li>Use <Kbd>Tab</Kbd> / <Kbd>{`${shift} + Tab`}</Kbd> to indent or outdent a task in the tree.</li>
        </ul>
      </Section>

      <Section title="Folders & Colors">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Folders group related tasks. Select a folder to change its color.</li>
          <li>Folder colors are inherited by child tasks in Calendar and Analytics views.</li>
        </ul>
      </Section>

      <Section title="Soft Delete & Trash">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Deleting a task moves it to the trash (soft delete).</li>
          <li>Go to <Strong>Settings &rarr; Trash</Strong> to restore or permanently delete items.</li>
        </ul>
      </Section>

      <Section title="Context Menu">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Right-click a task or folder in the tree to open the context menu.</li>
          <li>Available actions: <Strong>Rename</Strong>, <Strong>Add Task</Strong>, <Strong>Add Folder</Strong>, <Strong>Start Timer</Strong>, <Strong>Move to Root</Strong>, <Strong>Delete</Strong>.</li>
          <li>Folders also have a <Strong>Save as Template</Strong> option to save the entire structure.</li>
        </ul>
      </Section>

      <Section title="Tags">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Create and manage tags in <Strong>Settings &rarr; Tag Manager</Strong> (name + color).</li>
          <li>Assign tags to tasks from the task detail panel.</li>
          <li>Use the tag filter at the top of the task tree to show only matching tasks.</li>
        </ul>
      </Section>

      <Section title="Templates">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Right-click a folder &rarr; <Strong>Save as Template</Strong> to save its full structure.</li>
          <li>Click the template icon in the Projects header to apply a saved template.</li>
          <li>Templates duplicate the hierarchy, titles, memos, and work durations.</li>
        </ul>
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

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-notion-text">{children}</span>;
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-notion-hover border border-notion-border rounded text-notion-text">
      {children}
    </kbd>
  );
}
