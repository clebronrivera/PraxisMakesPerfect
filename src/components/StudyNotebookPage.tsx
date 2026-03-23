// src/components/StudyNotebookPage.tsx
//
// Full-page Study Notebook — aggregates notes and focus items across all skills.
// Accessed from the main sidebar navigation.
//
// Two sections:
//   1. My Notes — all module notes grouped by skill
//   2. Focus Items — all study plan focus items with check-off state

import { useState, useEffect } from 'react';
import { BookMarked, StickyNote, Target, ChevronDown, ChevronUp, CheckCircle, Circle, BookOpen, AlertTriangle, ShieldAlert } from 'lucide-react';
import { supabase } from '../config/supabase';
import type { StudyPlanDocumentV2 } from '../types/studyPlanTypes';
import { extractFocusItems, type FocusItem } from '../utils/focusItemExtractor';
import { getProgressSkillDefinition } from '../utils/progressTaxonomy';
import { SKILL_MODULE_MAP, MODULE_LOOKUP } from '../data/learningModules';

type TabId = 'notes' | 'focus';

interface StudyNotebookPageProps {
  userId: string | null;
  latestStudyPlan: { id: string; createdAt: string; plan: StudyPlanDocumentV2 } | null;
}

// ─── Note type from Supabase ──────────────────────────────────────────────────

interface ModuleNoteRow {
  module_id: string;
  skill_id: string;
  note_text: string;
  updated_at: string;
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ userId }: { userId: string | null }) {
  const [notes, setNotes] = useState<ModuleNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from('module_notes')
        .select('module_id, skill_id, note_text, updated_at')
        .eq('user_id', userId)
        .neq('note_text', '')
        .order('updated_at', { ascending: false });

      if (!error && data) setNotes(data);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <StickyNote className="w-8 h-8 mx-auto text-slate-300" />
        <p className="text-sm text-slate-500">No notes yet.</p>
        <p className="text-xs text-slate-400">Open a module in the Learning Path and use the Study Center sidebar to add notes.</p>
      </div>
    );
  }

  // Group notes by skill
  const bySkill: Record<string, ModuleNoteRow[]> = {};
  for (const n of notes) {
    if (!bySkill[n.skill_id]) bySkill[n.skill_id] = [];
    bySkill[n.skill_id].push(n);
  }

  return (
    <div className="space-y-3">
      {Object.entries(bySkill).map(([skillId, skillNotes]) => {
        const skillDef = getProgressSkillDefinition(skillId);
        const isExpanded = expandedSkill === skillId;
        return (
          <div key={skillId} className="editorial-surface overflow-hidden">
            <button
              onClick={() => setExpandedSkill(isExpanded ? null : skillId)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <StickyNote className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{skillDef?.fullLabel ?? skillId}</p>
                <p className="text-[10px] text-slate-400">{skillNotes.length} {skillNotes.length === 1 ? 'note' : 'notes'}</p>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                {skillNotes.map(n => {
                  const mod = MODULE_LOOKUP[n.module_id];
                  return (
                    <div key={n.module_id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {n.module_id}
                        </span>
                        {mod && <span className="text-[11px] text-slate-500 truncate">{mod.title}</span>}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-3">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.note_text}</p>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Last edited {new Date(n.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Focus Items Section ──────────────────────────────────────────────────────

function FocusSection({
  userId,
  latestStudyPlan,
}: {
  userId: string | null;
  latestStudyPlan: StudyNotebookPageProps['latestStudyPlan'];
}) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Extract all focus items across all skills
  const allItems: Array<{ skillId: string; items: FocusItem[] }> = [];
  if (latestStudyPlan?.plan) {
    const skillIds = Object.keys(SKILL_MODULE_MAP);
    for (const skillId of skillIds) {
      const items = extractFocusItems(latestStudyPlan.plan, skillId);
      if (items.length > 0) {
        allItems.push({ skillId, items });
      }
    }
  }

  // Load check states
  useEffect(() => {
    if (!userId || !latestStudyPlan?.id) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('focus_item_checks')
        .select('item_type, item_key')
        .eq('user_id', userId)
        .eq('study_plan_id', latestStudyPlan.id)
        .eq('checked', true);

      if (data) {
        const checked = new Set<string>();
        for (const group of allItems) {
          for (const item of group.items) {
            const match = data.find(d => d.item_type === item.type && d.item_key === item.text);
            if (match) checked.add(item.id);
          }
        }
        setCheckedIds(checked);
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, latestStudyPlan?.id]);

  const toggleCheck = (itemId: string) => {
    if (!userId || !latestStudyPlan?.id) return;
    const flat = allItems.flatMap(g => g.items);
    const item = flat.find(i => i.id === itemId);
    if (!item) return;

    const wasChecked = checkedIds.has(itemId);
    const newSet = new Set(checkedIds);
    wasChecked ? newSet.delete(itemId) : newSet.add(itemId);
    setCheckedIds(newSet);

    supabase.from('focus_item_checks').upsert(
      {
        user_id: userId,
        study_plan_id: latestStudyPlan.id,
        item_type: item.type,
        item_key: item.text,
        checked: !wasChecked,
        checked_at: !wasChecked ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,study_plan_id,item_type,item_key' }
    );
  };

  if (!latestStudyPlan) {
    return (
      <div className="text-center py-12 space-y-3">
        <Target className="w-8 h-8 mx-auto text-slate-300" />
        <p className="text-sm text-slate-500">No study plan generated yet.</p>
        <p className="text-xs text-slate-400">Generate a study plan to see personalized focus items here.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const totalItems = allItems.reduce((sum, g) => sum + g.items.length, 0);
  const totalChecked = allItems.reduce(
    (sum, g) => sum + g.items.filter(i => checkedIds.has(i.id)).length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="editorial-surface-soft px-5 py-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="editorial-progress-track">
            <div
              className="editorial-progress-fill transition-all duration-500"
              style={{ width: `${totalItems > 0 ? (totalChecked / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500 shrink-0">
          {totalChecked}/{totalItems} reviewed
        </span>
      </div>

      {allItems.map(({ skillId, items }) => {
        const skillDef = getProgressSkillDefinition(skillId);
        const checkedCount = items.filter(i => checkedIds.has(i.id)).length;
        const allDone = checkedCount === items.length;

        return (
          <SkillFocusGroup
            key={skillId}
            skillLabel={skillDef?.fullLabel ?? skillId}
            items={items}
            checkedIds={checkedIds}
            onToggleCheck={toggleCheck}
            allDone={allDone}
            checkedCount={checkedCount}
          />
        );
      })}
    </div>
  );
}

function SkillFocusGroup({
  skillLabel,
  items,
  checkedIds,
  onToggleCheck,
  allDone,
  checkedCount,
}: {
  skillLabel: string;
  items: FocusItem[];
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  allDone: boolean;
  checkedCount: number;
}) {
  const [expanded, setExpanded] = useState(!allDone);

  const iconMap = {
    vocabulary: <BookOpen className="w-3.5 h-3.5 text-amber-600" />,
    misconception: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
    trap: <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />,
  };

  return (
    <div className={`editorial-surface overflow-hidden ${allDone ? 'opacity-70' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <Target className="w-4 h-4 text-amber-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{skillLabel}</p>
          <p className="text-[10px] text-slate-400">{checkedCount}/{items.length} reviewed</p>
        </div>
        {allDone && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-3 space-y-2">
          {items.map(item => {
            const checked = checkedIds.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onToggleCheck(item.id)}
                className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  checked
                    ? 'border-slate-100 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-white hover:border-amber-200'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {checked ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {iconMap[item.type]}
                    <p className={`text-xs font-semibold leading-snug ${checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {item.text}
                    </p>
                  </div>
                  {item.detail && !checked && (
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug ml-6">{item.detail}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudyNotebookPage({ userId, latestStudyPlan }: StudyNotebookPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('notes');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-2">
          <BookMarked className="w-6 h-6 text-amber-700" />
          <p className="editorial-overline">Study Notebook</p>
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900">Your Notes & Focus.</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-lg">
          All your module notes and AI-identified focus items in one place. Check off items as you master them.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
            activeTab === 'notes'
              ? 'bg-amber-500 text-slate-900 shadow-lg'
              : 'border border-slate-200 bg-white text-slate-500 hover:border-amber-200'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          My Notes
        </button>
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
            activeTab === 'focus'
              ? 'bg-amber-500 text-slate-900 shadow-lg'
              : 'border border-slate-200 bg-white text-slate-500 hover:border-amber-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Focus Items
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'notes' && <NotesSection userId={userId} />}
      {activeTab === 'focus' && <FocusSection userId={userId} latestStudyPlan={latestStudyPlan} />}
    </div>
  );
}
