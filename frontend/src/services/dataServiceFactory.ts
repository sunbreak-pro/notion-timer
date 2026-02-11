import type { DataService } from './DataService';
import { ElectronDataService } from './ElectronDataService';

let instance: DataService | null = null;

export function getDataService(): DataService {
  if (!instance) instance = new ElectronDataService();
  return instance;
}
