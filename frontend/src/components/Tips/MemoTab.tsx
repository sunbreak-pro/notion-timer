export function MemoTab() {
  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title="Daily Memo">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Each day has its own memo &mdash; one memo per date, automatically created.</li>
          <li>Use it as a daily journal, quick notes, or meeting log.</li>
          <li>Memos are saved to the database and persist across sessions.</li>
        </ul>
      </Section>

      <Section title="Date Navigation">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The left panel shows a list of dates with existing memos.</li>
          <li>Click a date to view or edit that day&apos;s memo.</li>
          <li>Click the <Strong>Today</Strong> button to jump to today&apos;s memo.</li>
          <li>Use the <Strong>+</Strong> button to create a new memo for today if none exists.</li>
        </ul>
      </Section>

      <Section title="Rich Text Editor">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Memos use the same <Strong>TipTap</Strong> rich text editor as task details.</li>
          <li>Type <Kbd>/</Kbd> to open slash commands (headings, lists, code blocks, etc.).</li>
          <li>See the <Strong>Editor</Strong> tab for the full list of slash commands and formatting.</li>
        </ul>
      </Section>

      <Section title="Calendar Integration">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Days with memos show an indicator dot on the Calendar view.</li>
          <li>Click a memo indicator on the calendar to navigate to that memo.</li>
        </ul>
      </Section>

      <Section title="Deleting Memos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Click the <Strong>trash icon</Strong> next to a memo date to delete it.</li>
          <li>Memo deletion is <Strong>permanent</Strong> &mdash; deleted memos cannot be restored.</li>
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
