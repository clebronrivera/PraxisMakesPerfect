// src/components/StudyCenterSidebar.tsx
//
// Right-side panel with two tabs:
//   1. My Notes — per-module user-typed notes (Supabase-backed)
//   2. Focus Items — system-generated vocabulary/misconceptions/traps from study plan
//
// Desktop (lg+): inline sidebar, w-80.
// Mobile/tablet: fixed overlay panel, slides from right.

import { useState } from 'react';
import { X, StickyNote, Target, Save, Loader2 } from 'lucide-react';
import { useModuleNotes } from '../hooks/useModuleNotes';

type TabId = 'notes' | 'focus';

interface StudyCenterSidebarProps {
  userId: string | null;
  moduleId: string | null;
  moduleTitle: string | null;
  skillId: string | null;
  onClose: () => void;
  /** Focus Items tab content — rendered via slot from parent (Phase 4) */
  focusItemsSlot?: React.ReactNode;
  /** Number of new focus items (for badge) */
  focusNewCount?: number;
}

export default function StudyCenterSidebar({
  userId,
  moduleId,
  moduleTitle,
  skillId,
  onClose,
  focusItemsSlot,
  focusNewCount = 0,
}: StudyCenterSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const notes = useModuleNotes(userId, moduleId, skillId);

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* ── Sidebar panel ── */}
      <aside className="
        fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col border-l border-slate-200 bg-white shadow-xl
        lg:static lg:z-auto lg:shadow-none lg:rounded-2xl lg:border lg:border-slate-100 lg:max-h-[calc(100vh-8rem)]
      ">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 shrink-0">
          <p className="text-xs font-black uppercase tracking-wider text-slate-900">Study Center</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'notes'
                ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            My Notes
          </button>
          <button
            onClick={() => setActiveTab('focus')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'focus'
                ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Focus Items
            {focusNewCount > 0 && (
              <span className="absolute top-1.5 right-3 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                {focusNewCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'notes' && (
            <div className="flex flex-col h-full">
              {/* Module context */}
              {moduleId && (
                <div className="px-4 pt-3 pb-2 border-b border-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{moduleId}</p>
                  {moduleTitle && (
                    <p className="text-[11px] text-slate-500 truncate">{moduleTitle}</p>
                  )}
                </div>
              )}

              {/* Save indicator */}
              <div className="flex items-center justify-end px-4 py-1.5 shrink-0">
                {notes.saving ? (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving…
                  </span>
                ) : notes.noteText !== '' ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                    <Save className="w-3 h-3" />
                    Saved
                  </span>
                ) : null}
              </div>

              {/* Textarea */}
              <div className="flex-1 px-4 pb-4">
                <textarea
                  value={notes.noteText}
                  onChange={(e) => notes.setNoteText(e.target.value)}
                  placeholder="Type your study notes here… They auto-save as you type."
                  className="
                    w-full h-full min-h-[200px] resize-none rounded-xl border border-slate-200 bg-[#fbfaf7] p-3
                    text-sm text-slate-700 leading-relaxed placeholder:text-slate-400
                    focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200
                    transition-colors
                  "
                  disabled={!notes.loaded}
                />
              </div>
            </div>
          )}

          {activeTab === 'focus' && (
            <div className="p-4">
              {focusItemsSlot ?? (
                <div className="text-center py-8 space-y-2">
                  <Target className="w-6 h-6 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-500">
                    Generate a study plan to see personalized focus items.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
