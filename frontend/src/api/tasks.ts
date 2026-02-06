import { apiClient } from './client';
import type { Task, TaskStatus } from '../types/task';

interface TaskResponse {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
}

function mapTaskResponse(response: TaskResponse): Task {
  return {
    id: response.id,
    title: response.title,
    status: response.status,
    createdAt: new Date(response.createdAt),
    completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
  };
}

export const tasksApi = {
  async getIncompleteTasks(): Promise<Task[]> {
    const response = await apiClient.get<TaskResponse[]>('/api/tasks');
    return response.data.map(mapTaskResponse);
  },

  async getCompletedTasks(): Promise<Task[]> {
    const response = await apiClient.get<TaskResponse[]>('/api/tasks/history');
    return response.data.map(mapTaskResponse);
  },

  async createTask(title: string): Promise<Task> {
    const response = await apiClient.post<TaskResponse>('/api/tasks', { title });
    return mapTaskResponse(response.data);
  },

  async updateTask(id: number, updates: { title?: string; status?: TaskStatus }): Promise<Task> {
    const response = await apiClient.put<TaskResponse>(`/api/tasks/${id}`, updates);
    return mapTaskResponse(response.data);
  },

  async deleteTask(id: number): Promise<void> {
    await apiClient.delete(`/api/tasks/${id}`);
  },
};
