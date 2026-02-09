import { useState, useEffect, useCallback } from "react";
import { Layout } from "./components/Layout";
import { TaskDetail } from "./components/TaskDetail";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import { CalendarView } from "./components/Calendar/CalendarView";
import { AnalyticsView } from "./components/Analytics/AnalyticsView";
import { useTimerContext } from "./hooks/useTimerContext";
import { useTaskTreeContext } from "./hooks/useTaskTreeContext";
import { useMigration } from "./hooks/useMigration";
import type { SectionId } from "./types/navigation";
import type { TaskNode } from "./types/taskTree";

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("tasks");
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const timer = useTimerContext();
  const { nodes, addNode, updateNode, softDelete, getTaskColor, getFolderTagForTask } = useTaskTreeContext();

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

  const isInputFocused = useCallback(() => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (document.activeElement?.getAttribute('contenteditable') === 'true') return true;
    return false;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
            onNavigateToSettings={() => setActiveSection('settings')}
            folderTag={selectedTask ? getFolderTagForTask(selectedTask.id) : undefined}
            taskColor={selectedTask ? getTaskColor(selectedTask.id) : undefined}
          />
        );
      case "session":
        return <WorkScreen />;
      case "calendar":
        return <CalendarView onSelectTask={handleCalendarSelectTask} onCreateTask={handleCalendarCreateTask} />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <Settings />;
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
