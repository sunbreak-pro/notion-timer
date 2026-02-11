export type UpdaterEventType =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdaterStatus {
  event: UpdaterEventType;
  data?: {
    version?: string;
    releaseDate?: string;
    percent?: number;
    bytesPerSecond?: number;
    transferred?: number;
    total?: number;
    message?: string;
  };
}
