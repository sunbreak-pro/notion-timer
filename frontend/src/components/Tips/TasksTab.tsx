import { useTranslation, Trans } from 'react-i18next';

interface TasksTabProps {
  showMac: boolean;
}

export function TasksTab({ showMac }: TasksTabProps) {
  const { t } = useTranslation();
  const mod = showMac ? '⌘' : 'Ctrl';
  const shift = showMac ? '⇧' : 'Shift';

  return (
    <div className="space-y-6 text-sm text-notion-text-secondary">
      <Section title={t('tips.tasksTab.creating')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.tasksTab.creatingList1" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.tasksTab.creatingList2" components={{ kbd: <Kbd value="" /> }} /></li>
          <li>{t('tips.tasksTab.creatingList3')}</li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.organizing')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.tasksTab.organizingList1" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.tasksTab.organizingList2" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.tasksTab.organizingList3')}</li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.details')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('tips.tasksTab.detailsList1')}</li>
          <li>{t('tips.tasksTab.detailsList2')}</li>
          <li><Trans i18nKey="tips.tasksTab.detailsList3" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.tasksTab.detailsList4" values={{ mod, shift }} components={{ kbd: <Kbd value="" /> }} /></li>
          <li><Trans i18nKey="tips.tasksTab.detailsList5" values={{ mod, shift }} components={{ kbd: <Kbd value="" /> }} /></li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.folders')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('tips.tasksTab.foldersList1')}</li>
          <li>{t('tips.tasksTab.foldersList2')}</li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.softDelete')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('tips.tasksTab.softDeleteList1')}</li>
          <li><Trans i18nKey="tips.tasksTab.softDeleteList2" components={{ strong: <Strong /> }} /></li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.contextMenu')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('tips.tasksTab.contextMenuList1')}</li>
          <li><Trans i18nKey="tips.tasksTab.contextMenuList2" components={{ strong: <Strong /> }} /></li>
          <li><Trans i18nKey="tips.tasksTab.contextMenuList3" components={{ strong: <Strong /> }} /></li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.tags')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.tasksTab.tagsList1" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.tasksTab.tagsList2')}</li>
          <li>{t('tips.tasksTab.tagsList3')}</li>
        </ul>
      </Section>

      <Section title={t('tips.tasksTab.templates')}>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Trans i18nKey="tips.tasksTab.templatesList1" components={{ strong: <Strong /> }} /></li>
          <li>{t('tips.tasksTab.templatesList2')}</li>
          <li>{t('tips.tasksTab.templatesList3')}</li>
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

function Kbd({ children, value: _ }: { children?: React.ReactNode; value: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-notion-hover border border-notion-border rounded text-notion-text">
      {children}
    </kbd>
  );
}
