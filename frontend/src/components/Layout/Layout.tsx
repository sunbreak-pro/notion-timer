import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Layout({ children, activeSection, onSectionChange }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
      <MainContent>{children}</MainContent>
    </div>
  );
}
