import { useState } from "react";
import { Layout } from "./components/Layout";
import { TaskDetail } from "./components/TaskDetail";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import { useTimerContext } from "./hooks/useTimerContext";
import { useTaskTreeContext } from "./hooks/useTaskTreeContext";
import type { SectionId } from "./types/navigation";
import type { TaskNode } from "./types/taskTree";

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("tasks");
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const selectedFolderId: string | null = null;
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const timer = useTimerContext();
  const { nodes, addNode, updateNode, softDelete } = useTaskTreeContext();

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

  const handleDeleteSelectedTask = () => {
    if (!selectedTask) return;
    softDelete(selectedTask.id);
    setSelectedTaskId(null);
  };

  const handleUpdateContent = (content: string) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { content });
  };

  const handleDurationChange = (minutes: number) => {
    if (!selectedTaskId) return;
    // 0 means "reset to global default"
    updateNode(selectedTaskId, { workDurationMinutes: minutes === 0 ? undefined : minutes });
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
    addNode('task', selectedFolderId, title);
  };

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
          />
        );
      case "session":
        return <WorkScreen />;
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
        selectedFolderId={selectedFolderId}
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
