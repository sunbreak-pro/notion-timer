export type TaskStatus = 'TODO' | 'DONE';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  completedAt?: Date;
}
