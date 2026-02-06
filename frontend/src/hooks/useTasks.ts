import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import type { Task, TaskStatus } from '../types/task';
import { tasksApi } from '../api/tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [incomplete, completed] = await Promise.all([
        tasksApi.getIncompleteTasks(),
        tasksApi.getCompletedTasks(),
      ]);
      setTasks([...incomplete, ...completed]);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
      } else {
        setError('タスクの取得に失敗しました');
      }
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (title: string) => {
    try {
      setError(null);
      const newTask = await tasksApi.createTask(title);
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      setError('タスクの作成に失敗しました');
      console.error('Failed to create task:', err);
    }
  }, []);

  const updateTask = useCallback(async (id: number, updates: Partial<Pick<Task, 'title' | 'status'>>) => {
    try {
      setError(null);
      const updatedTask = await tasksApi.updateTask(id, updates);
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );
    } catch (err) {
      setError('タスクの更新に失敗しました');
      console.error('Failed to update task:', err);
    }
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    try {
      setError(null);
      await tasksApi.deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      setError('タスクの削除に失敗しました');
      console.error('Failed to delete task:', err);
    }
  }, []);

  const toggleTaskStatus = useCallback(async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'TODO' ? 'DONE' : 'TODO';
    await updateTask(id, { status: newStatus });
  }, [tasks, updateTask]);

  const incompleteTasks = tasks.filter((t) => t.status === 'TODO');
  const completedTasks = tasks.filter((t) => t.status === 'DONE');

  return {
    tasks,
    incompleteTasks,
    completedTasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refetch: fetchTasks,
  };
}
