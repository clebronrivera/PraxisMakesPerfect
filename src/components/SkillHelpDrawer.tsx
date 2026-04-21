// src/components/SkillHelpDrawer.tsx
//
// Expandable help panel shown during By Skill Practice sessions.
// Slides in from the bottom of the screen when the user taps the "Help" button.
//
// Design intent:
//   - Users must scroll through lesson content to find what they need.
//   - This is NOT a quick-answer panel — it surfaces the full micro-lesson.
//   - The panel does not auto-scroll or highlight answers.
//   - Linked to the primary module for the current practiceSkillId.
//   - Users can navigate to related modules from within the drawer.
//   - Tracks section visibility and interactive exercise completion.
//
// Props:
//   skillId          — the skill currently being practiced
//   isOpen           — controlled open state
//   onClose          — close callback
//   userId           — for progress tracking
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, ChevronLeft } from 'lucide-react';
import {
  getAllModulesForSkill,
  MODULE_LOOKUP,
  type LearningModule,
} from '../data/learningModules';
import { useLearningPathProgress } from '../hooks/useLearningPathProgress';
import { useModuleVisitTracking } from '../hooks/useModuleVisitTracking';
import { useSectionObserver } from '../hooks/useSectionObserver';
import type { InteractiveResult } from '../hooks/useModuleVisitTracking';
import ModuleLessonViewer from './ModuleLessonViewer';

interface SkillHelpDrawerProps {
  skillId: string | null;
  skillLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  /** If provided, the drawer opens directly to this module instead of the primary module. */
  initialModuleId?: string | null;
}

export default function SkillHelpDrawer({
  skillId,
  skillLabel,
  isOpen,
  onClose,
  userId,
  initialModuleId,
}: SkillHelpDrawerProps) {
  const progress = useLearningPathProgress(userId);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const modules: LearningModule[] = skillId ? getAllModulesForSkill(skillId) : [];
  const primaryModule = modules[0] ?? null;
  const relatedModules = modules.slice(1);

  // When drawer opens, navigate to initialModuleId if provided, otherwise the primary module.
  useEffect(() => {
    if (isOpen) {
      const startId = initialModuleId ?? primaryModule?.id ?? null;
      if (startId) {
        setActiveModuleId(startId);
        progress.onOpenModule(startId);
      }
    }
  }, [isOpen, skillId, initialModuleId]);

  // Track time on active module change
  useEffect(() => {
    if (!activeModuleId) return;
    progress.onOpenModule(activeModuleId);
    return () => {
      progress.onCloseModule(activeModuleId);
    };
  }, [activeModuleId]);

  // Close tracking
  useEffect(() => {
    if (!isOpen && activeModuleId) {
      progress.onCloseModule(activeModuleId);
    }
  }, [isOpen]);

  const activeModule = activeModuleId ? MODULE_LOOKUP[activeModuleId] : null;

  // ── Module visit tracking ──────────────────────────────────────────────
  const visitTracking = useModuleVisitTracking(
    isOpen ? userId : null,
    isOpen ? activeModuleId : null,
    skillId,
    'skill_help_drawer'
  );

  // ── Completed interactives map ─────────────────────────────────────────
  const [completedInteractives, setCompletedInteractives] = useState<
    Record<number, { score: number; completed: boolean }>
  >({});

  // Reset when module changes
  useEffect(() => {
    setCompletedInteractives({});
  }, [activeModuleId]);

  const handleInteractiveComplete = useCallback((sectionIndex: number, result: InteractiveResult) => {
    visitTracking.reportInteractiveComplete(sectionIndex, result);
    setCompletedInteractives(prev => ({
      ...prev,
      [sectionIndex]: { score: result.score, completed: result.completed },
    }));
  }, [visitTracking]);

  // ── Section observer ───────────────────────────────────────────────────
  const sectionCount = activeModule?.sections.length ?? 0;

  const { sectionRefs, maxScrollDepth } = useSectionObserver({
    sectionCount,
    onVisible: useCallback((idx: number) => {
      const section = activeModule?.sections[idx];
      if (section) {
        visitTracking.reportSectionVisible(
          idx,
          section.type,
          section.type === 'interactive' ? section.interactiveType : undefined
        );
      }
    }, [activeModule, visitTracking]),
    onHidden: useCallback((idx: number) => {
      visitTracking.reportSectionHidden(idx);
    }, [visitTracking]),
    enabled: isOpen && !!activeModule,
  });

  useEffect(() => {
    visitTracking.reportScrollDepth(maxScrollDepth);
  }, [maxScrollDepth, visitTracking]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(6,13,26,0.6)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-[2rem] border-t border-white/10 bg-[rgba(10,22,40,0.9)] backdrop-blur-[14px]"
        style={{ boxShadow: '0 -12px 40px -8px rgba(0,0,0,0.6)' }}
      >

        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeModule && activeModuleId !== primaryModule?.id && (
              <button
                onClick={() => {
                  if (activeModuleId) progress.onCloseModule(activeModuleId);
                  setActiveModuleId(primaryModule?.id ?? null);
                  if (primaryModule) progress.onOpenModule(primaryModule.id);
                }}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <BookOpen className="h-4 w-4 shrink-0" style={{ color: 'var(--d1-peach)' }} />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {skillLabel ?? 'Skill Help'}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {modules.length} {modules.length === 1 ? 'lesson' : 'lessons'} available — scroll to find what you need
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {modules.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/8 px-5 py-2.5">
            {modules.map((m, i) => (
              <button
                key={m.id}
                onClick={() => {
                  if (activeModuleId) progress.onCloseModule(activeModuleId);
                  setActiveModuleId(m.id);
                  progress.onOpenModule(m.id);
                }}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] ${
                  activeModuleId === m.id
                    ? 'border-[color:var(--d1-peach)]/50 bg-[color:var(--d1-peach)]/15 text-white'
                    : 'border-white/8 bg-white/5 text-slate-400 hover:border-[color:var(--d1-peach)]/30 hover:text-white'
                }`}
              >
                {progress.isViewed(m.id) && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--d2-mint)' }}
                  />
                )}
                {i === 0 ? 'Primary' : `Extra ${i}`} · {m.id}
              </button>
            ))}
          </div>
        )}

        {!activeModule && (
          <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
            <div>
              <BookOpen className="mx-auto mb-3 h-8 w-8" style={{ color: 'var(--d1-peach)' }} />
              <p className="text-sm text-slate-400">No lesson content found for this skill.</p>
            </div>
          </div>
        )}

        {activeModule && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ModuleLessonViewer
              module={activeModule}
              isViewed={progress.isViewed(activeModule.id)}
              secondsSpent={progress.getSecondsSpent(activeModule.id)}
              onSetViewed={(v) => progress.setViewed(activeModule.id, v)}
              relatedModules={
                relatedModules
                  .filter(m => m.id !== activeModuleId)
                  .map(m => ({ id: m.id, title: m.title }))
              }
              onOpenRelated={(id) => {
                if (activeModuleId) progress.onCloseModule(activeModuleId);
                setActiveModuleId(id);
                progress.onOpenModule(id);
              }}
              onInteractiveComplete={handleInteractiveComplete}
              sectionRefs={sectionRefs}
              completedInteractives={completedInteractives}
              variant="atelier"
            />
            <div className="h-6" />
          </div>
        )}
      </div>
    </>
  );
}
