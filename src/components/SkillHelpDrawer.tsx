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
//
// Props:
//   skillId          — the skill currently being practiced
//   isOpen           — controlled open state
//   onClose          — close callback
//   userId           — for progress tracking
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { X, BookOpen, ChevronLeft } from 'lucide-react';
import {
  getAllModulesForSkill,
  MODULE_LOOKUP,
  type LearningModule,
} from '../data/learningModules';
import { useLearningPathProgress } from '../hooks/useLearningPathProgress';
import ModuleLessonViewer from './ModuleLessonViewer';

interface SkillHelpDrawerProps {
  skillId: string | null;
  skillLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function SkillHelpDrawer({
  skillId,
  skillLabel,
  isOpen,
  onClose,
  userId,
}: SkillHelpDrawerProps) {
  const progress = useLearningPathProgress(userId);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const modules: LearningModule[] = skillId ? getAllModulesForSkill(skillId) : [];
  const primaryModule = modules[0] ?? null;
  const relatedModules = modules.slice(1);

  // When drawer opens or skillId changes, reset to primary module
  useEffect(() => {
    if (isOpen && primaryModule) {
      setActiveModuleId(primaryModule.id);
      progress.onOpenModule(primaryModule.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, skillId]);

  // Track time on active module change
  useEffect(() => {
    if (!activeModuleId) return;
    progress.onOpenModule(activeModuleId);
    return () => {
      progress.onCloseModule(activeModuleId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleId]);

  // Close tracking
  useEffect(() => {
    if (!isOpen && activeModuleId) {
      progress.onCloseModule(activeModuleId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const activeModule = activeModuleId ? MODULE_LOOKUP[activeModuleId] : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — slides up from bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[85vh] bg-navy-900 border-t border-navy-700/60 rounded-t-3xl shadow-2xl">

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-navy-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-navy-700/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeModule && activeModuleId !== primaryModule?.id && (
              <button
                onClick={() => {
                  if (activeModuleId) progress.onCloseModule(activeModuleId);
                  setActiveModuleId(primaryModule?.id ?? null);
                  if (primaryModule) progress.onOpenModule(primaryModule.id);
                }}
                className="p-1 rounded-lg hover:bg-navy-700/50 transition-colors text-slate-400 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">
                {skillLabel ?? 'Skill Help'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {modules.length} {modules.length === 1 ? 'lesson' : 'lessons'} available — scroll to find what you need
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-navy-700/50 transition-colors text-slate-400 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Module tab pills (if multiple modules) */}
        {modules.length > 1 && (
          <div className="flex gap-2 px-5 py-2.5 overflow-x-auto shrink-0 border-b border-navy-700/30">
            {modules.map((m, i) => (
              <button
                key={m.id}
                onClick={() => {
                  if (activeModuleId) progress.onCloseModule(activeModuleId);
                  setActiveModuleId(m.id);
                  progress.onOpenModule(m.id);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                  activeModuleId === m.id
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                    : 'bg-navy-800/40 border-navy-700/30 text-slate-500 hover:text-slate-300'
                }`}
              >
                {progress.isViewed(m.id) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
                {i === 0 ? 'Primary' : `Extra ${i}`} · {m.id}
              </button>
            ))}
          </div>
        )}

        {/* No content state */}
        {!activeModule && (
          <div className="flex-1 flex items-center justify-center text-center px-6 py-12">
            <div>
              <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No lesson content found for this skill.</p>
            </div>
          </div>
        )}

        {/* Lesson content */}
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
            />
            {/* Bottom padding for iOS safe area */}
            <div className="h-6" />
          </div>
        )}
      </div>
    </>
  );
}
