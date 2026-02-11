import { useState, useCallback } from 'react';
import { getDataService } from '../services';
import type { AIRequestType, AIAdviceResponse } from '../types/ai';

interface UseAICoachReturn {
  advice: AIAdviceResponse | null;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  requestAdvice: (taskTitle: string, taskContent: string | undefined, requestType: AIRequestType) => Promise<void>;
  clearAdvice: () => void;
}

export function useAICoach(): UseAICoachReturn {
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const requestAdvice = useCallback(async (
    taskTitle: string,
    taskContent: string | undefined,
    requestType: AIRequestType,
  ) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const response = await getDataService().fetchAIAdvice({
        taskTitle,
        taskContent: taskContent ?? '',
        requestType,
      });
      setAdvice(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed');
      setErrorCode((e as Error & { errorCode?: string }).errorCode ?? null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAdvice = useCallback(() => {
    setAdvice(null);
    setError(null);
    setErrorCode(null);
  }, []);

  return { advice, isLoading, error, errorCode, requestAdvice, clearAdvice };
}
