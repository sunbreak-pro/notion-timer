import { useTranslation, Trans } from 'react-i18next';

interface AnalyticsTabProps {
  showMac: boolean;
}

export function AnalyticsTab({ showMac }: AnalyticsTabProps) {
  const { t } = useTranslation();
  const mod = showMac ? '⌘' : 'Ctrl';

  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title={t('tips.analyticsTab.overview')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('tips.analyticsTab.overviewList1')}</li>
          <li><Trans i18nKey="tips.analyticsTab.overviewList2" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.analyticsTab.overviewList3')}</li>
        </ul>
      </Section>

      <Section title={t('tips.analyticsTab.completion')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.analyticsTab.completionList1" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.analyticsTab.completionList2" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.analyticsTab.completionList3')}</li>
        </ul>
      </Section>

      <Section title={t('tips.analyticsTab.accessing')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.analyticsTab.accessingList1" values={{ mod }} components={{ kbd: <Kbd /> }} /></li>
          <li><Trans i18nKey="tips.analyticsTab.accessingList2" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.analyticsTab.accessingList3" values={{ mod }} components={{ kbd: <Kbd /> }} /></li>
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
