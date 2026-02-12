import { useCallback } from 'react';
import type { TaskNode, SectionId } from '../types/taskTree';
import type { TimerContextValue } from '../context/TimerContextValue';

interface UseTaskDetailHandlersParams {
  selectedTaskId: string | null;
  selectedTask: TaskNode | null;
  timer: TimerContextValue;
  updateNode: (id: string, updates: Partial<TaskNode>) => void;
  addNode: (type: 'task' | 'folder', parentId: string | null, title: string, extra?: Partial<TaskNode>) => TaskNode | undefined;
  softDelete: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setActiveSection: (section: SectionId) => void;
  setMemoDate: (date: string) => void;
}

export function useTaskDetailHandlers({
  selectedTaskId,
  selectedTask,
  timer,
  updateNode,
  addNode,
  softDelete,
  toggleTaskStatus,
  setSelectedTaskId,
  setActiveSection,
  setMemoDate,
}: UseTaskDetailHandlersParams) {
  const handlePlayTask = useCallback((node: TaskNode) => {
    timer.openForTask(node.id, node.title, node.workDurationMinutes);
    setActiveSection('work');
  }, [timer, setActiveSection]);

  const handlePlaySelectedTask = useCallback(() => {
    if (!selectedTask) return;
    timer.openForTask(selectedTask.id, selectedTask.title, selectedTask.workDurationMinutes);
    setActiveSection('work');
  }, [selectedTask, timer, setActiveSection]);

  const handleDeleteSelectedTask = useCallback(() => {
    if (!selectedTask) return;
    softDelete(selectedTask.id);
    setSelectedTaskId(null);
  }, [selectedTask, softDelete, setSelectedTaskId]);

  const handleUpdateContent = useCallback((content: string) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { content });
  }, [selectedTaskId, updateNode]);

  const handleDurationChange = useCallback((minutes: number) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { workDurationMinutes: minutes === 0 ? undefined : minutes });
  }, [selectedTaskId, updateNode]);

  const handleScheduledAtChange = useCallback((scheduledAt: string | undefined) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { scheduledAt });
  }, [selectedTaskId, updateNode]);

  const handleTitleChange = useCallback((newTitle: string) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { title: newTitle });
  }, [selectedTaskId, updateNode]);

  const handleDueDateChange = useCallback((dueDate: string | undefined) => {
    if (!selectedTaskId) return;
    updateNode(selectedTaskId, { dueDate });
  }, [selectedTaskId, updateNode]);

  const handleFolderColorChange = useCallback((folderId: string, color: string) => {
    updateNode(folderId, { color });
  }, [updateNode]);

  const handleCompleteTask = useCallback(() => {
    const taskId = timer.activeTask?.id;
    if (!taskId) return;
    toggleTaskStatus(taskId);
    timer.pause();
    timer.reset();
    if (timer.showCompletionModal) timer.dismissCompletionModal();
    timer.clearTask();
    setActiveSection('tasks');
  }, [timer, toggleTaskStatus, setActiveSection]);

  const handleCalendarSelectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveSection('tasks');
  }, [setSelectedTaskId, setActiveSection]);

  const handleCalendarCreateTask = useCallback((date: Date) => {
    const scheduledDate = new Date(date);
    scheduledDate.setHours(12, 0, 0, 0);
    const newNode = addNode('task', null, 'Untitled', { scheduledAt: scheduledDate.toISOString() });
    if (!newNode) return;
    timer.openForTask(newNode.id, newNode.title, newNode.workDurationMinutes);
    setActiveSection('work');
  }, [addNode, timer, setActiveSection]);

  const handleCalendarSelectMemo = useCallback((date: string) => {
    setMemoDate(date);
    setActiveSection('memo');
  }, [setMemoDate, setActiveSection]);

  const handleCreateFolder = useCallback((title: string) => {
    addNode('folder', null, title);
  }, [addNode]);

  const handleCreateTask = useCallback((title: string) => {
    addNode('task', null, title);
  }, [addNode]);

  return {
    handlePlayTask,
    handlePlaySelectedTask,
    handleDeleteSelectedTask,
    handleUpdateContent,
    handleDurationChange,
    handleScheduledAtChange,
    handleTitleChange,
    handleDueDateChange,
    handleFolderColorChange,
    handleCompleteTask,
    handleCalendarSelectTask,
    handleCalendarCreateTask,
    handleCalendarSelectMemo,
    handleCreateFolder,
    handleCreateTask,
  };
}
