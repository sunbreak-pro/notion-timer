export interface ElectronAPI {
  platform: string;
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  onMenuAction(callback: (action: string) => void): () => void;
  onUpdaterStatus(callback: (status: { event: string; data?: unknown }) => void): () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
