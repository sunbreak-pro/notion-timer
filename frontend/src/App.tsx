import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Layout } from "./components/Layout";
import { TaskList } from "./components/TaskList";
import { useTasks } from "./hooks/useTasks";

function App() {
  const [activeSection, setActiveSection] = useState("tasks");
  const [focusMode, setFocusMode] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);

  const {
    incompleteTasks,
    completedTasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refetch,
  } = useTasks();

  const handleToggleFocusMode = () => {
    setFocusMode((prev) => !prev);
    if (focusMode) {
      setFocusedTaskId(null);
    }
  };

  const handleFocusTask = (id: number | null) => {
    setFocusedTaskId(id);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "tasks":
        if (loading) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-notion-text-secondary" />
            </div>
          );
        }
        if (error) {
          return (
            <div className="flex flex-col items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button
                onClick={refetch}
                className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                再試行
              </button>
            </div>
          );
        }
        return (
          <TaskList
            incompleteTasks={incompleteTasks}
            completedTasks={completedTasks}
            onAdd={addTask}
            onToggle={toggleTaskStatus}
            onUpdate={(id, title) => updateTask(id, { title })}
            onDelete={deleteTask}
            focusMode={focusMode}
            focusedTaskId={focusedTaskId}
            onFocusTask={handleFocusTask}
            onToggleFocusMode={handleToggleFocusMode}
          />
        );
      case "sounds":
        return (
          <div className="text-notion-text-secondary">
            <h2 className="text-2xl font-bold text-notion-text mb-4">Sounds</h2>
            <p>環境音ミキサー（Phase 2で実装）</p>
          </div>
        );
      case "timer":
        return (
          <div className="text-notion-text-secondary">
            <h2 className="text-2xl font-bold text-notion-text mb-4">Timer</h2>
            <p>ポモドーロタイマー（Phase 2で実装）</p>
          </div>
        );
      case "settings":
        return (
          <div className="text-notion-text-secondary">
            <h2 className="text-2xl font-bold text-notion-text mb-4">
              Settings
            </h2>
            <p>設定（Phase ?で実装）</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </Layout>
  );
}

export default App;
