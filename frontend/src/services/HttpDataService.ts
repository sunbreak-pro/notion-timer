import type { DataService } from './DataService';
import type { CustomSoundMeta } from '../types/customSound';
import * as taskApi from '../api/taskClient';
import * as timerApi from '../api/timerClient';
import * as soundApi from '../api/soundClient';
import * as memoApi from '../api/memoClient';
import * as aiApi from '../api/aiClient';
import { getAudioBlob, saveAudioBlob, deleteAudioBlob } from '../storage/customSoundStorage';

export class HttpDataService implements DataService {
  // Tasks
  fetchTaskTree = taskApi.fetchTaskTree;
  fetchDeletedTasks = taskApi.fetchDeletedTasks;
  createTask = taskApi.createTask;
  updateTask = taskApi.updateTask;
  syncTaskTree = taskApi.syncTaskTree;
  softDeleteTask = taskApi.softDeleteTask;
  restoreTask = taskApi.restoreTask;
  permanentDeleteTask = taskApi.permanentDeleteTask;
  migrateTasksToBackend = taskApi.migrateTasksToBackend;

  // Timer
  fetchTimerSettings = timerApi.fetchTimerSettings;
  updateTimerSettings = timerApi.updateTimerSettings;
  startTimerSession = timerApi.startTimerSession;
  endTimerSession = timerApi.endTimerSession;
  fetchTimerSessions = timerApi.fetchTimerSessions;
  fetchSessionsByTaskId = timerApi.fetchSessionsByTaskId;

  // Sound
  fetchSoundSettings = soundApi.fetchSoundSettings;
  updateSoundSetting = soundApi.updateSoundSetting;
  fetchSoundPresets = soundApi.fetchSoundPresets;
  createSoundPreset = soundApi.createSoundPreset;
  deleteSoundPreset = soundApi.deleteSoundPreset;

  // Memo
  fetchAllMemos = memoApi.fetchAllMemos;
  fetchMemoByDate = memoApi.fetchMemoByDate;
  upsertMemo = memoApi.upsertMemo;
  deleteMemo = memoApi.deleteMemo;

  // Custom Sounds (idb-keyval + localStorage for Web mode)
  async saveCustomSound(id: string, data: ArrayBuffer, meta: CustomSoundMeta): Promise<void> {
    const blob = new Blob([data], { type: meta.mimeType });
    await saveAudioBlob(id, blob);
    const stored = this._loadCustomSoundMetas();
    stored.push(meta);
    this._saveCustomSoundMetas(stored);
  }
  async loadCustomSound(id: string): Promise<ArrayBuffer | null> {
    const blob = await getAudioBlob(id);
    if (!blob) return null;
    return blob.arrayBuffer();
  }
  async deleteCustomSound(id: string): Promise<void> {
    await deleteAudioBlob(id);
    const stored = this._loadCustomSoundMetas().filter(m => m.id !== id);
    this._saveCustomSoundMetas(stored);
  }
  async fetchCustomSoundMetas(): Promise<CustomSoundMeta[]> {
    return this._loadCustomSoundMetas();
  }
  private _loadCustomSoundMetas(): CustomSoundMeta[] {
    try {
      const raw = localStorage.getItem('sonic-flow-custom-sounds');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  private _saveCustomSoundMetas(metas: CustomSoundMeta[]): void {
    localStorage.setItem('sonic-flow-custom-sounds', JSON.stringify(metas));
  }

  // AI
  fetchAIAdvice = aiApi.fetchAIAdvice;
  fetchAISettings = aiApi.fetchAISettings;
  updateAISettings = aiApi.updateAISettings;
}
