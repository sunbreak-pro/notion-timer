import { useRef, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { SectionId } from "../../types/navigation";
import type { TaskNode } from "../../types/taskTree";
import { Sidebar } from "./Sidebar";
import { SubSidebar } from "./SubSidebar";
import { MainContent } from "./MainContent";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const MIN_WIDTH = 160;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 240;

function deserializeWidth(raw: string): number {
  const val = parseInt(raw, 10);
  return (val >= MIN_WIDTH && val <= MAX_WIDTH) ? val : DEFAULT_WIDTH;
}

interface LayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onOpenTimerModal: () => void;
  onCreateFolder: (title: string) => void;
  onCreateTask?: (title: string) => void;
  onSelectTask?: (id: string) => void;
  onPlayTask?: (node: TaskNode) => void;
  selectedTaskId?: string | null;
}

const SIDEBAR_WIDTH = 240; // Sidebar w-60 = 15rem = 240px

export function Layout({
  children,
  activeSection,
  onSectionChange,
  onOpenTimerModal,
  onCreateFolder,
  onCreateTask,
  onSelectTask,
  onPlayTask,
  selectedTaskId,
}: LayoutProps) {
  const [subSidebarWidth, setSubSidebarWidth] = useLocalStorage<number>(
    STORAGE_KEYS.SUBSIDEBAR_WIDTH,
    DEFAULT_WIDTH,
    { serialize: String, deserialize: deserializeWidth }
  );
  const isResizing = useRef(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX - SIDEBAR_WIDTH;
      const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setDragWidth(clamped);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setDragWidth(prev => {
          if (prev !== null) setSubSidebarWidth(prev);
          return null;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setSubSidebarWidth]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onOpenTimerModal={onOpenTimerModal}
      />
      {activeSection === "tasks" && (
        <div className="relative shrink-0" style={{ width: dragWidth ?? subSidebarWidth }}>
          <SubSidebar
            width={dragWidth ?? subSidebarWidth}
            onCreateFolder={onCreateFolder}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            onPlayTask={onPlayTask}
            selectedTaskId={selectedTaskId}
          />
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-notion-accent/30 transition-colors z-10"
          />
        </div>
      )}
      <MainContent>{children}</MainContent>
    </div>
  );
}
