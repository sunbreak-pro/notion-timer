import { isMac } from '../../utils/platform';

const mod = isMac ? '⌘' : 'Ctrl';
const shift = isMac ? '⇧' : 'Shift';

export function TimerTab() {
  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title="Pomodoro Sessions">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The timer follows a <Strong>WORK &rarr; BREAK &rarr; LONG BREAK</Strong> cycle.</li>
          <li>Default: 25 min work, 5 min break, 15 min long break after 4 sessions.</li>
          <li>Customize durations in <Strong>Settings</Strong>.</li>
        </ul>
      </Section>

      <Section title="Starting a Session">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Click the <Strong>play button</Strong> on any task to start a focused session.</li>
          <li>Or go to the <Strong>Session</Strong> screen for a free (untied) timer.</li>
          <li>Press <Kbd>Space</Kbd> to toggle play/pause when not typing.</li>
          <li>Press <Kbd>r</Kbd> to reset the timer when not typing.</li>
        </ul>
      </Section>

      <Section title="Timer Modal & Background">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The timer runs as a <Strong>modal overlay</Strong> on top of any screen.</li>
          <li>Close the modal with <Kbd>Escape</Kbd> &mdash; the timer keeps running in the background.</li>
          <li>Press <Kbd>{`${mod} + ${shift} + T`}</Kbd> to toggle the timer modal from any screen.</li>
          <li>A mini timer widget appears in the left sidebar while active.</li>
        </ul>
      </Section>

      <Section title="Sound Mixer">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The Session screen includes an ambient <Strong>Sound Mixer</Strong>.</li>
          <li>Mix multiple background sounds (rain, cafe, etc.) with individual volume controls.</li>
          <li>Sound settings persist across sessions via localStorage.</li>
        </ul>
      </Section>

      <Section title="Notifications">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Enable browser notifications in Settings to get alerted when a session ends.</li>
          <li>Notification permission is requested once on toggle.</li>
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
