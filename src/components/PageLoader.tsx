import React from 'react';
import { Loader2, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PageLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'minimal';
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function PageLoader({ 
  message = "Loading...", 
  size = 'md',
  variant = 'default',
  showProgress = false,
  progress = 0,
  className = "" 
}: PageLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const getIcon = () => {
    if (progress === 100) return <CheckCircle className={`${sizeClasses[size]} text-green-500`} />;
    if (showProgress) return <RefreshCw className={`${sizeClasses[size]} animate-spin text-primary`} />;
    return <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />;
  };

  const getMessage = () => {
    if (progress === 100) return "Complete!";
    if (showProgress && progress > 0) return `${message} (${progress}%)`;
    return message;
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {getIcon()}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          {getIcon()}
          {message && (
            <p className="text-sm text-muted-foreground text-center">
              {getMessage()}
            </p>
          )}
          {showProgress && progress > 0 && progress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-4 ${className}`}>
      <div className="flex items-center justify-center">
        {getIcon()}
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse text-center">
          {getMessage()}
        </p>
      )}
      {showProgress && progress > 0 && progress < 100 && (
        <div className="w-48 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Default export for backward compatibility
export default PageLoader;
