import type { ReactNode } from 'react';
import type { SectionId } from '../../types/navigation';
import type { TaskNode } from '../../types/taskTree';
import { Sidebar } from './Sidebar';
import { SubSidebar } from './SubSidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onOpenTimerModal: () => void;
  folders: TaskNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (title: string) => void;
}

export function Layout({
  children,
  activeSection,
  onSectionChange,
  onOpenTimerModal,
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onOpenTimerModal={onOpenTimerModal}
      />
      {activeSection === 'tasks' && (
        <SubSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
        />
      )}
      <MainContent>{children}</MainContent>
    </div>
  );
}
