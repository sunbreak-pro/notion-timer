import type { Task } from '../types/task';

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Sonic Flowの設計書を読む',
    status: 'TODO',
    createdAt: new Date('2024-01-15T09:00:00'),
  },
  {
    id: 2,
    title: 'Reactプロジェクトをセットアップ',
    status: 'DONE',
    createdAt: new Date('2024-01-14T10:00:00'),
    completedAt: new Date('2024-01-14T11:30:00'),
  },
  {
    id: 3,
    title: 'タスク管理UIを実装する',
    status: 'TODO',
    createdAt: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 4,
    title: '環境音ミキサーの設計',
    status: 'TODO',
    createdAt: new Date('2024-01-15T11:00:00'),
  },
];
