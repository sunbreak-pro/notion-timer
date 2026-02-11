import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, RotateCcw } from 'lucide-react';
import { getDataService } from '../../services';
import type { UpdaterStatus } from '../../types/updater';

export function UpdateSettings() {
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const cleanup = window.electronAPI?.onUpdaterStatus?.((s: UpdaterStatus) => {
      setStatus(s);
      if (s.event !== 'checking') setChecking(false);
    });
    return () => { cleanup?.(); };
  }, []);

  const handleCheck = useCallback(async () => {
    setChecking(true);
    try {
      await getDataService().checkForUpdates();
    } catch {
      setChecking(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    await getDataService().downloadUpdate();
  }, []);

  const handleInstall = useCallback(async () => {
    await getDataService().installUpdate();
  }, []);

  const statusText = () => {
    if (!status) return null;
    switch (status.event) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `Update v${status.data?.version} is available.`;
      case 'not-available':
        return 'You are running the latest version.';
      case 'downloading':
        return `Downloading... ${status.data?.percent ?? 0}%`;
      case 'downloaded':
        return `v${status.data?.version} downloaded. Restart to apply.`;
      case 'error':
        return `Update error: ${status.data?.message ?? 'Unknown'}`;
      default:
        return null;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-notion-text mb-3">Updates</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-notion-hover text-notion-text hover:bg-notion-border transition-colors"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            Check for Updates
          </button>

          {status?.event === 'available' && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-notion-primary text-white hover:opacity-90 transition-opacity"
            >
              <Download size={16} />
              Download
            </button>
          )}

          {status?.event === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-notion-primary text-white hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={16} />
              Restart to Update
            </button>
          )}
        </div>

        {/* Progress bar */}
        {status?.event === 'downloading' && (
          <div className="w-full bg-notion-hover rounded-full h-2">
            <div
              className="bg-notion-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.data?.percent ?? 0}%` }}
            />
          </div>
        )}

        {statusText() && (
          <p className={`text-sm ${status?.event === 'error' ? 'text-notion-danger' : 'text-notion-text-secondary'}`}>
            {statusText()}
          </p>
        )}
      </div>
    </div>
  );
}
