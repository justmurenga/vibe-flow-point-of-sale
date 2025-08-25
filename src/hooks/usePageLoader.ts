import { useState, useCallback } from 'react';

interface UsePageLoaderOptions {
  initialMessage?: string;
  showProgress?: boolean;
}

export function usePageLoader(options: UsePageLoaderOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(options.initialMessage || "Loading...");
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(options.showProgress || false);

  const startLoading = useCallback((msg?: string) => {
    setIsLoading(true);
    setProgress(0);
    if (msg) setMessage(msg);
  }, []);

  const updateProgress = useCallback((newProgress: number, msg?: string) => {
    setProgress(newProgress);
    if (msg) setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
  }, []);

  const withLoader = useCallback(async <T>(
    promise: Promise<T>,
    loadingMessage?: string
  ): Promise<T> => {
    startLoading(loadingMessage);
    try {
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    message,
    progress,
    showProgress,
    startLoading,
    updateProgress,
    stopLoading,
    withLoader
  };
}
