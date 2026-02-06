export type NodeType = 'folder' | 'subfolder' | 'task';
export type TaskStatus = 'TODO' | 'DONE';

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
}
