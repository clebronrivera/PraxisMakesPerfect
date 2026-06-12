// src/components/ModulesBrowser.tsx
//
// Student-friendly module browser — replaces the deficit snake LearningPathNodeMap.
// Approved visual: public/mockup-modules-redesign-v2.html. Cool tokens only
// (docs/DESIGN_TOKENS.md). Data via useModuleCatalog → buildModuleCatalog.
//
// Views: Regular (all) ↔ Adaptive (gap-closing only, mastered hidden).
// Grouping: By domain (catalog) ↔ By weakness (ranked).
// "Close these first" surfaces the top priority modules (unpadded).
//
// a11y: each card is a real <button>; status conveyed by text + icon; focus-visible
// rings; segmented toggles use aria-pressed.

import { useEffect, useState } from 'react';
import { useModuleCatalog } from '../hooks/useModuleCatalog';
import {
  selectPriorityModules,
  recommendedProgress,
  type ModuleCatalogEntry,
} from '../utils/moduleCatalog';
import { PROGRESS_DOMAINS } from '../utils/progressTaxonomy';
import type { UserProfile } from '../hooks/useProgressTracking';
import type { LearningPathProgressMap } from '../hooks/useLearningPathSupabase';

type View = 'regular' | 'adaptive';
type Group = 'domain' | 'weakness';

const DOMAIN_GLYPH: Record<number, string> = { 1: '§', 2: '♥', 3: '◆', 4: '⌂' };

const STATUS: Record<ModuleCatalogEntry['status'], { label: string; icon: string; cls: string }> = {
  new: { label: 'Not started', icon: '○', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  in_progress: { label: 'In progress', icon: '●', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  reviewed: { label: 'Reviewed', icon: '✓', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

function profLabel(p: ModuleCatalogEntry['proficiency'], pct: number | null): { text: string; cls: string } {
  if (p === 'proficient') return { text: `Demonstrating ${pct ?? ''}%`, cls: 'text-emerald-600' };
  if (p === 'approaching') return { text: `Approaching ${pct ?? ''}%`, cls: 'text-amber-600' };
  if (p === 'emerging') return { text: `Emerging ${pct ?? ''}%`, cls: 'text-rose-600' };
  return { text: 'Not started', cls: 'text-slate-400' };
}

function ModuleCard({ entry, onOpen }: { entry: ModuleCatalogEntry; onOpen: (skillId: string) => void }) {
  const st = STATUS[entry.status];
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.skillId)}
      className="group w-full text-left rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`grad-d${entry.domainId} flex h-10 w-10 items-center justify-center rounded-xl text-[18px] text-white`} aria-hidden="true">
          {DOMAIN_GLYPH[entry.domainId] ?? '§'}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${st.cls}`}>
          <span aria-hidden="true">{st.icon}</span> {st.label}
        </span>
      </div>
      <p className="text-[14px] font-bold leading-snug text-slate-900">{entry.title}</p>
      <div className="mt-2 flex items-center gap-3 text-[11.5px] font-semibold text-slate-500">
        <span>⏱ {entry.estMinutes} min</span>
        {entry.activityCount > 0 && <span>✦ {entry.activityCount} {entry.activityCount === 1 ? 'activity' : 'activities'}</span>}
      </div>
      {entry.blockedByModuleId ? (
        <div className="mt-3 border-t border-slate-100 pt-3 text-[12px] font-semibold text-amber-700">Do a prerequisite first →</div>
      ) : entry.status === 'in_progress' ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <div className="mr-3 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className={`grad-d${entry.domainId} h-full rounded-full`} style={{ width: '50%' }} />
            </div>
            <span className="text-[13px] font-bold text-indigo-700">Continue →</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>{entry.scorePct != null ? `Best ${entry.scorePct}%` : 'Not started yet'}</span>
          <span className="text-[13px] font-bold text-indigo-700">{entry.status === 'reviewed' ? 'Review →' : 'Start →'}</span>
        </div>
      )}
    </button>
  );
}

function DomainSection({ domainId, name, entries, onOpen }: {
  domainId: number; name: string; entries: ModuleCatalogEntry[]; onOpen: (s: string) => void;
}) {
  if (entries.length === 0) return null;
  const reviewed = entries.filter(e => e.status === 'reviewed').length;
  const pct = Math.round((reviewed / entries.length) * 100);
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <span className={`grad-d${domainId} h-2.5 w-2.5 rounded-full`} aria-hidden="true" />
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{name}</h3>
        <span className="text-[12px] font-semibold text-slate-500">{reviewed} / {entries.length} reviewed</span>
        <div className="ml-1 hidden h-1.5 max-w-[160px] flex-1 overflow-hidden rounded-full bg-slate-100 sm:block">
          <div className={`grad-d${domainId} h-full rounded-full`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(e => <ModuleCard key={e.moduleId} entry={e} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

export default function ModulesBrowser({ profile, lpProgress, onNodeClick }: {
  profile: UserProfile;
  lpProgress: LearningPathProgressMap;
  onNodeClick: (skillId: string) => void;
}) {
  const entries = useModuleCatalog(profile, lpProgress);

  // View/group state — localStorage stub (server-side per-user prefs is the deferred
  // step; plan §10.4). First-visit default = by weakness (time-pays-off).
  const [view, setView] = useState<View>(() => {
    try { return (localStorage.getItem('pmp-modules-view') as View) || 'regular'; } catch { return 'regular'; }
  });
  const [group, setGroup] = useState<Group>(() => {
    try { return (localStorage.getItem('pmp-modules-group') as Group) || 'domain'; } catch { return 'domain'; }
  });
  useEffect(() => { try { localStorage.setItem('pmp-modules-view', view); } catch { /* ignore */ } }, [view]);
  useEffect(() => { try { localStorage.setItem('pmp-modules-group', group); } catch { /* ignore */ } }, [group]);

  const adaptive = view === 'adaptive';
  const visible = adaptive ? entries.filter(e => e.eligible) : entries;
  const priority = selectPriorityModules(entries);
  const rec = recommendedProgress(entries);
  const overallReviewed = entries.filter(e => e.status === 'reviewed').length;
  const masteredHidden = entries.filter(e => !e.eligible).length;

  const ranked = [...visible].sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return (a.scorePct ?? 0) - (b.scorePct ?? 0);
  });

  const seg = (active: boolean) =>
    `min-h-[40px] rounded-full px-4 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? 'grad-chrome text-white' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <div>
      {/* Header + progress */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Learning modules</h2>
          <p className="mt-1 max-w-xl text-[14px] text-slate-500">
            Short lessons that build toward exam readiness. Switch to <b className="text-slate-700">Adaptive</b> to see only what closes your gaps.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
            {adaptive ? 'Recommended · gap-closing' : 'Overall · all modules'}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-2xl font-extrabold tabular-nums text-slate-900">
              {adaptive ? rec.reviewed : overallReviewed}
              <span className="text-lg font-bold text-slate-400"> / {adaptive ? rec.total : entries.length}</span>
            </span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
              <div className="grad-chrome h-full rounded-full" style={{ width: `${adaptive ? rec.pct : Math.round((overallReviewed / Math.max(entries.length, 1)) * 100)}%` }} />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{adaptive ? 'recommended modules completed' : 'modules reviewed'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1" role="group" aria-label="View">
          <button type="button" className={seg(!adaptive)} aria-pressed={!adaptive} onClick={() => setView('regular')}>Regular</button>
          <button type="button" className={seg(adaptive)} aria-pressed={adaptive} onClick={() => setView('adaptive')}>Adaptive</button>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1" role="group" aria-label="Group by">
          <button type="button" className={seg(group === 'domain')} aria-pressed={group === 'domain'} onClick={() => setGroup('domain')}>By domain</button>
          <button type="button" className={seg(group === 'weakness')} aria-pressed={group === 'weakness'} onClick={() => setGroup('weakness')}>By weakness</button>
        </div>
      </div>

      {/* Adaptive summary strip */}
      {adaptive && (
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-500">Adaptive view · closing your gaps</p>
          <p className="mt-0.5 text-[15px] font-bold text-slate-900">
            {rec.total} module{rec.total === 1 ? '' : 's'} recommended for you — {masteredHidden} mastered hidden
          </p>
          <div className="mt-2 flex max-w-md items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="grad-chrome h-full rounded-full" style={{ width: `${rec.pct}%` }} />
            </div>
            <span className="shrink-0 text-[12px] font-bold tabular-nums text-slate-600">{rec.reviewed} / {rec.total} · {rec.pct}%</span>
          </div>
          <button type="button" className="mt-2 text-[13px] font-bold text-indigo-700 hover:text-indigo-900" onClick={() => setView('regular')}>Show all {entries.length} →</button>
        </div>
      )}

      {/* Priority */}
      {priority.length > 0 && (
        <section className="mb-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg text-[13px] text-white" style={{ backgroundImage: 'linear-gradient(135deg,#f43f5e,#db2777)' }} aria-hidden="true">⚑</span>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Close these first</h3>
            <span className="text-[12px] font-semibold text-slate-500">your highest-impact gaps</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {priority.map(e => <ModuleCard key={`prio-${e.moduleId}`} entry={e} onOpen={onNodeClick} />)}
          </div>
        </section>
      )}

      {/* Body: domain or weakness */}
      {group === 'domain' ? (
        PROGRESS_DOMAINS.map(d => (
          <DomainSection key={d.id} domainId={d.id} name={d.name} entries={visible.filter(e => e.domainId === d.id)} onOpen={onNodeClick} />
        ))
      ) : (
        <section>
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Ranked by weakness · weakest first</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ol className="divide-y divide-slate-100">
              {ranked.map((e, i) => {
                const pl = profLabel(e.proficiency, e.scorePct);
                return (
                  <li key={e.moduleId}>
                    <button type="button" onClick={() => onNodeClick(e.skillId)} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <span className={`grad-d${e.domainId} flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-black text-white`} aria-hidden="true">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold text-slate-900">{e.title}</span>
                        <span className="block text-[11.5px] text-slate-500">{e.domainName} · <b className={pl.cls}>{pl.text}</b></span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold text-indigo-700">{e.status === 'reviewed' ? 'Review →' : e.status === 'in_progress' ? 'Continue →' : 'Start →'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* Empty states */}
      {visible.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mb-2 text-3xl" aria-hidden="true">{adaptive ? '✨' : '📘'}</div>
          <p className="text-[14px] font-semibold text-slate-700">{adaptive ? "You're all caught up" : 'No modules yet'}</p>
          <p className="mt-1 text-[12px] text-slate-500">
            {adaptive ? 'Nothing left to close right now. Keep practicing.' : 'Open a learning module to start.'}
          </p>
        </div>
      )}
    </div>
  );
}
