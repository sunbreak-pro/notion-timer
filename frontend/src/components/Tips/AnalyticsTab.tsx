import { isMac } from '../../utils/platform';

const mod = isMac ? '⌘' : 'Ctrl';

export function AnalyticsTab() {
  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title="Overview Metrics">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The Analytics dashboard shows key statistics about your tasks.</li>
          <li>Metrics include: <Strong>total tasks</Strong>, <Strong>completed</Strong>, <Strong>in progress</Strong>, and <Strong>folder count</Strong>.</li>
          <li>Data updates in real time as you create, complete, or delete tasks.</li>
        </ul>
      </Section>

      <Section title="Completion Rates">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>View your <Strong>overall completion rate</Strong> as a percentage with a progress bar.</li>
          <li>A separate <Strong>today&apos;s completion rate</Strong> tracks daily progress.</li>
          <li>Use these metrics to monitor your productivity trends.</li>
        </ul>
      </Section>

      <Section title="Accessing Analytics">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Press <Kbd>{`${mod} + 4`}</Kbd> to jump to Analytics from any screen.</li>
          <li>Or click <Strong>Analytics</Strong> in the left sidebar.</li>
          <li>Also available via the command palette (<Kbd>{`${mod} + K`}</Kbd> &rarr; &quot;Analytics&quot;).</li>
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
