import { useState, useCallback, useEffect, useRef } from 'react';
import type { Tag } from '../types/tag';
import { getDataService } from '../services';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const taskTagsCache = useRef<Map<string, Tag[]>>(new Map());
  const [taskTagsVersion, setTaskTagsVersion] = useState(0);
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);

  // Load all tags on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getDataService().fetchAllTags();
        if (!cancelled) setTags(loaded);
      } catch (e) {
        console.warn('[Tags] fetch:', e instanceof Error ? e.message : e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const createTag = useCallback(async (name: string, color: string): Promise<Tag> => {
    const tag = await getDataService().createTag(name, color);
    setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
    return tag;
  }, []);

  const updateTag = useCallback(async (id: number, updates: { name?: string; color?: string }) => {
    const updated = await getDataService().updateTag(id, updates);
    setTags(prev => prev.map(t => t.id === id ? updated : t));
    // Invalidate task tags cache entries that had this tag
    taskTagsCache.current.forEach((cachedTags, taskId) => {
      if (cachedTags.some(t => t.id === id)) {
        taskTagsCache.current.set(taskId, cachedTags.map(t => t.id === id ? updated : t));
      }
    });
    setTaskTagsVersion(v => v + 1);
  }, []);

  const deleteTag = useCallback(async (id: number) => {
    await getDataService().deleteTag(id);
    setTags(prev => prev.filter(t => t.id !== id));
    setFilterTagIds(prev => prev.filter(tid => tid !== id));
    // Remove from cache
    taskTagsCache.current.forEach((cachedTags, taskId) => {
      const filtered = cachedTags.filter(t => t.id !== id);
      if (filtered.length !== cachedTags.length) {
        taskTagsCache.current.set(taskId, filtered);
      }
    });
    setTaskTagsVersion(v => v + 1);
  }, []);

  const getTagsForTask = useCallback((taskId: string): Tag[] => {
    return taskTagsCache.current.get(taskId) ?? [];
  }, []);

  const loadTagsForTask = useCallback(async (taskId: string): Promise<Tag[]> => {
    try {
      const taskTags = await getDataService().fetchTagsForTask(taskId);
      taskTagsCache.current.set(taskId, taskTags);
      setTaskTagsVersion(v => v + 1);
      return taskTags;
    } catch (e) {
      console.warn('[Tags] fetchForTask:', e instanceof Error ? e.message : e);
      return [];
    }
  }, []);

  const setTagsForTask = useCallback(async (taskId: string, tagIds: number[]) => {
    // Optimistic update
    const newTags = tags.filter(t => tagIds.includes(t.id));
    taskTagsCache.current.set(taskId, newTags);
    setTaskTagsVersion(v => v + 1);
    try {
      await getDataService().setTagsForTask(taskId, tagIds);
    } catch (e) {
      console.warn('[Tags] setForTask:', e instanceof Error ? e.message : e);
    }
  }, [tags]);

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
    const taskTags = taskTagsCache.current.get(taskId) ?? [];
    return filterTagIds.some(fid => taskTags.some(t => t.id === fid));
  }, [filterTagIds]);

  return {
    tags,
    filterTagIds,
    hasTagFilter,
    taskTagsVersion,
    createTag,
    updateTag,
    deleteTag,
    getTagsForTask,
    loadTagsForTask,
    setTagsForTask,
    toggleFilterTag,
    clearFilter,
    taskPassesFilter,
  };
}
