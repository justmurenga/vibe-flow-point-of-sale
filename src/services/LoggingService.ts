import { supabase } from '@/integrations/supabase/client';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum LogCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  USER_ACTIVITY = 'USER_ACTIVITY',
  SYSTEM = 'SYSTEM',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC'
}

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  method?: string;
  duration?: number;
  error?: any;
}

export class LoggingService {
  private static instance: LoggingService;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  constructor() {
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: Record<string, any> = {},
    userId?: string,
    tenantId?: string
  ): void {
    const logEntry: LogEntry = {
      level,
      category,
      message,
      context,
      userId,
      tenantId,
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      method: 'GET' // Could be enhanced to track actual HTTP method
    };

    // Add to local storage
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging
    this.consoleLog(logEntry);

    // Send to external service if critical
    if (level === LogLevel.CRITICAL || level === LogLevel.ERROR) {
      this.sendToExternalService(logEntry);
    }
  }

  private consoleLog(logEntry: LogEntry): void {
    const prefix = `[${logEntry.category}]`;
    const contextStr = Object.keys(logEntry.context).length > 0 
      ? ` | Context: ${JSON.stringify(logEntry.context)}`
      : '';

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${logEntry.message}${contextStr}`);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${logEntry.message}${contextStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${logEntry.message}${contextStr}`);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${logEntry.message}${contextStr}`);
        break;
      case LogLevel.CRITICAL:
        console.error(`�� CRITICAL: ${prefix} ${logEntry.message}${contextStr}`);
        break;
    }
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    try {
      await supabase.from('system_logs').insert({
        level: logEntry.level,
        category: logEntry.category,
        message: logEntry.message,
        context: logEntry.context,
        user_id: logEntry.userId,
        tenant_id: logEntry.tenantId,
        session_id: logEntry.sessionId,
        request_id: logEntry.requestId,
        user_agent: logEntry.userAgent,
        url: logEntry.url,
        method: logEntry.method,
        created_at: logEntry.timestamp
      });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    const logsToFlush = this.logs.splice(0, this.batchSize);
    
    try {
      await supabase.from('system_logs').insert(
        logsToFlush.map(log => ({
          level: log.level,
          category: log.category,
          message: log.message,
          context: log.context,
          user_id: log.userId,
          tenant_id: log.tenantId,
          session_id: log.sessionId,
          request_id: log.requestId,
          user_agent: log.userAgent,
          url: log.url,
          method: log.method,
          created_at: log.timestamp
        }))
      );
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put logs back if flush failed
      this.logs.unshift(...logsToFlush);
    }
  }

  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  private getRequestId(): string {
    return crypto.randomUUID();
  }

  // Convenience methods
  debug(category: LogCategory, message: string, context?: Record<string, any>, userId?: string, tenantId?: string): void {
    this.log(LogLevel.DEBUG, category, message, context || {}, userId, tenantId);
  }

  info(category: LogCategory, message: string, context?: Record<string, any>, userId?: string, tenantId?: string): void {
    this.log(LogLevel.INFO, category, message, context || {}, userId, tenantId);
  }

  warn(category: LogCategory, message: string, context?: Record<string, any>, userId?: string, tenantId?: string): void {
    this.log(LogLevel.WARN, category, message, context || {}, userId, tenantId);
  }

  error(category: LogCategory, message: string, context?: Record<string, any>, userId?: string, tenantId?: string): void {
    this.log(LogLevel.ERROR, category, message, context || {}, userId, tenantId);
  }

  critical(category: LogCategory, message: string, context?: Record<string, any>, userId?: string, tenantId?: string): void {
    this.log(LogLevel.CRITICAL, category, message, context || {}, userId, tenantId);
  }

  // Performance logging
  time(category: LogCategory, operation: string, userId?: string, tenantId?: string): () => void {
    const startTime = performance.now();
    const requestId = this.getRequestId();
    
    this.info(category, `${operation} started`, { operation, requestId }, userId, tenantId);
    
    return () => {
      const duration = performance.now() - startTime;
      this.info(category, `${operation} completed`, { 
        operation, 
        requestId, 
        duration: Math.round(duration) 
      }, userId, tenantId);
    };
  }

  // Cleanup
  destroy(): void {
    this.stopFlushTimer();
    this.flushLogs();
  }
}
