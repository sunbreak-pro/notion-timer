import { vi } from 'vitest';
import type { DataService } from '../services/DataService';

export function createMockDataService(): DataService & { [K in keyof DataService]: ReturnType<typeof vi.fn> } {
  return {
    // Tasks
    fetchTaskTree: vi.fn().mockResolvedValue([]),
    fetchDeletedTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn().mockImplementation((node) => Promise.resolve(node)),
    updateTask: vi.fn().mockImplementation((_id, updates) => Promise.resolve(updates)),
    syncTaskTree: vi.fn().mockResolvedValue(undefined),
    softDeleteTask: vi.fn().mockResolvedValue(undefined),
    restoreTask: vi.fn().mockResolvedValue(undefined),
    permanentDeleteTask: vi.fn().mockResolvedValue(undefined),
    migrateTasksToBackend: vi.fn().mockResolvedValue(undefined),

    // Timer
    fetchTimerSettings: vi.fn().mockResolvedValue({
      id: 1,
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      updatedAt: new Date(),
    }),
    updateTimerSettings: vi.fn().mockImplementation((settings) => Promise.resolve({
      id: 1, workDuration: 25, breakDuration: 5, longBreakDuration: 15, sessionsBeforeLongBreak: 4,
      updatedAt: new Date(), ...settings,
    })),
    startTimerSession: vi.fn().mockImplementation((sessionType, taskId) => Promise.resolve({
      id: 1, taskId: taskId ?? null, sessionType, startedAt: new Date(), completedAt: null, duration: null, completed: false,
    })),
    endTimerSession: vi.fn().mockImplementation((id, duration, completed) => Promise.resolve({
      id, taskId: null, sessionType: 'WORK', startedAt: new Date(), completedAt: new Date(), duration, completed,
    })),
    fetchTimerSessions: vi.fn().mockResolvedValue([]),
    fetchSessionsByTaskId: vi.fn().mockResolvedValue([]),

    // Sound
    fetchSoundSettings: vi.fn().mockResolvedValue([]),
    updateSoundSetting: vi.fn().mockImplementation((soundType, volume, enabled) => Promise.resolve({
      id: 1, soundType, volume, enabled, updatedAt: new Date(),
    })),
    fetchSoundPresets: vi.fn().mockResolvedValue([]),
    createSoundPreset: vi.fn().mockImplementation((name, settingsJson) => Promise.resolve({
      id: 1, name, settingsJson, createdAt: new Date(),
    })),
    deleteSoundPreset: vi.fn().mockResolvedValue(undefined),

    // Sound Tags
    fetchAllSoundTags: vi.fn().mockResolvedValue([]),
    createSoundTag: vi.fn().mockImplementation((name, color) => Promise.resolve({ id: 1, name, color })),
    updateSoundTag: vi.fn().mockImplementation((id, updates) => Promise.resolve({ id, name: '', color: '', ...updates })),
    deleteSoundTag: vi.fn().mockResolvedValue(undefined),
    fetchTagsForSound: vi.fn().mockResolvedValue([]),
    setTagsForSound: vi.fn().mockResolvedValue(undefined),
    fetchAllSoundTagAssignments: vi.fn().mockResolvedValue([]),
    fetchAllSoundDisplayMeta: vi.fn().mockResolvedValue([]),
    updateSoundDisplayMeta: vi.fn().mockResolvedValue(undefined),
    fetchWorkscreenSelections: vi.fn().mockResolvedValue([]),
    setWorkscreenSelections: vi.fn().mockResolvedValue(undefined),

    // Memo
    fetchAllMemos: vi.fn().mockResolvedValue([]),
    fetchMemoByDate: vi.fn().mockResolvedValue(null),
    upsertMemo: vi.fn().mockImplementation((date, content) => Promise.resolve({
      id: `memo-${date}`, date, content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })),
    deleteMemo: vi.fn().mockResolvedValue(undefined),

    // Notes
    fetchAllNotes: vi.fn().mockResolvedValue([]),
    fetchDeletedNotes: vi.fn().mockResolvedValue([]),
    createNote: vi.fn().mockImplementation((id, title) => Promise.resolve({
      id, title, content: '', isPinned: false, isDeleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })),
    updateNote: vi.fn().mockImplementation((id, updates) => Promise.resolve({
      id, title: '', content: '', isPinned: false, isDeleted: false, createdAt: '', updatedAt: new Date().toISOString(), ...updates,
    })),
    softDeleteNote: vi.fn().mockResolvedValue(undefined),
    restoreNote: vi.fn().mockResolvedValue(undefined),
    permanentDeleteNote: vi.fn().mockResolvedValue(undefined),
    searchNotes: vi.fn().mockResolvedValue([]),

    // Custom Sounds
    saveCustomSound: vi.fn().mockResolvedValue(undefined),
    loadCustomSound: vi.fn().mockResolvedValue(null),
    deleteCustomSound: vi.fn().mockResolvedValue(undefined),
    fetchCustomSoundMetas: vi.fn().mockResolvedValue([]),

    // AI
    fetchAIAdvice: vi.fn().mockResolvedValue({ advice: '', requestType: 'breakdown' }),
    fetchAISettings: vi.fn().mockResolvedValue({ apiKey: '', model: '', hasApiKey: false }),
    updateAISettings: vi.fn().mockResolvedValue({ apiKey: '', model: '', hasApiKey: false }),


    // Templates
    fetchTemplates: vi.fn().mockResolvedValue([]),
    createTemplate: vi.fn().mockImplementation((name, nodesJson) => Promise.resolve({ id: 1, name, nodesJson, createdAt: new Date().toISOString() })),
    getTemplate: vi.fn().mockResolvedValue(null),
    deleteTemplate: vi.fn().mockResolvedValue(undefined),

    // Data I/O
    exportData: vi.fn().mockResolvedValue(true),
    importData: vi.fn().mockResolvedValue(true),

    // Diagnostics
    fetchLogs: vi.fn().mockResolvedValue([]),
    openLogFolder: vi.fn().mockResolvedValue(undefined),
    exportLogs: vi.fn().mockResolvedValue(true),
    fetchMetrics: vi.fn().mockResolvedValue([]),
    resetMetrics: vi.fn().mockResolvedValue(true),
    fetchSystemInfo: vi.fn().mockResolvedValue({
      appVersion: '1.0.0', electronVersion: '35.0.0', nodeVersion: '22.0.0',
      platform: 'darwin', arch: 'arm64', dbSizeBytes: 0,
      memoryUsage: { heapUsed: 0, heapTotal: 0, rss: 0 }, tableCounts: {},
    }),

    // Updater
    checkForUpdates: vi.fn().mockResolvedValue(undefined),
    downloadUpdate: vi.fn().mockResolvedValue(undefined),
    installUpdate: vi.fn().mockResolvedValue(undefined),
  };
}
