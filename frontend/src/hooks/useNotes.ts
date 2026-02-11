import { useState, useCallback, useEffect, useMemo } from 'react';
import type { NoteNode, NoteSortMode } from '../types/note';
import type { Tag } from '../types/tag';
import { getDataService } from '../services';

export function useNotes() {
  const [notes, setNotes] = useState<NoteNode[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<NoteNode[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<NoteSortMode>('updatedAt');
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [noteTagsMap, setNoteTagsMap] = useState<Map<string, Tag[]>>(new Map());

  // Load notes and tags on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, allNoteTags, allTags] = await Promise.all([
          getDataService().fetchAllNotes(),
          getDataService().fetchAllNoteTags(),
          getDataService().fetchAllTags(),
        ]);
        if (cancelled) return;
        setNotes(loaded);

        // Build note tags map
        const tagMap = new Map<number, Tag>();
        for (const t of allTags) tagMap.set(t.id, t);
        const ntMap = new Map<string, Tag[]>();
        for (const { note_id, tag_id } of allNoteTags) {
          const tag = tagMap.get(tag_id);
          if (tag) {
            const existing = ntMap.get(note_id) || [];
            existing.push(tag);
            ntMap.set(note_id, existing);
          }
        }
        setNoteTagsMap(ntMap);
      } catch (e) {
        console.warn('[Notes] fetch:', e instanceof Error ? e.message : e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sortedFilteredNotes = useMemo(() => {
    let result = notes;

    // Search filter (client-side)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (filterTagIds.length > 0) {
      result = result.filter(n => {
        const tags = noteTagsMap.get(n.id) || [];
        return filterTagIds.some(tid => tags.some(t => t.id === tid));
      });
    }

    // Sort: pinned first, then by sort mode
    return [...result].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      switch (sortMode) {
        case 'updatedAt':
          return b.updatedAt.localeCompare(a.updatedAt);
        case 'createdAt':
          return b.createdAt.localeCompare(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [notes, searchQuery, sortMode, filterTagIds, noteTagsMap]);

  const createNote = useCallback((title?: string) => {
    const id = `note-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newNote: NoteNode = {
      id,
      title: title || 'Untitled',
      content: '',
      isPinned: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(id);
    getDataService().createNote(id, newNote.title).catch(e => console.warn('[Notes] create:', e.message));
    return id;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Pick<NoteNode, 'title' | 'content' | 'isPinned'>>) => {
    const now = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: now } : n));
    getDataService().updateNote(id, updates).catch(e => console.warn('[Notes] update:', e.message));
  }, []);

  const softDeleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
    getDataService().softDeleteNote(id).catch(e => console.warn('[Notes] delete:', e.message));
  }, [selectedNoteId]);

  const togglePin = useCallback((id: string) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id);
      if (!note) return prev;
      const newPinned = !note.isPinned;
      getDataService().updateNote(id, { isPinned: newPinned }).catch(e => console.warn('[Notes] pin:', e.message));
      return prev.map(n => n.id === id ? { ...n, isPinned: newPinned, updatedAt: new Date().toISOString() } : n);
    });
  }, []);

  const loadDeletedNotes = useCallback(async () => {
    try {
      const deleted = await getDataService().fetchDeletedNotes();
      setDeletedNotes(deleted);
    } catch (e) {
      console.warn('[Notes] fetchDeleted:', e instanceof Error ? e.message : e);
    }
  }, []);

  const restoreNote = useCallback((id: string) => {
    const note = deletedNotes.find(n => n.id === id);
    if (note) {
      setDeletedNotes(prev => prev.filter(n => n.id !== id));
      setNotes(prev => [{ ...note, isDeleted: false, deletedAt: undefined }, ...prev]);
    }
    getDataService().restoreNote(id).catch(e => console.warn('[Notes] restore:', e.message));
  }, [deletedNotes]);

  const permanentDeleteNote = useCallback((id: string) => {
    setDeletedNotes(prev => prev.filter(n => n.id !== id));
    getDataService().permanentDeleteNote(id).catch(e => console.warn('[Notes] permanentDelete:', e.message));
  }, []);

  const getTagsForNote = useCallback((noteId: string): Tag[] => {
    return noteTagsMap.get(noteId) || [];
  }, [noteTagsMap]);

  const setTagsForNote = useCallback((noteId: string, tagIds: number[], allTags: Tag[]) => {
    const tags = tagIds.map(id => allTags.find(t => t.id === id)).filter((t): t is Tag => !!t);
    setNoteTagsMap(prev => {
      const next = new Map(prev);
      next.set(noteId, tags);
      return next;
    });
    getDataService().setTagsForNote(noteId, tagIds).catch(e => console.warn('[Notes] setTags:', e.message));
  }, []);

  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) ?? null;
  }, [notes, selectedNoteId]);

  return {
    notes,
    deletedNotes,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    filterTagIds,
    setFilterTagIds,
    sortedFilteredNotes,
    createNote,
    updateNote,
    softDeleteNote,
    togglePin,
    loadDeletedNotes,
    restoreNote,
    permanentDeleteNote,
    getTagsForNote,
    setTagsForNote,
  };
}
