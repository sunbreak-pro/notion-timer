import type { ReactNode } from 'react';
import type { SectionId } from '../../types/navigation';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
}

export function Layout({ children, activeSection, onSectionChange }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
      <MainContent>{children}</MainContent>
    </div>
  );
}
