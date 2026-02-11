import type { DataService } from './DataService';
import type { TaskNode } from '../types/taskTree';
import type { TimerSettings, TimerSession, SessionType } from '../types/timer';
import type { SoundSettings, SoundPreset } from '../types/sound';
import type { MemoNode } from '../types/memo';
import type { AIAdviceRequest, AIAdviceResponse, AISettingsResponse } from '../types/ai';
import type { CustomSoundMeta } from '../types/customSound';

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return window.electronAPI!.invoke<T>(channel, ...args);
}

export class ElectronDataService implements DataService {
  // Tasks
  fetchTaskTree(): Promise<TaskNode[]> {
    return invoke('db:tasks:fetchTree');
  }
  fetchDeletedTasks(): Promise<TaskNode[]> {
    return invoke('db:tasks:fetchDeleted');
  }
  createTask(node: TaskNode): Promise<TaskNode> {
    return invoke('db:tasks:create', node);
  }
  updateTask(id: string, updates: Partial<TaskNode>): Promise<TaskNode> {
    return invoke('db:tasks:update', id, updates);
  }
  syncTaskTree(nodes: TaskNode[]): Promise<void> {
    return invoke('db:tasks:syncTree', nodes);
  }
  softDeleteTask(id: string): Promise<void> {
    return invoke('db:tasks:softDelete', id);
  }
  restoreTask(id: string): Promise<void> {
    return invoke('db:tasks:restore', id);
  }
  permanentDeleteTask(id: string): Promise<void> {
    return invoke('db:tasks:permanentDelete', id);
  }
  migrateTasksToBackend(nodes: TaskNode[]): Promise<void> {
    return invoke('app:migrateFromLocalStorage', { tasks: nodes });
  }

  // Timer
  fetchTimerSettings(): Promise<TimerSettings> {
    return invoke('db:timer:fetchSettings');
  }
  updateTimerSettings(settings: Partial<Pick<TimerSettings, 'workDuration' | 'breakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak'>>): Promise<TimerSettings> {
    return invoke('db:timer:updateSettings', settings);
  }
  startTimerSession(sessionType: SessionType, taskId?: string): Promise<TimerSession> {
    return invoke('db:timer:startSession', sessionType, taskId ?? null);
  }
  endTimerSession(id: number, duration: number, completed: boolean): Promise<TimerSession> {
    return invoke('db:timer:endSession', id, duration, completed);
  }
  fetchTimerSessions(): Promise<TimerSession[]> {
    return invoke('db:timer:fetchSessions');
  }
  fetchSessionsByTaskId(taskId: string): Promise<TimerSession[]> {
    return invoke('db:timer:fetchSessionsByTaskId', taskId);
  }

  // Sound
  fetchSoundSettings(): Promise<SoundSettings[]> {
    return invoke('db:sound:fetchSettings');
  }
  updateSoundSetting(soundType: string, volume: number, enabled: boolean): Promise<SoundSettings> {
    return invoke('db:sound:updateSetting', soundType, volume, enabled);
  }
  fetchSoundPresets(): Promise<SoundPreset[]> {
    return invoke('db:sound:fetchPresets');
  }
  createSoundPreset(name: string, settingsJson: string): Promise<SoundPreset> {
    return invoke('db:sound:createPreset', name, settingsJson);
  }
  deleteSoundPreset(id: number): Promise<void> {
    return invoke('db:sound:deletePreset', id);
  }

  // Memo
  fetchAllMemos(): Promise<MemoNode[]> {
    return invoke('db:memo:fetchAll');
  }
  fetchMemoByDate(date: string): Promise<MemoNode | null> {
    return invoke('db:memo:fetchByDate', date);
  }
  upsertMemo(date: string, content: string): Promise<MemoNode> {
    return invoke('db:memo:upsert', date, content);
  }
  deleteMemo(date: string): Promise<void> {
    return invoke('db:memo:delete', date);
  }

  // Custom Sounds
  async saveCustomSound(_id: string, data: ArrayBuffer, meta: CustomSoundMeta): Promise<void> {
    await invoke('db:customSound:save', meta, data);
  }
  loadCustomSound(id: string): Promise<ArrayBuffer | null> {
    return invoke('db:customSound:load', id);
  }
  deleteCustomSound(id: string): Promise<void> {
    return invoke('db:customSound:delete', id);
  }
  fetchCustomSoundMetas(): Promise<CustomSoundMeta[]> {
    return invoke('db:customSound:fetchMetas');
  }

  // AI
  async fetchAIAdvice(request: AIAdviceRequest): Promise<AIAdviceResponse> {
    const result = await invoke<AIAdviceResponse & { error?: string; errorCode?: string }>('ai:advice', request);
    if (result.error) {
      const err = new Error(result.error) as Error & { errorCode?: string };
      err.errorCode = result.errorCode;
      throw err;
    }
    return result;
  }
  fetchAISettings(): Promise<AISettingsResponse> {
    return invoke('ai:fetchSettings');
  }
  updateAISettings(settings: { apiKey?: string; model?: string }): Promise<AISettingsResponse> {
    return invoke('ai:updateSettings', settings);
  }
}
