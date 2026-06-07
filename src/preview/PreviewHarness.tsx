// src/preview/PreviewHarness.tsx
//
// DEV-ONLY preview harness for auth-gated screens. Lets you render a real gated
// component with stub data — no login, no Supabase — so you can eyeball / screenshot
// the actual React (not a static mockup).
//
// Usage:  npm run dev   →   http://localhost:5173/?preview=modules
// Guarded by import.meta.env.DEV in main.tsx, so it is tree-shaken out of prod builds.
// Add new screens to the REGISTRY below.

import ReactDOM from 'react-dom/client';
import ModulesBrowser from '../components/ModulesBrowser';
import type { SkillPerformance } from '../brain/learning-state';
import type { UserProfile } from '../hooks/useProgressTracking';
import type { LearningPathProgressMap, LearningPathStatus } from '../hooks/useLearningPathSupabase';

// ── Stub data ────────────────────────────────────────────────────────────────
function perf(score: number, attempts: number, opts: Partial<SkillPerformance> = {}): SkillPerformance {
  const correct = Math.round(score * attempts);
  return {
    score,
    attempts,
    correct,
    consecutiveCorrect: 0,
    history: Array.from({ length: Math.min(5, attempts) }, (_, i) => i < correct),
    learningState: score >= 0.8 ? 'mastery' : score >= 0.6 ? 'proficient' : 'developing',
    weightedAccuracy: score,
    attemptHistory: Array.from({ length: attempts }, (_, i) => ({
      questionId: `stub-${i}`, correct: i < correct, confidence: 'medium' as const, timestamp: i, timeSpent: 30,
    })),
    ...opts,
  };
}

const stubSkillScores: Record<string, SkillPerformance> = {
  'CON-01': perf(0.68, 12),                                   // approaching
  'DBD-01': perf(0.42, 14, { recentHighConfidenceWrongCount: 2 }), // emerging + flagged
  'MBH-03': perf(0.51, 10),                                   // emerging
  'ACA-06': perf(0.9, 16),                                    // demonstrating (mastered)
  'LEG-01': perf(0.92, 13),                                   // demonstrating
  'SAF-03': perf(0.63, 9),                                    // approaching
};

const stubProfile = { skillScores: stubSkillScores } as unknown as UserProfile;

function lp(skillId: string, status: LearningPathStatus, lessonViewed = true): [string, LearningPathProgressMap[string]] {
  return [skillId, {
    skillId, lessonViewed, timeSpentSeconds: 120, lessonCompletedAt: null,
    questionsSubmitted: status !== 'not_started', questionsCorrect: 3, questionsTotal: 5,
    accuracy: 0.6, status,
  }];
}

const stubLpProgress: LearningPathProgressMap = Object.fromEntries([
  lp('ACA-06', 'mastered'),
  lp('LEG-01', 'demonstrating'),
  lp('CON-01', 'approaching'),
  lp('DBD-01', 'emerging'),
]);

// ── Registry ─────────────────────────────────────────────────────────────────
const REGISTRY: Record<string, () => React.ReactNode> = {
  modules: () => (
    <ModulesBrowser
      profile={stubProfile}
      lpProgress={stubLpProgress}
      onNodeClick={(skillId) => console.log('[preview] open module for skill', skillId)}
    />
  ),
};

function Harness({ componentKey }: { componentKey: string }) {
  const render = REGISTRY[componentKey];
  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f8' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#4f46e5', color: '#fff',
        font: "700 12px/1 Inter, system-ui", letterSpacing: '.08em', textTransform: 'uppercase',
        padding: '8px 20px',
      }}>
        DEV preview · {componentKey} · stub data · not the real app
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {render ? render() : (
          <p style={{ fontFamily: 'Inter, system-ui', color: '#334155' }}>
            Unknown preview "{componentKey}". Available: {Object.keys(REGISTRY).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

export function renderPreview(componentKey: string): void {
  ReactDOM.createRoot(document.getElementById('root')!).render(<Harness componentKey={componentKey} />);
}
