export type NodeType = 'folder' | 'task';
export type TaskStatus = 'TODO' | 'DONE';

export const MAX_FOLDER_DEPTH = 5;

export interface TaskNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  order: number;
  status?: TaskStatus;
  isExpanded?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  completedAt?: string;
  scheduledAt?: string;
  content?: string;
  workDurationMinutes?: number;
}
