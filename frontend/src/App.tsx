import { useState } from 'react';
import { Layout } from './components/Layout';
import { TaskList } from './components/TaskList';
import { useTasks } from './hooks/useTasks';

function App() {
  const [activeSection, setActiveSection] = useState('tasks');
  const [focusMode, setFocusMode] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);

  const {
    incompleteTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
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
      case 'tasks':
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
      case 'sounds':
        return (
          <div className="text-notion-text-secondary">
            <h2 className="text-2xl font-bold text-notion-text mb-4">Sounds</h2>
            <p>環境音ミキサー（Phase 2で実装）</p>
          </div>
        );
      case 'timer':
        return (
          <div className="text-notion-text-secondary">
            <h2 className="text-2xl font-bold text-notion-text mb-4">Timer</h2>
            <p>ポモドーロタイマー（Phase 2で実装）</p>
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
