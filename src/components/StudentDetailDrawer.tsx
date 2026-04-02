import { useEffect, useState } from 'react';
import { X, RefreshCw, BarChart3, Clock, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { supabase } from '../config/supabase';
import { PROGRESS_DOMAINS, PROGRESS_SKILL_LOOKUP } from '../utils/progressTaxonomy';
import { DEMONSTRATING_THRESHOLD, APPROACHING_THRESHOLD } from '../utils/skillProficiency';

interface UserInfo {
  id: string;
  authMetrics?: {
    email?: string | null;
    displayName?: string | null;
  };
}

interface ResponseRow {
  question_id: string;
  skill_id: string | null;
  domain_id: number | null;
  assessment_type: string | null;
  is_correct: boolean | null;
  confidence: string | null;
  time_on_item_seconds: number | null;
  selected_answers: string[] | null;
  correct_answers: string[] | null;
  session_id: string | null;
  created_at: string | null;
  // Adaptive audit fields
  is_followup: boolean | null;
  cognitive_complexity: string | null;
  skill_question_index: number | null;
}

interface DomainStat {
  domainId: number;
  name: string;
  correct: number;
  total: number;
  pct: number;
}

interface SkillStat {
  skillId: string;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avgTime: number | null;
}

interface SessionStat {
  sessionId: string;
  mode: string;
  date: string | null;
  questions: number;
  correct: number;
  accuracy: number;
  avgTime: number | null;
}

interface TimeDist {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeTimeDist(rows: ResponseRow[]): TimeDist | null {
  const times = rows
    .map((r) => r.time_on_item_seconds)
    .filter((t): t is number => t != null && t > 0)
    .sort((a, b) => a - b);
  if (times.length === 0) return null;
  return {
    min: times[0],
    q1: Math.round(percentile(times, 25)),
    median: Math.round(percentile(times, 50)),
    q3: Math.round(percentile(times, 75)),
    max: times[times.length - 1],
    count: times.length
  };
}

function getDomainForSkill(skillId: string | null): number | null {
  if (!skillId) return null;
  const def = PROGRESS_SKILL_LOOKUP[skillId];
  return def ? def.domainId : null;
}

function formatMode(mode: string | null): string {
  if (!mode) return 'Unknown';
  if (mode.startsWith('practice')) return 'Practice';
  if (mode === 'screener') return 'Screener';
  if (mode === 'full_assessment') return 'Full Assessment';
  if (mode === 'adaptive_diagnostic') return 'Diagnostic';
  return mode;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface StudentDetailDrawerProps {
  user: UserInfo;
  onClose: () => void;
}

export default function StudentDetailDrawer({ user, onClose }: StudentDetailDrawerProps) {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillSort, setSkillSort] = useState<'accuracy' | 'attempts' | 'avgTime'>('accuracy');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('No active session');

        const res = await fetch(`/api/admin-student-detail?userId=${encodeURIComponent(user.id)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load student data');
        if (active) setResponses(body.responses || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user.id]);

  // ── Domain Stats ──────────────────────────────────────────────────────────
  const domainStats: DomainStat[] = PROGRESS_DOMAINS.map((domain) => {
    const domainResponses = responses.filter(
      (r) => getDomainForSkill(r.skill_id) === domain.id
    );
    const correct = domainResponses.filter((r) => r.is_correct).length;
    const total = domainResponses.length;
    return {
      domainId: domain.id,
      name: domain.name,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  });

  // ── Skill Stats ───────────────────────────────────────────────────────────
  const skillMap = new Map<string, { correct: number; total: number; times: number[] }>();
  for (const r of responses) {
    if (!r.skill_id) continue;
    if (!skillMap.has(r.skill_id)) skillMap.set(r.skill_id, { correct: 0, total: 0, times: [] });
    const s = skillMap.get(r.skill_id)!;
    s.total += 1;
    if (r.is_correct) s.correct += 1;
    if (r.time_on_item_seconds != null && r.time_on_item_seconds > 0) {
      s.times.push(r.time_on_item_seconds);
    }
  }
  const skillStats: SkillStat[] = Array.from(skillMap.entries()).map(([skillId, s]) => ({
    skillId,
    label: PROGRESS_SKILL_LOOKUP[skillId]?.shortLabel ?? skillId,
    attempts: s.total,
    correct: s.correct,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    avgTime: s.times.length > 0 ? Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length) : null
  }));
  const sortedSkillStats = [...skillStats].sort((a, b) => {
    if (skillSort === 'accuracy') return a.accuracy - b.accuracy;
    if (skillSort === 'attempts') return b.attempts - a.attempts;
    return (b.avgTime ?? 0) - (a.avgTime ?? 0);
  });

  // ── Session Timeline ──────────────────────────────────────────────────────
  const sessionMap = new Map<string, { mode: string; rows: ResponseRow[] }>();
  for (const r of responses) {
    const sid = r.session_id || 'unknown';
    if (!sessionMap.has(sid)) sessionMap.set(sid, { mode: r.assessment_type || 'unknown', rows: [] });
    sessionMap.get(sid)!.rows.push(r);
  }
  const sessionStats: SessionStat[] = Array.from(sessionMap.entries())
    .map(([sid, { mode, rows }]) => {
      const sorted = [...rows].sort((a, b) =>
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
      const correct = rows.filter((r) => r.is_correct).length;
      const times = rows.map((r) => r.time_on_item_seconds).filter((t): t is number => t != null && t > 0);
      return {
        sessionId: sid,
        mode,
        date: sorted[0]?.created_at ?? null,
        questions: rows.length,
        correct,
        accuracy: rows.length > 0 ? Math.round((correct / rows.length) * 100) : 0,
        avgTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null
      };
    })
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  // ── Time Distribution ────────────────────────────────────────────────────
  const timeDist = computeTimeDist(responses);

  // ── Most Missed Skills ───────────────────────────────────────────────────
  const missMap = new Map<string, number>();
  for (const r of responses) {
    if (r.is_correct === false && r.skill_id) {
      missMap.set(r.skill_id, (missMap.get(r.skill_id) ?? 0) + 1);
    }
  }
  const missedSkills = Array.from(missMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const displayName = user.authMetrics?.displayName || user.authMetrics?.email || user.id;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end" onClick={onClose}>
      <div
        className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
            <p className="text-sm text-slate-500">{user.authMetrics?.email || user.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
            <p className="text-rose-700">{error}</p>
            <p className="mt-2 text-sm text-slate-500">
              This endpoint requires SUPABASE_SERVICE_ROLE_KEY on Netlify.
            </p>
          </div>
        ) : responses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-slate-500">No response data yet for this student.</p>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* ── Panel 1: Domain Performance ── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-700" />
                <h3 className="font-semibold text-slate-900">Domain Performance</h3>
              </div>
              <div className="space-y-3">
                {domainStats.map((d) => (
                  <div key={d.domainId} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{d.name}</p>
                      <span className="text-sm font-semibold text-slate-700">
                        {d.total > 0 ? `${d.pct}% (${d.correct}/${d.total})` : 'No data'}
                      </span>
                    </div>
                    {d.total > 0 && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            d.pct >= 80 ? 'bg-emerald-500' : d.pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Panel 2: Skill Drill-Down ── */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-700" />
                  <h3 className="font-semibold text-slate-900">Skill Breakdown</h3>
                </div>
                <div className="flex gap-1">
                  {(['accuracy', 'attempts', 'avgTime'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkillSort(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        skillSort === s
                          ? 'bg-amber-500 text-white'
                          : 'border border-slate-200 text-slate-500 hover:border-amber-200'
                      }`}
                    >
                      {s === 'accuracy' ? 'Accuracy' : s === 'attempts' ? 'Attempts' : 'Avg Time'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Skill</th>
                      <th className="px-4 py-3 text-right">Attempts</th>
                      <th className="px-4 py-3 text-right">Accuracy</th>
                      <th className="px-4 py-3 text-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {sortedSkillStats.map((s) => (
                      <tr key={s.skillId} className="text-slate-700">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{s.label}</p>
                          <p className="font-mono text-xs text-slate-400">{s.skillId}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{s.attempts}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            s.accuracy >= DEMONSTRATING_THRESHOLD * 100 ? 'text-emerald-600' : s.accuracy >= APPROACHING_THRESHOLD * 100 ? 'text-amber-700' : 'text-rose-600'
                          }`}>
                            {s.accuracy}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {s.avgTime != null ? `${s.avgTime}s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Panel 3: Session Timeline ── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-700" />
                <h3 className="font-semibold text-slate-900">Session Timeline</h3>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Mode</th>
                      <th className="px-4 py-3 text-right">Questions</th>
                      <th className="px-4 py-3 text-right">Accuracy</th>
                      <th className="px-4 py-3 text-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {sessionStats.map((s) => (
                      <tr key={s.sessionId} className="text-slate-700">
                        <td className="px-4 py-3 text-slate-500">{formatDate(s.date)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            {formatMode(s.mode)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{s.questions}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            s.accuracy >= DEMONSTRATING_THRESHOLD * 100 ? 'text-emerald-600' : s.accuracy >= APPROACHING_THRESHOLD * 100 ? 'text-amber-700' : 'text-rose-600'
                          }`}>
                            {s.accuracy}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {s.avgTime != null ? `${s.avgTime}s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Panel 4: Time Distribution ── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-700" />
                <h3 className="font-semibold text-slate-900">Time Distribution</h3>
                {timeDist && (
                  <span className="text-xs text-slate-400">{timeDist.count} timed responses</span>
                )}
              </div>
              {timeDist ? (
                <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { label: 'Min', value: timeDist.min },
                      { label: 'Q1 (25%)', value: timeDist.q1 },
                      { label: 'Median', value: timeDist.median },
                      { label: 'Q3 (75%)', value: timeDist.q3 },
                      { label: 'Max', value: timeDist.max }
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{value}s</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    A narrow Q1–Q3 range means consistent pacing. A wide spread or very low median
                    suggests rushing or guessing on some questions.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No timing data recorded yet.</p>
              )}
            </section>

            {/* ── Panel 5: Adaptive Diagnostic Audit ── */}
            {(() => {
              const adaptiveRows = responses.filter((r: ResponseRow) => r.assessment_type === 'adaptive');
              if (adaptiveRows.length === 0) return null;
              const followUpCount = adaptiveRows.filter((r: ResponseRow) => r.is_followup).length;
              const recallCount = adaptiveRows.filter((r: ResponseRow) => r.cognitive_complexity === 'Recall').length;
              const applicationCount = adaptiveRows.filter((r: ResponseRow) => r.cognitive_complexity === 'Application').length;
              return (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-700" />
                    <h3 className="font-semibold text-slate-900">Adaptive Diagnostic Audit</h3>
                    <span className="text-xs text-slate-400">{adaptiveRows.length} questions</span>
                  </div>
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-xs text-slate-500">Initial</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{adaptiveRows.length - followUpCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-xs text-slate-500">Follow-ups</p>
                      <p className="mt-1 text-lg font-semibold text-purple-600">{followUpCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-xs text-slate-500">Recall</p>
                      <p className="mt-1 text-lg font-semibold text-blue-600">{recallCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-xs text-slate-500">Application</p>
                      <p className="mt-1 text-lg font-semibold text-amber-600">{applicationCount}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Q#</th>
                          <th className="px-3 py-2 text-left">Skill</th>
                          <th className="px-3 py-2 text-center">Skill Q#</th>
                          <th className="px-3 py-2 text-center">Follow-up?</th>
                          <th className="px-3 py-2 text-center">Type</th>
                          <th className="px-3 py-2 text-center">Result</th>
                          <th className="px-3 py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {adaptiveRows.map((r: ResponseRow, idx: number) => (
                          <tr key={`${r.question_id}-${idx}`} className="text-slate-700">
                            <td className="px-3 py-2 text-xs text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className="font-mono text-slate-500">{r.skill_id || '—'}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-xs">
                              {r.skill_question_index != null ? (
                                <span className={`rounded-full px-2 py-0.5 font-medium ${
                                  r.skill_question_index === 1 ? 'bg-slate-100 text-slate-600' :
                                  r.skill_question_index === 2 ? 'bg-amber-50 text-amber-700' :
                                  'bg-rose-50 text-rose-700'
                                }`}>{r.skill_question_index}</span>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2 text-center text-xs">
                              {r.is_followup ? (
                                <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Yes</span>
                              ) : (
                                <span className="text-slate-400">No</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center text-xs">
                              {r.cognitive_complexity ? (
                                <span className={`rounded-full px-2 py-0.5 font-medium ${
                                  r.cognitive_complexity === 'Recall' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                }`}>{r.cognitive_complexity}</span>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center text-xs">
                              {r.is_correct ? (
                                <span className="font-semibold text-emerald-600">✓</span>
                              ) : (
                                <span className="font-semibold text-rose-600">✗</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs text-slate-600">
                              {r.time_on_item_seconds != null ? `${r.time_on_item_seconds}s` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })()}

            {/* ── Panel 6: Most Missed Skills ── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <h3 className="font-semibold text-slate-900">Most Missed Skills</h3>
              </div>
              {missedSkills.length === 0 ? (
                <p className="text-sm text-slate-400">No missed questions on record.</p>
              ) : (
                <div className="space-y-2">
                  {missedSkills.map(([skillId, count], idx) => (
                    <div
                      key={skillId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-[#fbfaf7] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center text-xs font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {PROGRESS_SKILL_LOOKUP[skillId]?.shortLabel ?? skillId}
                          </p>
                          <p className="font-mono text-xs text-slate-400">{skillId}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        {count} missed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
