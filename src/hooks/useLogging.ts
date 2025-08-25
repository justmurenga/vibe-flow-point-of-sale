import { useCallback } from 'react';
import { LoggingService, LogLevel, LogCategory } from '@/services/LoggingService';

export function useLogging() {
  const logger = LoggingService.getInstance();

  const log = useCallback((
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>
  ) => {
    logger.log(level, category, message, context || {});
  }, [logger]);

  const time = useCallback((
    category: LogCategory,
    operation: string
  ) => {
    return logger.time(category, operation);
  }, [logger]);

  return { log, time, logger };
}
