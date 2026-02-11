import { useState, useCallback, useEffect } from 'react';
import type { TaskTemplate } from '../types/template';
import { getDataService } from '../services';

export function useTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getDataService().fetchTemplates();
        if (!cancelled) setTemplates(loaded);
      } catch (e) {
        console.warn('[Templates] fetch:', e instanceof Error ? e.message : e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const createTemplate = useCallback(async (name: string, nodesJson: string): Promise<TaskTemplate> => {
    const template = await getDataService().createTemplate(name, nodesJson);
    setTemplates(prev => [template, ...prev]);
    return template;
  }, []);

  const deleteTemplate = useCallback(async (id: number) => {
    await getDataService().deleteTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    templates,
    createTemplate,
    deleteTemplate,
  };
}
