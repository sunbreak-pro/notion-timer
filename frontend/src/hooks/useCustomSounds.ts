import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getAudioBlob, saveAudioBlob, deleteAudioBlob } from '../storage/customSoundStorage';
import type { CustomSoundMeta } from '../types/customSound';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/wave', 'audio/x-wav'];

async function validateAudioMagicBytes(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // MP3: ID3 tag or MPEG sync
  if (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) return true;
  if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) return true;
  // WAV: RIFF....WAVE
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
      && header[8] === 0x57 && header[9] === 0x41 && header[10] === 0x56 && header[11] === 0x45) return true;
  // OGG: OggS
  if (header[0] === 0x4F && header[1] === 0x67 && header[2] === 0x67 && header[3] === 0x53) return true;
  return false;
}

function loadMeta(): CustomSoundMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SOUNDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.warn('[CustomSounds] localStorage parse failed');
    return [];
  }
}

function saveMeta(items: CustomSoundMeta[]) {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_SOUNDS, JSON.stringify(items));
}

export function useCustomSounds() {
  const [customSounds, setCustomSounds] = useState<CustomSoundMeta[]>([]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const blobUrlsRef = useRef<Record<string, string>>({});

  // Load metadata + generate blob URLs on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const metas = loadMeta();
      if (cancelled) return;

      const urls: Record<string, string> = {};
      for (const meta of metas) {
        const blob = await getAudioBlob(meta.id);
        if (cancelled) break;
        if (blob) {
          urls[meta.id] = URL.createObjectURL(blob);
        }
      }

      if (cancelled) {
        Object.values(urls).forEach(URL.revokeObjectURL);
        return;
      }

      // Filter out metas whose blobs are missing
      const validMetas = metas.filter(m => urls[m.id]);
      if (validMetas.length !== metas.length) {
        saveMeta(validMetas);
      }

      blobUrlsRef.current = urls;
      setCustomSounds(validMetas);
      setBlobUrls(urls);
      setIsLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  const addSound = useCallback(async (file: File): Promise<{ error?: string }> => {
    if (file.size > MAX_FILE_SIZE) {
      return { error: `ファイルサイズが20MBを超えています (${(file.size / 1024 / 1024).toFixed(1)}MB)` };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: `非対応の形式です。MP3, WAV, OGG のみ対応しています。` };
    }
    if (!await validateAudioMagicBytes(file)) {
      return { error: `ファイルの内容が音声形式と一致しません。` };
    }

    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const label = file.name.replace(/\.[^.]+$/, '');
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    await saveAudioBlob(id, blob);
    const url = URL.createObjectURL(blob);

    const meta: CustomSoundMeta = {
      id,
      label,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: Date.now(),
    };

    setCustomSounds(prev => {
      const next = [...prev, meta];
      saveMeta(next);
      return next;
    });
    setBlobUrls(prev => {
      const next = { ...prev, [id]: url };
      blobUrlsRef.current = next;
      return next;
    });

    return {};
  }, []);

  const removeSound = useCallback(async (id: string) => {
    // Revoke blob URL
    const url = blobUrlsRef.current[id];
    if (url) URL.revokeObjectURL(url);

    // Delete from IndexedDB
    await deleteAudioBlob(id);

    setCustomSounds(prev => {
      const next = prev.filter(s => s.id !== id);
      saveMeta(next);
      return next;
    });
    setBlobUrls(prev => {
      const next = { ...prev };
      delete next[id];
      blobUrlsRef.current = next;
      return next;
    });
  }, []);

  return { customSounds, blobUrls, isLoading, addSound, removeSound };
}
