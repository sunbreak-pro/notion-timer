import { useState, useEffect } from 'react';
import { Sparkles, Eye, EyeOff, Save, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { getDataService } from '../../services';

export function AISettings() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash-lite');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getDataService().fetchAISettings()
      .then((settings) => {
        setMaskedKey(settings.apiKey);
        setModel(settings.model);
        setHasApiKey(settings.hasApiKey);
      })
      .catch(() => {
        // Backend not available — ignore
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const settings = await getDataService().updateAISettings({ apiKey, model });
      setMaskedKey(settings.apiKey);
      setHasApiKey(settings.hasApiKey);
      setApiKey('');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setErrorMessage('保存に失敗しました。バックエンドが起動しているか確認してください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-notion-accent" />
        <h3 className="text-lg font-semibold text-notion-text">AI Coach</h3>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-notion-text">
          Gemini API Key
        </label>
        {hasApiKey && !apiKey && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check size={12} />
            設定済み: {maskedKey}
          </p>
        )}
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? '新しいキーを入力して上書き...' : 'APIキーを入力...'}
            className="w-full px-3 py-2 pr-10 text-sm rounded-md border border-notion-border bg-notion-bg text-notion-text placeholder:text-notion-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-notion-accent"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-notion-text-secondary hover:text-notion-text"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-notion-accent hover:underline"
        >
          Google AI Studio でAPIキーを取得
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-notion-text">Model</label>
        <p className="text-sm text-notion-text-secondary">{model}</p>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-notion-accent text-white hover:bg-notion-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={14} />
          {saving ? '保存中...' : '保存'}
        </button>
        {saveStatus === 'success' && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check size={14} />
            保存しました
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-notion-danger flex items-center gap-1">
            <AlertCircle size={14} />
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}
