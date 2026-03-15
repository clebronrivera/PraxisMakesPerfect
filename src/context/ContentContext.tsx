import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import type { Question, Skill, Domain } from '../types/content';
import type { EngineConfig } from '../types/engine';

const PRAXIS_DOMAIN_MAP: Record<string, number> = {
  'Professional Practices': 1,
  'Student-Level Services': 2,
  'Systems-Level Services': 3,
  'Foundations': 4
};

const PRAXIS_DOMAIN_NAMES: Record<number, string> = {
  1: 'Professional Practices',
  2: 'Student-Level Services',
  3: 'Systems-Level Services',
  4: 'Foundations of School Psychology'
};

export interface ContentContextState {
  questions: Question[];
  skills: Skill[];
  domains: Domain[];
  config?: EngineConfig;
  isLoading: boolean;
  error: Error | null;
}

const ContentContext = createContext<ContentContextState | undefined>(undefined);

interface ContentProviderProps {
  children: ReactNode;
}

export function ContentProvider({ children }: ContentProviderProps) {
  const [state, setState] = useState<ContentContextState>({
    questions: [],
    skills: [],
    domains: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          supabase.from('questions').select('*'),
          supabase.from('skills').select('*')
        ]);
        
        let questionsData: Question[] = [];
        let skillsData: Skill[] = [];

        if (qRes.error && qRes.error.code !== 'PGRST116') {
           console.warn('Questions table not ready or empty in Supabase:', qRes.error);
        } else if (qRes.data) {
           questionsData = qRes.data as unknown as Question[];
        }

        if (sRes.error && sRes.error.code !== 'PGRST116') {
           console.warn('Skills table not ready or empty in Supabase:', sRes.error);
        } else if (sRes.data) {
           skillsData = sRes.data as unknown as Skill[];
        }

        const resolveDomainId = (q: any): number | null => {
          if (q.domain && typeof q.domain === 'number' && q.domain >= 1 && q.domain <= 4) {
             return q.domain;
          }
          if (q.domainName && PRAXIS_DOMAIN_MAP[q.domainName]) {
             return PRAXIS_DOMAIN_MAP[q.domainName];
          }
          return null;
        };

        const domainIds = [...new Set(
          questionsData.map(resolveDomainId).filter((id): id is number => id !== null)
        )].sort((a, b) => a - b);

        const domainsData: Domain[] = domainIds.map(id => ({
          id: String(id),
          name: PRAXIS_DOMAIN_NAMES[id] || `Domain ${id}`,
        }));

        setState(prev => ({
          ...prev,
          questions: questionsData,
          skills: skillsData,
          domains: domainsData,
          isLoading: false
        }));
      } catch (err) {
        console.error('Error fetching content:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to fetch content'),
          isLoading: false
        }));
      }
    };

    fetchContent();
  }, []);

  return (
    <ContentContext.Provider value={state}>
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
