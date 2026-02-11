import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { getDataService } from '../../services';

export function DataManagement() {
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const success = await getDataService().exportData();
      setStatus(success ? 'Data exported successfully.' : null);
    } catch (e) {
      setStatus(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleImport = async () => {
    try {
      const success = await getDataService().importData();
      if (success) {
        setStatus('Data imported. Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e) {
      setStatus(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-notion-text mb-3">Data Management</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-notion-hover text-notion-text hover:bg-notion-border transition-colors"
          >
            <Download size={16} />
            Export Data
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-notion-hover text-notion-text hover:bg-notion-border transition-colors"
          >
            <Upload size={16} />
            Import Data
          </button>
        </div>

        <p className="text-xs text-notion-text-secondary">
          Import will overwrite all current data. A backup is created automatically before importing.
        </p>

        {status && (
          <p className={`text-sm ${status.includes('failed') ? 'text-notion-danger' : 'text-notion-success'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
