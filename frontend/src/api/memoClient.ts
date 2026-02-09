import type { MemoNode } from '../types/memo';

const API_BASE = '/api/memos';

interface MemoDTO {
  id: string;
  date: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function fromDTO(dto: MemoDTO): MemoNode {
  return {
    id: dto.id,
    date: dto.date,
    content: dto.content,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? new Date().toISOString(),
  };
}

export async function fetchAllMemos(): Promise<MemoNode[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch memos (${res.status})`);
  const dtos: MemoDTO[] = await res.json();
  return dtos.map(fromDTO);
}

export async function fetchMemoByDate(date: string): Promise<MemoNode | null> {
  const res = await fetch(`${API_BASE}/${date}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch memo (${res.status})`);
  return fromDTO(await res.json());
}

export async function upsertMemo(date: string, content: string): Promise<MemoNode> {
  const res = await fetch(`${API_BASE}/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to upsert memo (${res.status})`);
  return fromDTO(await res.json());
}

export async function deleteMemo(date: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${date}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete memo (${res.status})`);
}
