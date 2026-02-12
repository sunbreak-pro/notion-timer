import { useRef, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import type { SectionId } from "../../types/taskTree";
import type { TaskNode } from "../../types/taskTree";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { MainContent } from "./MainContent";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 280;

function deserializeWidth(raw: string): number {
  const val = parseInt(raw, 10);
  return val >= MIN_WIDTH && val <= MAX_WIDTH ? val : DEFAULT_WIDTH;
}

function deserializeBool(raw: string): boolean {
  return raw !== "false";
}

export interface LayoutHandle {
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
}

interface LayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onCreateFolder: (title: string) => void;
  onCreateTask?: (title: string) => void;
  onSelectTask?: (id: string) => void;
  onPlayTask?: (node: TaskNode) => void;
  selectedTaskId?: string | null;
  handleRef?: React.MutableRefObject<LayoutHandle | null>;
}

export function Layout({
  children,
  activeSection,
  onSectionChange,
  onCreateFolder,
  onCreateTask,
  onSelectTask,
  onPlayTask,
  selectedTaskId,
  handleRef,
}: LayoutProps) {
  const [rightSidebarWidth, setRightSidebarWidth] = useLocalStorage<number>(
    STORAGE_KEYS.RIGHT_SIDEBAR_WIDTH,
    DEFAULT_WIDTH,
    { serialize: String, deserialize: deserializeWidth },
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useLocalStorage<boolean>(
    STORAGE_KEYS.LEFT_SIDEBAR_OPEN,
    true,
    { serialize: String, deserialize: deserializeBool },
  );
  const [rightSidebarOpen, setRightSidebarOpen] = useLocalStorage<boolean>(
    STORAGE_KEYS.RIGHT_SIDEBAR_OPEN,
    true,
    { serialize: String, deserialize: deserializeBool },
  );
  const isResizing = useRef(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        toggleLeftSidebar: () => setLeftSidebarOpen(prev => !prev),
        toggleRightSidebar: () => setRightSidebarOpen(prev => !prev),
      };
    }
  }, [handleRef, setLeftSidebarOpen, setRightSidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Period') {
        e.preventDefault();
        if (e.shiftKey) {
          setRightSidebarOpen(prev => !prev);
        } else {
          setLeftSidebarOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLeftSidebarOpen, setRightSidebarOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = document.documentElement.clientWidth - e.clientX;
      const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setDragWidth(clamped);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setDragWidth((prev) => {
          if (prev !== null) setRightSidebarWidth(prev);
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
  }, [setRightSidebarWidth]);

  const showRightSidebar = activeSection === "tasks";

  return (
    <div className="flex min-h-screen">
      {leftSidebarOpen ? (
        <LeftSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onToggle={() => setLeftSidebarOpen(false)}
        />
      ) : (
        <div className="w-12 h-screen bg-notion-bg-secondary border-r border-notion-border flex flex-col items-center pt-4 shrink-0">
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="p-1.5 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
          >
            <PanelLeft size={18} />
          </button>
        </div>
      )}
      <MainContent>{children}</MainContent>
      {showRightSidebar &&
        (rightSidebarOpen ? (
          <div
            className="relative shrink-0"
            style={{ width: dragWidth ?? rightSidebarWidth }}
          >
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-notion-accent/30 transition-colors z-10"
            />
            <RightSidebar
              width={dragWidth ?? rightSidebarWidth}
              onCreateFolder={onCreateFolder}
              onCreateTask={onCreateTask}
              onSelectTask={onSelectTask}
              onPlayTask={onPlayTask}
              selectedTaskId={selectedTaskId}
              onToggle={() => setRightSidebarOpen(false)}
            />
          </div>
        ) : (
          <div className="w-12 h-screen bg-notion-bg-subsidebar border-l border-notion-border flex flex-col items-center pt-4 shrink-0">
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="p-1.5 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
            >
              <PanelRight size={18} />
            </button>
          </div>
        ))}
    </div>
  );
}
