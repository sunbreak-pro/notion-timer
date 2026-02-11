import type { TaskNode } from '../types/taskTree';
import type { TimerSettings, TimerSession, SessionType } from '../types/timer';
import type { SoundSettings, SoundPreset } from '../types/sound';
import type { MemoNode } from '../types/memo';
import type { AIAdviceRequest, AIAdviceResponse, AISettingsResponse } from '../types/ai';
import type { CustomSoundMeta } from '../types/customSound';
import type { Tag } from '../types/tag';
import type { TaskTemplate } from '../types/template';
import type { LogEntry, IpcChannelMetrics, SystemInfo } from '../types/diagnostics';

export interface DataService {
  // Tasks
  fetchTaskTree(): Promise<TaskNode[]>;
  fetchDeletedTasks(): Promise<TaskNode[]>;
  createTask(node: TaskNode): Promise<TaskNode>;
  updateTask(id: string, updates: Partial<TaskNode>): Promise<TaskNode>;
  syncTaskTree(nodes: TaskNode[]): Promise<void>;
  softDeleteTask(id: string): Promise<void>;
  restoreTask(id: string): Promise<void>;
  permanentDeleteTask(id: string): Promise<void>;
  migrateTasksToBackend(nodes: TaskNode[]): Promise<void>;

  // Timer
  fetchTimerSettings(): Promise<TimerSettings>;
  updateTimerSettings(settings: Partial<Pick<TimerSettings, 'workDuration' | 'breakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak'>>): Promise<TimerSettings>;
  startTimerSession(sessionType: SessionType, taskId?: string): Promise<TimerSession>;
  endTimerSession(id: number, duration: number, completed: boolean): Promise<TimerSession>;
  fetchTimerSessions(): Promise<TimerSession[]>;
  fetchSessionsByTaskId(taskId: string): Promise<TimerSession[]>;

  // Sound
  fetchSoundSettings(): Promise<SoundSettings[]>;
  updateSoundSetting(soundType: string, volume: number, enabled: boolean): Promise<SoundSettings>;
  fetchSoundPresets(): Promise<SoundPreset[]>;
  createSoundPreset(name: string, settingsJson: string): Promise<SoundPreset>;
  deleteSoundPreset(id: number): Promise<void>;

  // Memo
  fetchAllMemos(): Promise<MemoNode[]>;
  fetchMemoByDate(date: string): Promise<MemoNode | null>;
  upsertMemo(date: string, content: string): Promise<MemoNode>;
  deleteMemo(date: string): Promise<void>;

  // Custom Sounds
  saveCustomSound(id: string, data: ArrayBuffer, meta: CustomSoundMeta): Promise<void>;
  loadCustomSound(id: string): Promise<ArrayBuffer | null>;
  deleteCustomSound(id: string): Promise<void>;
  fetchCustomSoundMetas(): Promise<CustomSoundMeta[]>;

  // AI
  fetchAIAdvice(request: AIAdviceRequest): Promise<AIAdviceResponse>;
  fetchAISettings(): Promise<AISettingsResponse>;
  updateAISettings(settings: { apiKey?: string; model?: string }): Promise<AISettingsResponse>;

  // Tags
  fetchAllTags(): Promise<Tag[]>;
  createTag(name: string, color: string): Promise<Tag>;
  updateTag(id: number, updates: { name?: string; color?: string }): Promise<Tag>;
  deleteTag(id: number): Promise<void>;
  fetchTagsForTask(taskId: string): Promise<Tag[]>;
  setTagsForTask(taskId: string, tagIds: number[]): Promise<void>;

  // Templates
  fetchTemplates(): Promise<TaskTemplate[]>;
  createTemplate(name: string, nodesJson: string): Promise<TaskTemplate>;
  getTemplate(id: number): Promise<TaskTemplate | null>;
  deleteTemplate(id: number): Promise<void>;

  // Data I/O
  exportData(): Promise<boolean>;
  importData(): Promise<boolean>;

  // Diagnostics
  fetchLogs(options?: { level?: string; limit?: number }): Promise<LogEntry[]>;
  openLogFolder(): Promise<void>;
  exportLogs(): Promise<boolean>;
  fetchMetrics(): Promise<IpcChannelMetrics[]>;
  resetMetrics(): Promise<boolean>;
  fetchSystemInfo(): Promise<SystemInfo>;

  // Updater
  checkForUpdates(): Promise<void>;
  downloadUpdate(): Promise<void>;
  installUpdate(): Promise<void>;
}
