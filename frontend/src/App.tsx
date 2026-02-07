import { useState } from "react";
import { Layout } from "./components/Layout";
import { TaskTree } from "./components/TaskTree";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import { useTimerContext } from "./hooks/useTimerContext";
import { useTaskTreeContext } from "./hooks/useTaskTreeContext";
import type { SectionId } from "./types/navigation";
import type { TaskNode } from "./types/taskTree";

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("tasks");
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const timer = useTimerContext();
  const { getChildren, addNode } = useTaskTreeContext();

  const rootFolders = getChildren(null).filter(n => n.type === 'folder');

  const handlePlayTask = (node: TaskNode) => {
    timer.startForTask(node.id, node.title);
    setIsTimerModalOpen(true);
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

  const renderContent = () => {
    switch (activeSection) {
      case "tasks":
        return <TaskTree onPlayTask={handlePlayTask} selectedFolderId={selectedFolderId} />;
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
        folders={rootFolders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
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
