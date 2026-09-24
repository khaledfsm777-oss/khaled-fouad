import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

export interface ProgressState {
  isActive: boolean;
  progress: number; // 0 to 100
  title: string;
  subtitle?: string;
  stage?: string;
}

interface ProgressContextType {
  progressState: ProgressState;
  startProgress: (title: string, subtitle?: string) => void;
  updateProgress: (progress: number, subtitle?: string, stage?: string) => void;
  finishProgress: (subtitle?: string) => void;
  resetProgress: () => void;
}

const defaultState: ProgressState = {
  isActive: false,
  progress: 0,
  title: '',
  subtitle: '',
  stage: '',
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progressState, setProgressState] = useState<ProgressState>(defaultState);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback((title: string, subtitle: string = 'جارٍ معالجة البيانات...') => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    setProgressState({
      isActive: true,
      progress: 5,
      title,
      subtitle,
      stage: 'تهيئة الفهرس الرقمي...'
    });
  }, []);

  const updateProgress = useCallback((progress: number, subtitle?: string, stage?: string) => {
    setProgressState(prev => ({
      ...prev,
      isActive: true,
      progress: Math.min(100, Math.max(0, progress)),
      subtitle: subtitle !== undefined ? subtitle : prev.subtitle,
      stage: stage !== undefined ? stage : prev.stage,
    }));
  }, []);

  const finishProgress = useCallback((subtitle: string = 'اكتملت المعالجة بنجاح') => {
    setProgressState(prev => ({
      ...prev,
      isActive: true,
      progress: 100,
      subtitle,
      stage: 'تم استخراج كافة النتائج بدقة'
    }));

    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
    }

    finishTimeoutRef.current = setTimeout(() => {
      setProgressState(defaultState);
      finishTimeoutRef.current = null;
    }, 900);
  }, []);

  const resetProgress = useCallback(() => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    setProgressState(defaultState);
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        progressState,
        startProgress,
        updateProgress,
        finishProgress,
        resetProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export function useGlobalProgress(): ProgressContextType {
  const context = useContext(ProgressContext);
  if (!context) {
    // Return a safe fallback to prevent crashes if called outside provider
    return {
      progressState: defaultState,
      startProgress: () => {},
      updateProgress: () => {},
      finishProgress: () => {},
      resetProgress: () => {}
    };
  }
  return context;
}
