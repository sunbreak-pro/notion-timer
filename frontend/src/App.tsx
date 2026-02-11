import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Layout } from "./components/Layout";
import type { LayoutHandle } from "./components/Layout";
import { TaskDetail } from "./components/TaskDetail";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import { Tips } from "./components/Tips";
import { CalendarView } from "./components/Calendar/CalendarView";
import { AnalyticsView } from "./components/Analytics/AnalyticsView";
import { MemoView } from "./components/Memo";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import type { Command } from "./components/CommandPalette/CommandPalette";
import { UpdateNotification } from "./components/UpdateNotification";
import { useTimerContext } from "./hooks/useTimerContext";
import { useTaskTreeContext } from "./hooks/useTaskTreeContext";
import { useMemoContext } from "./hooks/useMemoContext";
import { getDataService } from "./services";

import type { SectionId } from "./types/taskTree";
import type { TaskNode } from "./types/taskTree";
import { isMac } from "./utils/platform";
import {
  ListTodo,
  StickyNote,
  Timer,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  Lightbulb,
  Plus,
  FolderPlus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  PanelLeft,
  PanelRight,
} from "lucide-react";

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("tasks");
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const layoutRef = useRef<LayoutHandle | null>(null);
  const timer = useTimerContext();
  const {
    nodes,
    addNode,
    updateNode,
    softDelete,
    getTaskColor,
    getFolderTagForTask,
    persistError,
  } = useTaskTreeContext();
  const { setSelectedDate: setMemoDate } = useMemoContext();

  const selectedTask = selectedTaskId
    ? (nodes.find((n) => n.id === selectedTaskId && n.type === "task") ?? null)
    : null;

  const handlePlayTask = (node: TaskNode) => {
    timer.openForTask(node.id, node.title, node.workDurationMinutes);
    setIsTimerModalOpen(true);
  };

  const handlePlaySelectedTask = () => {
    if (!selectedTask) return;
    timer.openForTask(
      selectedTask.id,
      selectedTask.title,
      selectedTask.workDurationMinutes,
    );
    setIsTimerModalOpen(true);
  };

  const handleDeleteSelectedTask = useCallback(() => {
    if (!selectedTask) return;
    softDelete(selectedTask.id);
    setSelectedTaskId(null);
  }, [selectedTask, softDelete]);

  const handleUpdateContent = (content: string) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { content });
  };

  const handleDurationChange = (minutes: number) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, {
      workDurationMinutes: minutes === 0 ? undefined : minutes,
    });
  };

  const handleScheduledAtChange = (scheduledAt: string | undefined) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { scheduledAt });
  };

  const handleFolderColorChange = (folderId: string, color: string) => {
    updateNode(folderId, { color });
  };

  const handleOpenTimerModal = () => {
    setIsTimerModalOpen(true);
  };

  const handleCloseTimerModal = () => {
    setIsTimerModalOpen(false);
  };

  const handleCreateFolder = (title: string) => {
    addNode("folder", null, title);
  };

  const handleCreateTask = (title: string) => {
    addNode("task", null, title);
  };

  const handleCalendarSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveSection("tasks");
  };

  const handleCalendarCreateTask = useCallback(
    (date: Date) => {
      const scheduledDate = new Date(date);
      scheduledDate.setHours(12, 0, 0, 0);
      const newNode = addNode("task", null, "Untitled", {
        scheduledAt: scheduledDate.toISOString(),
      });
      if (!newNode) return;
      timer.openForTask(newNode.id, newNode.title, newNode.workDurationMinutes);
      setIsTimerModalOpen(true);
    },
    [addNode, timer],
  );

  const handleCalendarSelectMemo = useCallback(
    (date: string) => {
      setMemoDate(date);
      setActiveSection("memo");
    },
    [setMemoDate],
  );

  const isInputFocused = useCallback(() => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return true;
    if (document.activeElement?.getAttribute("contenteditable") === "true")
      return true;
    return false;
  }, []);

  // Command palette commands
  const commands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-tasks",
        title: "Go to Tasks",
        category: "Navigation",
        shortcut: isMac ? "⌘1" : "Ctrl+1",
        icon: ListTodo,
        action: () => setActiveSection("tasks"),
      },
      {
        id: "nav-memo",
        title: "Go to Memo",
        category: "Navigation",
        icon: StickyNote,
        action: () => setActiveSection("memo"),
      },
      {
        id: "nav-session",
        title: "Go to Session",
        category: "Navigation",
        shortcut: isMac ? "⌘2" : "Ctrl+2",
        icon: Timer,
        action: () => setActiveSection("session"),
      },
      {
        id: "nav-calendar",
        title: "Go to Calendar",
        category: "Navigation",
        shortcut: isMac ? "⌘3" : "Ctrl+3",
        icon: Calendar,
        action: () => setActiveSection("calendar"),
      },
      {
        id: "nav-analytics",
        title: "Go to Analytics",
        category: "Navigation",
        shortcut: isMac ? "⌘4" : "Ctrl+4",
        icon: BarChart3,
        action: () => setActiveSection("analytics"),
      },
      {
        id: "nav-settings",
        title: "Go to Settings",
        category: "Navigation",
        shortcut: isMac ? "⌘," : "Ctrl+,",
        icon: SettingsIcon,
        action: () => setActiveSection("settings"),
      },
      {
        id: "nav-tips",
        title: "Go to Tips",
        category: "Navigation",
        icon: Lightbulb,
        action: () => setActiveSection("tips"),
      },
      // Task
      {
        id: "task-create",
        title: "Create new task",
        category: "Task",
        shortcut: "n",
        icon: Plus,
        action: () => addNode("task", null, "New Task"),
      },
      {
        id: "task-create-folder",
        title: "Create new folder",
        category: "Task",
        icon: FolderPlus,
        action: () => addNode("folder", null, "New Folder"),
      },
      {
        id: "task-delete",
        title: "Delete selected task",
        category: "Task",
        shortcut: "Del",
        icon: Trash2,
        action: () => {
          if (selectedTask) {
            softDelete(selectedTask.id);
            setSelectedTaskId(null);
          }
        },
      },
      // Timer
      {
        id: "timer-modal",
        title: "Open timer modal",
        category: "Timer",
        shortcut: isMac ? "⌘⇧T" : "Ctrl+Shift+T",
        icon: Timer,
        action: () => setIsTimerModalOpen(true),
      },
      {
        id: "timer-toggle",
        title: timer.isRunning ? "Pause timer" : "Start timer",
        category: "Timer",
        shortcut: "Space",
        icon: timer.isRunning ? Pause : Play,
        action: () => {
          if (timer.isRunning) timer.pause();
          else timer.start();
        },
      },
      {
        id: "timer-reset",
        title: "Reset timer",
        category: "Timer",
        shortcut: "r",
        icon: RotateCcw,
        action: () => timer.reset(),
      },
      // View
      {
        id: "view-left-sidebar",
        title: "Toggle left sidebar",
        category: "View",
        shortcut: isMac ? "⌘." : "Ctrl+.",
        icon: PanelLeft,
        action: () => layoutRef.current?.toggleLeftSidebar(),
      },
      {
        id: "view-right-sidebar",
        title: "Toggle right sidebar",
        category: "View",
        shortcut: isMac ? "⌘⇧." : "Ctrl+Shift+.",
        icon: PanelRight,
        action: () => layoutRef.current?.toggleRightSidebar(),
      },
    ],
    [addNode, selectedTask, softDelete, timer],
  );

  // Handle native menu actions from Electron
  useEffect(() => {
    const cleanup = window.electronAPI?.onMenuAction((action: string) => {
      switch (action) {
        case "new-task":
          addNode("task", null, "New Task");
          break;
        case "new-folder":
          addNode("folder", null, "New Folder");
          break;
        case "navigate:settings":
          setActiveSection("settings");
          break;
        case "navigate:tips":
          setActiveSection("tips");
          break;
        case "toggle-timer-modal":
          setIsTimerModalOpen((prev) => !prev);
          break;
        case "toggle-left-sidebar":
          layoutRef.current?.toggleLeftSidebar();
          break;
        case "toggle-right-sidebar":
          layoutRef.current?.toggleRightSidebar();
          break;
        case "export-data":
          getDataService().exportData().catch(console.warn);
          break;
        case "import-data":
          getDataService()
            .importData()
            .then((ok) => {
              if (ok) window.location.reload();
            })
            .catch(console.warn);
          break;
      }
    });
    return () => {
      cleanup?.();
    };
  }, [addNode]);

  useEffect(() => {
    const sectionMap: Record<string, SectionId> = {
      "1": "tasks",
      "2": "session",
      "3": "calendar",
      "4": "analytics",
      "5": "settings",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K → Command Palette (but defer to TipTap Link when editor has selection)
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.code === "KeyK") {
        const el = document.activeElement;
        const isEditorWithSelection =
          el?.getAttribute("contenteditable") === "true" &&
          window.getSelection()?.toString();
        if (!isEditorWithSelection) {
          e.preventDefault();
          setIsCommandPaletteOpen((prev) => !prev);
          return;
        }
      }

      // Cmd/Ctrl+, → Settings (works even when input is focused)
      if (mod && e.code === "Comma") {
        e.preventDefault();
        setActiveSection("settings");
        return;
      }

      // Cmd/Ctrl+1-5 → Section switching (works even when input is focused)
      if (mod && !e.shiftKey && sectionMap[e.key]) {
        e.preventDefault();
        setActiveSection(sectionMap[e.key]);
        return;
      }

      // Cmd/Ctrl+Shift+T → Timer modal toggle (works even when input is focused)
      if (mod && e.shiftKey && e.code === "KeyT") {
        e.preventDefault();
        setIsTimerModalOpen((prev) => !prev);
        return;
      }

      if (isInputFocused()) return;

      if (e.key === " ") {
        e.preventDefault();
        if (timer.isRunning) {
          timer.pause();
        } else {
          timer.start();
        }
      }

      if (e.key === "n") {
        e.preventDefault();
        addNode("task", null, "New Task");
      }

      // r → Timer reset
      if (e.key === "r") {
        e.preventDefault();
        timer.reset();
      }

      if (e.key === "Escape" && isTimerModalOpen) {
        setIsTimerModalOpen(false);
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedTask) {
        e.preventDefault();
        handleDeleteSelectedTask();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    timer,
    isTimerModalOpen,
    selectedTask,
    addNode,
    isInputFocused,
    handleDeleteSelectedTask,
  ]);

  const renderContent = () => {
    switch (activeSection) {
      case "tasks":
        return (
          <TaskDetail
            task={selectedTask}
            allNodes={nodes}
            globalWorkDuration={timer.workDurationMinutes}
            onPlay={handlePlaySelectedTask}
            onDelete={handleDeleteSelectedTask}
            onUpdateContent={handleUpdateContent}
            onDurationChange={handleDurationChange}
            onScheduledAtChange={handleScheduledAtChange}
            onFolderColorChange={handleFolderColorChange}
            onNavigateToSettings={() => setActiveSection("settings")}
            folderTag={
              selectedTask ? getFolderTagForTask(selectedTask.id) : undefined
            }
            taskColor={selectedTask ? getTaskColor(selectedTask.id) : undefined}
          />
        );
      case "memo":
        return <MemoView />;
      case "session":
        return <WorkScreen />;
      case "calendar":
        return (
          <CalendarView
            onSelectTask={handleCalendarSelectTask}
            onCreateTask={handleCalendarCreateTask}
            onSelectMemo={handleCalendarSelectMemo}
          />
        );
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <Settings />;
      case "tips":
        return <Tips />;
      default:
        return null;
    }
  };

  return (
    <>
      <UpdateNotification />
      {persistError && (
        <div className="fixed top-0 left-0 right-0 z-9999 bg-red-600 text-white text-sm px-4 py-2 text-center">
          Save failed: {persistError}
        </div>
      )}
      <Layout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenTimerModal={handleOpenTimerModal}
        onCreateFolder={handleCreateFolder}
        onCreateTask={handleCreateTask}
        onSelectTask={setSelectedTaskId}
        onPlayTask={handlePlayTask}
        selectedTaskId={selectedTaskId}
        handleRef={layoutRef}
      >
        {renderContent()}
      </Layout>

      {isTimerModalOpen && (
        <WorkScreen isOverlay onClose={handleCloseTimerModal} />
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
    </>
  );
}

export default App;
