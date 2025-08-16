'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import logger, { logPageView, logUserAction } from '@/utils/logger';

interface LoggerContextType {
  logUserAction: (action: string, data?: any) => void;
  logPageView: (page: string, data?: any) => void;
  downloadLogs: () => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

interface LoggerProviderProps {
  children: ReactNode;
}

export function LoggerProvider({ children }: LoggerProviderProps) {
  const pathname = usePathname();

  // 页面访问日志
  useEffect(() => {
    if (typeof window !== 'undefined') {
      logPageView(pathname, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
    }
  }, [pathname]);

  // 监听页面可见性变化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          logUserAction('page_hidden', { page: pathname });
        } else {
          logUserAction('page_visible', { page: pathname });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [pathname]);

  // 监听页面卸载
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleBeforeUnload = () => {
        logUserAction('page_unload', { page: pathname });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [pathname]);

  const contextValue: LoggerContextType = {
    logUserAction,
    logPageView,
    downloadLogs: () => logger.downloadLogs()
  };

  return (
    <LoggerContext.Provider value={contextValue}>
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger() {
  const context = useContext(LoggerContext);
  if (context === undefined) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
}

// HOC for automatic action logging
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function LoggedComponent(props: P) {
    useEffect(() => {
      logUserAction('component_mount', { component: componentName });
      
      return () => {
        logUserAction('component_unmount', { component: componentName });
      };
    }, []);

    return <Component {...props} />;
  };
}