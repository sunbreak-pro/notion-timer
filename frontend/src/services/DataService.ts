import type { TaskNode } from '../types/taskTree';
import type { TimerSettings, TimerSession, SessionType } from '../types/timer';
import type { SoundSettings, SoundPreset, SoundTag, SoundDisplayMeta } from '../types/sound';
import type { MemoNode } from '../types/memo';
import type { AIAdviceRequest, AIAdviceResponse, AISettingsResponse } from '../types/ai';
import type { CustomSoundMeta } from '../types/customSound';
import type { NoteNode } from '../types/note';

import type { TaskTemplate } from '../types/template';
import type { CalendarNode } from '../types/calendar';
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
  fetchSoundSettings(sessionCategory?: string): Promise<SoundSettings[]>;
  updateSoundSetting(soundType: string, volume: number, enabled: boolean, sessionCategory?: string): Promise<SoundSettings>;
  fetchSoundPresets(): Promise<SoundPreset[]>;
  createSoundPreset(name: string, settingsJson: string): Promise<SoundPreset>;
  deleteSoundPreset(id: number): Promise<void>;

  // Sound Tags
  fetchAllSoundTags(): Promise<SoundTag[]>;
  createSoundTag(name: string, color: string): Promise<SoundTag>;
  updateSoundTag(id: number, updates: { name?: string; color?: string }): Promise<SoundTag>;
  deleteSoundTag(id: number): Promise<void>;
  fetchTagsForSound(soundId: string): Promise<SoundTag[]>;
  setTagsForSound(soundId: string, tagIds: number[]): Promise<void>;
  fetchAllSoundTagAssignments(): Promise<Array<{ sound_id: string; tag_id: number }>>;
  fetchAllSoundDisplayMeta(): Promise<SoundDisplayMeta[]>;
  updateSoundDisplayMeta(soundId: string, displayName: string): Promise<void>;
  fetchWorkscreenSelections(sessionCategory: string): Promise<Array<{ soundId: string; displayOrder: number }>>;
  setWorkscreenSelections(sessionCategory: string, soundIds: string[]): Promise<void>;

  // Memo
  fetchAllMemos(): Promise<MemoNode[]>;
  fetchMemoByDate(date: string): Promise<MemoNode | null>;
  upsertMemo(date: string, content: string): Promise<MemoNode>;
  deleteMemo(date: string): Promise<void>;

  // Notes
  fetchAllNotes(): Promise<NoteNode[]>;
  fetchDeletedNotes(): Promise<NoteNode[]>;
  createNote(id: string, title: string): Promise<NoteNode>;
  updateNote(id: string, updates: Partial<Pick<NoteNode, 'title' | 'content' | 'isPinned'>>): Promise<NoteNode>;
  softDeleteNote(id: string): Promise<void>;
  restoreNote(id: string): Promise<void>;
  permanentDeleteNote(id: string): Promise<void>;
  searchNotes(query: string): Promise<NoteNode[]>;

  // Custom Sounds
  saveCustomSound(id: string, data: ArrayBuffer, meta: CustomSoundMeta): Promise<void>;
  loadCustomSound(id: string): Promise<ArrayBuffer | null>;
  deleteCustomSound(id: string): Promise<void>;
  fetchCustomSoundMetas(): Promise<CustomSoundMeta[]>;

  // AI
  fetchAIAdvice(request: AIAdviceRequest): Promise<AIAdviceResponse>;
  fetchAISettings(): Promise<AISettingsResponse>;
  updateAISettings(settings: { apiKey?: string; model?: string }): Promise<AISettingsResponse>;


  // Templates
  fetchTemplates(): Promise<TaskTemplate[]>;
  createTemplate(name: string, nodesJson: string): Promise<TaskTemplate>;
  getTemplate(id: number): Promise<TaskTemplate | null>;
  deleteTemplate(id: number): Promise<void>;

  // Calendars
  fetchCalendars(): Promise<CalendarNode[]>;
  createCalendar(id: string, title: string, folderId: string): Promise<CalendarNode>;
  updateCalendar(id: string, updates: Partial<Pick<CalendarNode, 'title' | 'folderId' | 'order'>>): Promise<CalendarNode>;
  deleteCalendar(id: string): Promise<void>;

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
