import { createContext, useContext, ReactNode } from 'react';
import type { Question, Skill, Domain } from '../types/content';
import type { EngineConfig } from '../types/engine';

export interface ContentContextState {
  questions: Question[];
  skills: Skill[];
  domains: Domain[];
  config?: EngineConfig;
  isLoading: boolean;
  error: Error | null;
}

const EMPTY_STATE: ContentContextState = {
  questions: [],
  skills: [],
  domains: [],
  isLoading: false,
  error: null,
};

const ContentContext = createContext<ContentContextState | undefined>(undefined);

interface ContentProviderProps {
  children: ReactNode;
}

export function ContentProvider({ children }: ContentProviderProps) {
  return (
    <ContentContext.Provider value={EMPTY_STATE}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
