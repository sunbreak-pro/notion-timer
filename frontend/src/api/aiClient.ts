import type { AIAdviceRequest, AIAdviceResponse, AISettingsResponse } from '../types/ai';

const API_BASE = '/api/ai';

export async function fetchAIAdvice(request: AIAdviceRequest): Promise<AIAdviceResponse> {
  const res = await fetch(`${API_BASE}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', errorCode: 'UNKNOWN' }));
    const err = new Error(error.error ?? `AI request failed (${res.status})`);
    (err as Error & { errorCode?: string }).errorCode = error.errorCode;
    throw err;
  }

  return res.json();
}

export async function fetchAISettings(): Promise<AISettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`);

  if (!res.ok) {
    throw new Error('Failed to fetch AI settings');
  }

  return res.json();
}

export async function updateAISettings(
  settings: { apiKey?: string; model?: string },
): Promise<AISettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    throw new Error('Failed to update AI settings');
  }

  return res.json();
}
