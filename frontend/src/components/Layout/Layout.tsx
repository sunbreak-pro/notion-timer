import { useState, useRef, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { SectionId } from "../../types/navigation";
import type { TaskNode } from "../../types/taskTree";
import { Sidebar } from "./Sidebar";
import { SubSidebar } from "./SubSidebar";
import { MainContent } from "./MainContent";

const STORAGE_KEY = "sonic-flow-subsidebar-width";
const MIN_WIDTH = 160;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 240;

function getStoredWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseInt(stored, 10);
      if (val >= MIN_WIDTH && val <= MAX_WIDTH) return val;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDTH;
}

interface LayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onOpenTimerModal: () => void;
  selectedFolderId: string | null;
  onCreateFolder: (title: string) => void;
  onCreateTask?: (title: string) => void;
  onSelectTask?: (id: string) => void;
  onPlayTask?: (node: TaskNode) => void;
  selectedTaskId?: string | null;
}

export function Layout({
  children,
  activeSection,
  onSectionChange,
  onOpenTimerModal,
  selectedFolderId,
  onCreateFolder,
  onCreateTask,
  onSelectTask,
  onPlayTask,
  selectedTaskId,
}: LayoutProps) {
  const [subSidebarWidth, setSubSidebarWidth] = useState(getStoredWidth);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Sidebar is 48px wide (w-12)
      const newWidth = e.clientX - 48;
      const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setSubSidebarWidth(clamped);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setSubSidebarWidth((w) => {
          localStorage.setItem(STORAGE_KEY, String(w));
          return w;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onOpenTimerModal={onOpenTimerModal}
      />
      {activeSection === "tasks" && (
        <div className="relative" style={{ width: subSidebarWidth }}>
          <SubSidebar
            width={subSidebarWidth}
            selectedFolderId={selectedFolderId}
            onCreateFolder={onCreateFolder}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            onPlayTask={onPlayTask}
            selectedTaskId={selectedTaskId}
          />
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-notion-accent/30 transition-colors z-10"
          />
        </div>
      )}
      <MainContent>{children}</MainContent>
    </div>
  );
}
