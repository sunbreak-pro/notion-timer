import { useState, useRef } from "react";
import { Layout } from "./components/Layout";
import type { LayoutHandle } from "./components/Layout";
import { TaskDetail } from "./components/TaskDetail";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import { Tips } from "./components/Tips";
import { CalendarView } from "./components/Calendar/CalendarView";
import { AnalyticsView } from "./components/Analytics/AnalyticsView";
import { MemoView } from "./components/Memo";
import { MusicScreen } from "./components/Music/MusicScreen";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { UpdateNotification } from "./components/UpdateNotification";
import { useTimerContext } from "./hooks/useTimerContext";
import { useTaskTreeContext } from "./hooks/useTaskTreeContext";
import { useMemoContext } from "./hooks/useMemoContext";
import { useAppCommands } from "./hooks/useAppCommands";
import { useAppKeyboardShortcuts } from "./hooks/useAppKeyboardShortcuts";
import { useElectronMenuActions } from "./hooks/useElectronMenuActions";
import { useTaskDetailHandlers } from "./hooks/useTaskDetailHandlers";

import type { SectionId } from "./types/taskTree";

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
    toggleTaskStatus,
    getTaskColor,
    getFolderTagForTask,
    persistError,
  } = useTaskTreeContext();
  const { setSelectedDate: setMemoDate } = useMemoContext();

  const selectedTask = selectedTaskId
    ? (nodes.find((n) => n.id === selectedTaskId && n.type === "task") ?? null)
    : null;

  const handlers = useTaskDetailHandlers({
    selectedTaskId,
    selectedTask,
    timer,
    updateNode,
    addNode,
    softDelete,
    toggleTaskStatus,
    setSelectedTaskId,
    setActiveSection,
    setIsTimerModalOpen,
    setMemoDate,
  });

  const commands = useAppCommands({
    setActiveSection,
    setIsTimerModalOpen,
    addNode,
    selectedTask,
    softDelete,
    setSelectedTaskId,
    timer,
    layoutRef,
  });

  useAppKeyboardShortcuts({
    timer,
    isTimerModalOpen,
    selectedTask,
    addNode,
    setActiveSection,
    setIsTimerModalOpen,
    setIsCommandPaletteOpen,
    handleDeleteSelectedTask: handlers.handleDeleteSelectedTask,
  });

  useElectronMenuActions({
    addNode,
    setActiveSection,
    setIsTimerModalOpen,
    layoutRef,
  });

  const renderContent = () => {
    switch (activeSection) {
      case "tasks":
        return (
          <TaskDetail
            task={selectedTask}
            allNodes={nodes}
            globalWorkDuration={timer.workDurationMinutes}
            onPlay={handlers.handlePlaySelectedTask}
            onDelete={handlers.handleDeleteSelectedTask}
            onUpdateContent={handlers.handleUpdateContent}
            onDurationChange={handlers.handleDurationChange}
            onScheduledAtChange={handlers.handleScheduledAtChange}
            onFolderColorChange={handlers.handleFolderColorChange}
            onTitleChange={handlers.handleTitleChange}
            onDueDateChange={handlers.handleDueDateChange}
            onNavigateToSettings={() => setActiveSection("settings")}
            folderTag={
              selectedTask ? getFolderTagForTask(selectedTask.id) : undefined
            }
            taskColor={selectedTask ? getTaskColor(selectedTask.id) : undefined}
          />
        );
      case "memo":
        return <MemoView />;
      case "music":
        return <MusicScreen />;
      case "calendar":
        return (
          <CalendarView
            onSelectTask={handlers.handleCalendarSelectTask}
            onCreateTask={handlers.handleCalendarCreateTask}
            onSelectMemo={handlers.handleCalendarSelectMemo}
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
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onCreateFolder={handlers.handleCreateFolder}
        onCreateTask={handlers.handleCreateTask}
        onSelectTask={setSelectedTaskId}
        onPlayTask={handlers.handlePlayTask}
        selectedTaskId={selectedTaskId}
        handleRef={layoutRef}
      >
        {renderContent()}
      </Layout>

      {isTimerModalOpen && (
        <WorkScreen isOverlay onClose={() => setIsTimerModalOpen(false)} onCompleteTask={handlers.handleCompleteTask} />
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
