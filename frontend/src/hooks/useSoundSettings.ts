import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import type { SoundSettings, SoundPreset, SoundSettingsMap } from '../types/sound';
import { soundApi } from '../api/soundSettings';

export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings[]>([]);
  const [presets, setPresets] = useState<SoundPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, presetsData] = await Promise.all([
        soundApi.getAllSettings(),
        soundApi.getAllPresets(),
      ]);
      setSettings(settingsData);
      setPresets(presetsData);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
      } else {
        setError('サウンド設定の取得に失敗しました');
      }
      console.error('Failed to fetch sound settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSoundSettings = useCallback(
    async (soundType: string, updates: { volume?: number; enabled?: boolean }) => {
      try {
        setError(null);
        const updatedSettings = await soundApi.updateSettings(soundType, updates);
        setSettings((prev) => {
          const existing = prev.find((s) => s.soundType === soundType);
          if (existing) {
            return prev.map((s) => (s.soundType === soundType ? updatedSettings : s));
          }
          return [...prev, updatedSettings];
        });
        return updatedSettings;
      } catch (err) {
        setError('サウンド設定の更新に失敗しました');
        console.error('Failed to update sound settings:', err);
        throw err;
      }
    },
    []
  );

  const createPreset = useCallback(async (name: string) => {
    try {
      setError(null);
      const settingsMap: SoundSettingsMap = {};
      settings.forEach((s) => {
        settingsMap[s.soundType] = { volume: s.volume, enabled: s.enabled };
      });
      const newPreset = await soundApi.createPreset(name, JSON.stringify(settingsMap));
      setPresets((prev) => [newPreset, ...prev]);
      return newPreset;
    } catch (err) {
      setError('プリセットの作成に失敗しました');
      console.error('Failed to create preset:', err);
      throw err;
    }
  }, [settings]);

  const deletePreset = useCallback(async (id: number) => {
    try {
      setError(null);
      await soundApi.deletePreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('プリセットの削除に失敗しました');
      console.error('Failed to delete preset:', err);
      throw err;
    }
  }, []);

  const applyPreset = useCallback(
    async (preset: SoundPreset) => {
      try {
        setError(null);
        const settingsMap: SoundSettingsMap = JSON.parse(preset.settingsJson);
        const updatePromises = Object.entries(settingsMap).map(([soundType, { volume, enabled }]) =>
          soundApi.updateSettings(soundType, { volume, enabled })
        );
        const updatedSettings = await Promise.all(updatePromises);
        setSettings(updatedSettings);
      } catch (err) {
        setError('プリセットの適用に失敗しました');
        console.error('Failed to apply preset:', err);
        throw err;
      }
    },
    []
  );

  const getSettingsMap = useCallback((): SoundSettingsMap => {
    const map: SoundSettingsMap = {};
    settings.forEach((s) => {
      map[s.soundType] = { volume: s.volume, enabled: s.enabled };
    });
    return map;
  }, [settings]);

  return {
    settings,
    presets,
    loading,
    error,
    updateSoundSettings,
    createPreset,
    deletePreset,
    applyPreset,
    getSettingsMap,
    refetch: fetchSettings,
  };
}
