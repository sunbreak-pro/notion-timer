import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { CustomSoundMeta } from '../types';

const CUSTOM_SOUNDS_DIR = path.join(app.getPath('userData'), 'custom-sounds');
const META_FILE = path.join(CUSTOM_SOUNDS_DIR, '_meta.json');

function ensureDir(): void {
  if (!fs.existsSync(CUSTOM_SOUNDS_DIR)) {
    fs.mkdirSync(CUSTOM_SOUNDS_DIR, { recursive: true });
  }
}

function loadMetas(): CustomSoundMeta[] {
  ensureDir();
  if (!fs.existsSync(META_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeMetas(metas: CustomSoundMeta[]): void {
  ensureDir();
  fs.writeFileSync(META_FILE, JSON.stringify(metas, null, 2), 'utf-8');
}

export function createCustomSoundRepository() {
  return {
    fetchAllMetas(): CustomSoundMeta[] {
      return loadMetas();
    },

    saveMeta(meta: CustomSoundMeta): void {
      const metas = loadMetas();
      const idx = metas.findIndex(m => m.id === meta.id);
      if (idx >= 0) {
        metas[idx] = meta;
      } else {
        metas.push(meta);
      }
      writeMetas(metas);
    },

    deleteMeta(id: string): void {
      const metas = loadMetas().filter(m => m.id !== id);
      writeMetas(metas);
    },

    saveBlob(id: string, data: Buffer): void {
      ensureDir();
      fs.writeFileSync(path.join(CUSTOM_SOUNDS_DIR, id), data);
    },

    loadBlob(id: string): Buffer | null {
      const filePath = path.join(CUSTOM_SOUNDS_DIR, id);
      if (!fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath);
    },

    deleteBlob(id: string): void {
      const filePath = path.join(CUSTOM_SOUNDS_DIR, id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    },
  };
}

export type CustomSoundRepository = ReturnType<typeof createCustomSoundRepository>;
