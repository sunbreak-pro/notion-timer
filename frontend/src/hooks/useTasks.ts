import { useState, useCallback } from 'react';
import type { Task, TaskStatus } from '../types/task';
import { mockTasks } from '../mocks/tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const addTask = useCallback((title: string) => {
    const newTask: Task = {
      id: Date.now(),
      title,
      status: 'TODO',
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((id: number, updates: Partial<Pick<Task, 'title' | 'status'>>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const updated = { ...task, ...updates };
        if (updates.status === 'DONE' && task.status !== 'DONE') {
          updated.completedAt = new Date();
        }
        if (updates.status === 'TODO') {
          updated.completedAt = undefined;
        }
        return updated;
      })
    );
  }, []);

  const deleteTask = useCallback((id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const toggleTaskStatus = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const newStatus: TaskStatus = task.status === 'TODO' ? 'DONE' : 'TODO';
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'DONE' ? new Date() : undefined,
        };
      })
    );
  }, []);

  const incompleteTasks = tasks.filter((t) => t.status === 'TODO');
  const completedTasks = tasks.filter((t) => t.status === 'DONE');

  return {
    tasks,
    incompleteTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
}
