import { useTranslation, Trans } from 'react-i18next';

interface TimerTabProps {
  showMac: boolean;
}

export function TimerTab({ showMac }: TimerTabProps) {
  const { t } = useTranslation();
  const mod = showMac ? '⌘' : 'Ctrl';
  const shift = showMac ? '⇧' : 'Shift';

  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title={t('tips.timerTab.pomodoro')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.timerTab.pomodoroList1" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.timerTab.pomodoroList2')}</li>
          <li><Trans i18nKey="tips.timerTab.pomodoroList3" components={{ strong: <Strong /> }} /></li>
        </ul>
      </Section>

      <Section title={t('tips.timerTab.starting')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.timerTab.startingList1" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.timerTab.startingList2" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.timerTab.startingList3" components={{ kbd: <Kbd /> }} /></li>
          <li><Trans i18nKey="tips.timerTab.startingList4" components={{ kbd: <Kbd /> }} /></li>
        </ul>
      </Section>

      <Section title={t('tips.timerTab.modal')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.timerTab.modalList1" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.timerTab.modalList2" components={{ kbd: <Kbd /> }} /></li>
          <li><Trans i18nKey="tips.timerTab.modalList3" values={{ mod, shift }} components={{ kbd: <Kbd /> }} /></li>
          <li>{t('tips.timerTab.modalList4')}</li>
        </ul>
      </Section>

      <Section title={t('tips.timerTab.soundMixer')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.timerTab.soundMixerList1" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.timerTab.soundMixerList2')}</li>
          <li>{t('tips.timerTab.soundMixerList3')}</li>
        </ul>
      </Section>

      <Section title={t('tips.timerTab.notifications')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('tips.timerTab.notificationsList1')}</li>
          <li>{t('tips.timerTab.notificationsList2')}</li>
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

function Strong({ children }: { children?: React.ReactNode }) {
  return <span className="font-medium text-notion-text">{children}</span>;
}

function Kbd({ children }: { children?: React.ReactNode }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-notion-hover border border-notion-border rounded text-notion-text">
      {children}
    </kbd>
  );
}
