import { useState, useCallback, useEffect, useRef } from 'react';
import type { Tag } from '../types/tag';
import { getDataService } from '../services';

export function useTags(type: 'task' | 'note') {
  const [tags, setTags] = useState<Tag[]>([]);
  const entityTagsCache = useRef<Map<string, Tag[]>>(new Map());
  const [entityTagsVersion, setEntityTagsVersion] = useState(0);
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = type === 'task'
          ? await getDataService().fetchAllTaskTags()
          : await getDataService().fetchAllNoteTags();
        if (!cancelled) setTags(loaded);
      } catch (e) {
        console.warn(`[Tags:${type}] fetch:`, e instanceof Error ? e.message : e);
      }
    })();
    return () => { cancelled = true; };
  }, [type]);

  const createTag = useCallback(async (name: string, color: string): Promise<Tag> => {
    const tag = type === 'task'
      ? await getDataService().createTaskTag(name, color)
      : await getDataService().createNoteTag(name, color);
    setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
    return tag;
  }, [type]);

  const updateTag = useCallback(async (id: number, updates: { name?: string; color?: string }) => {
    const updated = type === 'task'
      ? await getDataService().updateTaskTag(id, updates)
      : await getDataService().updateNoteTag(id, updates);
    setTags(prev => prev.map(t => t.id === id ? updated : t));
    entityTagsCache.current.forEach((cachedTags, entityId) => {
      if (cachedTags.some(t => t.id === id)) {
        entityTagsCache.current.set(entityId, cachedTags.map(t => t.id === id ? updated : t));
      }
    });
    setEntityTagsVersion(v => v + 1);
  }, [type]);

  const deleteTag = useCallback(async (id: number) => {
    if (type === 'task') {
      await getDataService().deleteTaskTag(id);
    } else {
      await getDataService().deleteNoteTag(id);
    }
    setTags(prev => prev.filter(t => t.id !== id));
    setFilterTagIds(prev => prev.filter(tid => tid !== id));
    entityTagsCache.current.forEach((cachedTags, entityId) => {
      const filtered = cachedTags.filter(t => t.id !== id);
      if (filtered.length !== cachedTags.length) {
        entityTagsCache.current.set(entityId, filtered);
      }
    });
    setEntityTagsVersion(v => v + 1);
  }, [type]);

  const getTagsForEntity = useCallback((entityId: string): Tag[] => {
    return entityTagsCache.current.get(entityId) ?? [];
  }, []);

  const loadTagsForEntity = useCallback(async (entityId: string): Promise<Tag[]> => {
    try {
      const entityTags = type === 'task'
        ? await getDataService().fetchTagsForTask(entityId)
        : await getDataService().fetchTagsForNote(entityId);
      entityTagsCache.current.set(entityId, entityTags);
      setEntityTagsVersion(v => v + 1);
      return entityTags;
    } catch (e) {
      console.warn(`[Tags:${type}] fetchForEntity:`, e instanceof Error ? e.message : e);
      return [];
    }
  }, [type]);

  const setTagsForEntity = useCallback(async (entityId: string, tagIds: number[]) => {
    const newTags = tags.filter(t => tagIds.includes(t.id));
    entityTagsCache.current.set(entityId, newTags);
    setEntityTagsVersion(v => v + 1);
    try {
      if (type === 'task') {
        await getDataService().setTagsForTask(entityId, tagIds);
      } else {
        await getDataService().setTagsForNote(entityId, tagIds);
      }
    } catch (e) {
      console.warn(`[Tags:${type}] setForEntity:`, e instanceof Error ? e.message : e);
    }
  }, [tags, type]);

  const toggleFilterTag = useCallback((tagId: number) => {
    setFilterTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const clearFilter = useCallback(() => {
    setFilterTagIds([]);
  }, []);

  const hasTagFilter = filterTagIds.length > 0;

  const taskPassesFilter = useCallback((taskId: string): boolean => {
    if (filterTagIds.length === 0) return true;
    const taskTags = entityTagsCache.current.get(taskId) ?? [];
    return filterTagIds.some(fid => taskTags.some(t => t.id === fid));
  }, [filterTagIds]);

  return {
    tags,
    filterTagIds,
    hasTagFilter,
    entityTagsVersion,
    createTag,
    updateTag,
    deleteTag,
    getTagsForEntity,
    loadTagsForEntity,
    setTagsForEntity,
    toggleFilterTag,
    clearFilter,
    taskPassesFilter,
  };
}
