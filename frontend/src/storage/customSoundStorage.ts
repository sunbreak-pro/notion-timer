import { createStore, get, set, del } from 'idb-keyval';

const store = createStore('sonic-flow-custom-sounds', 'audio-blobs');

export function getAudioBlob(id: string): Promise<Blob | undefined> {
  return get<Blob>(id, store);
}

export function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  return set(id, blob, store);
}

export function deleteAudioBlob(id: string): Promise<void> {
  return del(id, store);
}
