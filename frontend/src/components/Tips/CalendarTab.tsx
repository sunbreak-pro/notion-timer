export function CalendarTab() {
  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title="Calendar Views">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Switch between <Strong>Month</Strong> and <Strong>Week</Strong> views using the header toggle.</li>
          <li>Navigate months/weeks with the arrow buttons.</li>
          <li>Click <Strong>Today</Strong> to jump back to the current date.</li>
        </ul>
      </Section>

      <Section title="Creating Tasks from Calendar">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Click on any day cell to create a new task scheduled for that date.</li>
          <li>The task is added to the Inbox and a timer session opens automatically.</li>
        </ul>
      </Section>

      <Section title="Task Display">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Tasks with a <Strong>scheduledAt</Strong> date appear on their calendar day.</li>
          <li>Task colors are inherited from their parent folder's color.</li>
          <li>Click a task chip to navigate to the Tasks view with that task selected.</li>
        </ul>
      </Section>

      <Section title="Week View Time Grid">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The week view shows a time grid with hourly rows.</li>
          <li>Tasks are positioned based on their scheduled time.</li>
          <li>All-day or unscheduled-time tasks appear in the top section.</li>
        </ul>
      </Section>

      <Section title="Filtering">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Use folder tags and colors to visually distinguish task categories.</li>
          <li>Only non-deleted tasks with scheduled dates appear on the calendar.</li>
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
