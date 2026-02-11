import type { DataService } from './DataService';
import { HttpDataService } from './HttpDataService';
import { ElectronDataService } from './ElectronDataService';

let instance: DataService | null = null;

export function getDataService(): DataService {
  if (instance) return instance;

  if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
    instance = new ElectronDataService();
  } else {
    instance = new HttpDataService();
  }

  return instance;
}
