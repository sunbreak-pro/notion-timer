import { useState, useEffect, useCallback } from "react";
import { Layout } from "./components/Layout";
import { TaskDetail } from "./components/TaskDetail";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import { Tips } from "./components/Tips";
import { CalendarView } from "./components/Calendar/CalendarView";
import { AnalyticsView } from "./components/Analytics/AnalyticsView";
import { MemoView } from "./components/Memo";
import { useTimerContext } from "./hooks/useTimerContext";
import { useTaskTreeContext } from "./hooks/useTaskTreeContext";
import { useMemoContext } from "./hooks/useMemoContext";
import { useMigration } from "./hooks/useMigration";
import type { SectionId } from "./types/navigation";
import type { TaskNode } from "./types/taskTree";

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("tasks");
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const timer = useTimerContext();
  const { nodes, addNode, updateNode, softDelete, getTaskColor, getFolderTagForTask } = useTaskTreeContext();
  const { setSelectedDate: setMemoDate } = useMemoContext();

  useMigration();

  const selectedTask = selectedTaskId
    ? nodes.find(n => n.id === selectedTaskId && n.type === 'task') ?? null
    : null;

  const handlePlayTask = (node: TaskNode) => {
    timer.openForTask(node.id, node.title, node.workDurationMinutes);
    setIsTimerModalOpen(true);
  };

  const handlePlaySelectedTask = () => {
    if (!selectedTask) return;
    timer.openForTask(selectedTask.id, selectedTask.title, selectedTask.workDurationMinutes);
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
    updateNode(selectedTaskId, { workDurationMinutes: minutes === 0 ? undefined : minutes });
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
    addNode('folder', null, title);
  };

  const handleCreateTask = (title: string) => {
    addNode('task', null, title);
  };

  const handleCalendarSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveSection('tasks');
  };

  const handleCalendarCreateTask = useCallback((date: Date) => {
    const scheduledDate = new Date(date);
    scheduledDate.setHours(12, 0, 0, 0);
    const newNode = addNode('task', null, 'Untitled', { scheduledAt: scheduledDate.toISOString() });
    if (!newNode) return;
    timer.openForTask(newNode.id, newNode.title, newNode.workDurationMinutes);
    setIsTimerModalOpen(true);
  }, [addNode, timer]);

  const handleCalendarSelectMemo = useCallback((date: string) => {
    setMemoDate(date);
    setActiveSection('memo');
  }, [setMemoDate]);

  const isInputFocused = useCallback(() => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (document.activeElement?.getAttribute('contenteditable') === 'true') return true;
    return false;
  }, []);

  useEffect(() => {
    const sectionMap: Record<string, SectionId> = {
      '1': 'tasks', '2': 'session', '3': 'calendar', '4': 'analytics', '5': 'settings',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+, → Settings (works even when input is focused)
      if (e.metaKey && e.code === 'Comma') {
        e.preventDefault();
        setActiveSection('settings');
        return;
      }

      // Cmd+1-5 → Section switching (works even when input is focused)
      if (e.metaKey && !e.shiftKey && sectionMap[e.key]) {
        e.preventDefault();
        setActiveSection(sectionMap[e.key]);
        return;
      }

      // Cmd+Shift+T → Timer modal toggle (works even when input is focused)
      if (e.metaKey && e.shiftKey && e.code === 'KeyT') {
        e.preventDefault();
        setIsTimerModalOpen(prev => !prev);
        return;
      }

      if (isInputFocused()) return;

      if (e.key === ' ') {
        e.preventDefault();
        if (timer.isRunning) {
          timer.pause();
        } else {
          timer.start();
        }
      }

      if (e.key === 'n') {
        e.preventDefault();
        addNode('task', null, 'New Task');
      }

      // r → Timer reset
      if (e.key === 'r') {
        e.preventDefault();
        timer.reset();
      }

      if (e.key === 'Escape' && isTimerModalOpen) {
        setIsTimerModalOpen(false);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTask) {
        e.preventDefault();
        handleDeleteSelectedTask();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer, isTimerModalOpen, selectedTask, addNode, isInputFocused, handleDeleteSelectedTask]);

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
            onNavigateToSettings={() => setActiveSection('settings')}
            folderTag={selectedTask ? getFolderTagForTask(selectedTask.id) : undefined}
            taskColor={selectedTask ? getTaskColor(selectedTask.id) : undefined}
          />
        );
      case "memo":
        return <MemoView />;
      case "session":
        return <WorkScreen />;
      case "calendar":
        return <CalendarView onSelectTask={handleCalendarSelectTask} onCreateTask={handleCalendarCreateTask} onSelectMemo={handleCalendarSelectMemo} />;
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
      <Layout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenTimerModal={handleOpenTimerModal}
        onCreateFolder={handleCreateFolder}
        onCreateTask={handleCreateTask}
        onSelectTask={setSelectedTaskId}
        onPlayTask={handlePlayTask}
        selectedTaskId={selectedTaskId}
      >
        {renderContent()}
      </Layout>

      {isTimerModalOpen && (
        <WorkScreen
          isOverlay
          onClose={handleCloseTimerModal}
        />
      )}
    </>
  );
}

export default App;
