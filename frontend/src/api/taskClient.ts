import type { TaskNode } from '../types/taskTree';

const API_BASE = '/api/tasks';

interface TaskNodeDTO {
  id: string;
  type: string;
  title: string;
  parentId: string | null;
  order: number;
  status: string | null;
  isExpanded: boolean | null;
  isDeleted: boolean | null;
  deletedAt: string | null;
  createdAt: string | null;
  completedAt: string | null;
  scheduledAt: string | null;
  content: string | null;
  workDurationMinutes: number | null;
}

function toDTO(node: TaskNode): TaskNodeDTO {
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    parentId: node.parentId,
    order: node.order,
    status: node.status ?? null,
    isExpanded: node.isExpanded ?? null,
    isDeleted: node.isDeleted ?? null,
    deletedAt: node.deletedAt ?? null,
    createdAt: node.createdAt,
    completedAt: node.completedAt ?? null,
    scheduledAt: node.scheduledAt ?? null,
    content: node.content ?? null,
    workDurationMinutes: node.workDurationMinutes ?? null,
  };
}

function fromDTO(dto: TaskNodeDTO): TaskNode {
  return {
    id: dto.id,
    type: dto.type as TaskNode['type'],
    title: dto.title,
    parentId: dto.parentId,
    order: dto.order ?? 0,
    status: (dto.status as TaskNode['status']) ?? undefined,
    isExpanded: dto.isExpanded ?? undefined,
    isDeleted: dto.isDeleted ?? undefined,
    deletedAt: dto.deletedAt ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    completedAt: dto.completedAt ?? undefined,
    scheduledAt: dto.scheduledAt ?? undefined,
    content: dto.content ?? undefined,
    workDurationMinutes: dto.workDurationMinutes ?? undefined,
  };
}

export async function fetchTaskTree(): Promise<TaskNode[]> {
  const res = await fetch(`${API_BASE}/tree`);
  if (!res.ok) throw new Error(`Failed to fetch task tree (${res.status})`);
  const dtos: TaskNodeDTO[] = await res.json();
  return dtos.map(fromDTO);
}

export async function fetchDeletedTasks(): Promise<TaskNode[]> {
  const res = await fetch(`${API_BASE}/deleted`);
  if (!res.ok) throw new Error(`Failed to fetch deleted tasks (${res.status})`);
  const dtos: TaskNodeDTO[] = await res.json();
  return dtos.map(fromDTO);
}

export async function createTask(node: TaskNode): Promise<TaskNode> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toDTO(node)),
  });
  if (!res.ok) throw new Error(`Failed to create task (${res.status})`);
  return fromDTO(await res.json());
}

export async function updateTask(id: string, updates: Partial<TaskNode>): Promise<TaskNode> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update task (${res.status})`);
  return fromDTO(await res.json());
}

export async function syncTaskTree(nodes: TaskNode[]): Promise<void> {
  const res = await fetch(`${API_BASE}/tree`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodes.map(toDTO)),
  });
  if (!res.ok) throw new Error(`Failed to sync task tree (${res.status})`);
}

export async function softDeleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/soft`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to soft delete task (${res.status})`);
}

export async function restoreTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/restore`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to restore task (${res.status})`);
}

export async function permanentDeleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to permanently delete task (${res.status})`);
}

export async function migrateTasksToBackend(nodes: TaskNode[]): Promise<void> {
  const res = await fetch('/api/migrate/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodes.map(toDTO)),
  });
  if (!res.ok) throw new Error(`Failed to migrate tasks (${res.status})`);
}
