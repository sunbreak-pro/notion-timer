import { useState } from "react";
import { Layout } from "./components/Layout";
import { TaskTree } from "./components/TaskTree";
import { WorkScreen } from "./components/WorkScreen";
import { Settings } from "./components/Settings";
import type { SectionId } from "./types/navigation";
import type { TaskNode } from "./types/taskTree";

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("tasks");
  const [workScreenTask, setWorkScreenTask] = useState<TaskNode | null>(null);

  const handlePlayTask = (node: TaskNode) => {
    setWorkScreenTask(node);
  };

  const handleCloseWorkScreen = () => {
    setWorkScreenTask(null);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "tasks":
        return <TaskTree onPlayTask={handlePlayTask} />;
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
      <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
        {renderContent()}
      </Layout>

      {workScreenTask && (
        <WorkScreen
          taskTitle={workScreenTask.title}
          isOverlay
          onClose={handleCloseWorkScreen}
        />
      )}
    </>
  );
}

export default App;
