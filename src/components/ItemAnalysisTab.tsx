import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Filter, RefreshCw, TrendingDown } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../config/supabase';
import { PROGRESS_SKILL_LOOKUP, PROGRESS_DOMAINS } from '../utils/progressTaxonomy';

interface DistractorDetail {
  freq: number;
  tier: string | null;
  errorType: string | null;
  misconception: string | null;
}

interface ItemStat {
  questionId: string;
  skillId: string | null;
  attempts: number;
  pValue: number;
  discrimination: number;
  avgTime: number | null;
  distractorFreqs: Record<string, number>;
  distractorDetails?: Record<string, DistractorDetail>;
  flags: string[];
  errorClusterTag?: string | null;
  dominantErrorPattern?: string | null;
  instructionalRedFlags?: string | null;
}

type SortField = 'attempts' | 'pValue' | 'discrimination' | 'avgTime' | 'flags';
type SortDir = 'asc' | 'desc';

const FLAG_STYLES: Record<string, string> = {
  'Too Easy': 'bg-blue-50 text-blue-700',
  'Too Hard': 'bg-rose-50 text-rose-700',
  'Low Discrimination': 'bg-orange-50 text-orange-700',
  'Timing Outlier': 'bg-yellow-50 text-yellow-700'
};

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  ...PROGRESS_DOMAINS.map((d) => ({ value: String(d.id), label: d.name }))
];

const FLAG_OPTIONS = [
  { value: '', label: 'All Items' },
  { value: 'flagged', label: 'Flagged Only' },
  { value: 'Too Easy', label: 'Too Easy' },
  { value: 'Too Hard', label: 'Too Hard' },
  { value: 'Low Discrimination', label: 'Low Discrimination' },
  { value: 'Timing Outlier', label: 'Timing Outlier' }
];

function getDomainIdForSkill(skillId: string | null): number | null {
  if (!skillId) return null;
  return PROGRESS_SKILL_LOOKUP[skillId]?.domainId ?? null;
}

function getDomainNameForSkill(skillId: string | null): string {
  const domainId = getDomainIdForSkill(skillId);
  if (!domainId) return '—';
  return PROGRESS_DOMAINS.find((d) => d.id === domainId)?.shortName ?? '—';
}

function pValueBar(pValue: number): string {
  if (pValue >= 0.9) return 'bg-blue-400';
  if (pValue <= 0.2) return 'bg-rose-400';
  if (pValue >= 0.7) return 'bg-emerald-500';
  return 'bg-amber-400';
}

export default function ItemAnalysisTab() {
  const [items, setItems] = useState<ItemStat[]>([]);
  const [globalAvgTime, setGlobalAvgTime] = useState<number | null>(null);
  const [globalStddev, setGlobalStddev] = useState<number | null>(null);
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filters + sort
  const [domainFilter, setDomainFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [clusterTagFilter, setClusterTagFilter] = useState('');
  const [minAttempts, setMinAttempts] = useState(1);
  const [sortField, setSortField] = useState<SortField>('attempts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('No active session');

        const res = await fetch('/api/admin-item-analysis', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load item analysis');
        if (active) {
          setItems(body.items || []);
          setGlobalAvgTime(body.globalAvgTime ?? null);
          setGlobalStddev(body.globalStddev ?? null);
          setTotalResponses(body.totalResponses ?? 0);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Unique error cluster tags for filter dropdown
  const clusterTagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const item of items) {
      if (item.errorClusterTag) tags.add(item.errorClusterTag);
    }
    return Array.from(tags).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let out = items.filter((item) => item.attempts >= minAttempts);
    if (domainFilter) {
      const domainId = Number(domainFilter);
      out = out.filter((item) => getDomainIdForSkill(item.skillId) === domainId);
    }
    if (flagFilter === 'flagged') {
      out = out.filter((item) => item.flags.length > 0);
    } else if (flagFilter) {
      out = out.filter((item) => item.flags.includes(flagFilter));
    }
    if (clusterTagFilter) {
      out = out.filter((item) => item.errorClusterTag === clusterTagFilter);
    }
    return [...out].sort((a, b) => {
      let av: number, bv: number;
      switch (sortField) {
        case 'pValue': av = a.pValue; bv = b.pValue; break;
        case 'discrimination': av = a.discrimination; bv = b.discrimination; break;
        case 'avgTime': av = a.avgTime ?? -1; bv = b.avgTime ?? -1; break;
        case 'flags': av = a.flags.length; bv = b.flags.length; break;
        default: av = a.attempts; bv = b.attempts;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [items, domainFilter, flagFilter, clusterTagFilter, minAttempts, sortField, sortDir]);

  const totalFlagged = useMemo(() => items.filter((i) => i.flags.length > 0).length, [items]);
  const avgPValue = useMemo(() => {
    const relevant = items.filter((i) => i.attempts >= 5);
    return relevant.length > 0
      ? Math.round((relevant.reduce((s, i) => s + i.pValue, 0) / relevant.length) * 100)
      : null;
  }, [items]);
  const avgDiscrimination = useMemo(() => {
    const relevant = items.filter((i) => i.attempts >= 5);
    return relevant.length > 0
      ? Math.round((relevant.reduce((s, i) => s + i.discrimination, 0) / relevant.length) * 100) / 100
      : null;
  }, [items]);

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-amber-700"
      >
        {label}
        {sortField === field
          ? sortDir === 'desc'
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronUp className="h-3 w-3" />
          : <span className="h-3 w-3 opacity-0"><ChevronDown className="h-3 w-3" /></span>}
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="editorial-surface p-12 text-center">
        <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-500" />
        <p className="text-slate-500">Loading item analysis — this may take a moment for large datasets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editorial-surface p-10 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="font-medium text-rose-700">{error}</p>
        <p className="mt-2 text-sm text-slate-500">
          Requires SUPABASE_SERVICE_ROLE_KEY on Netlify. Falls back gracefully when no data exists yet.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="editorial-surface p-12 text-center">
        <TrendingDown className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <p className="text-slate-500">No response data yet. Item analysis will populate once users start answering questions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="editorial-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Items Seen</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p>
          <p className="mt-1 text-xs text-slate-400">{totalResponses.toLocaleString()} total responses</p>
        </div>
        <div className="editorial-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Flagged Items</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalFlagged}</p>
          <p className="mt-1 text-xs text-slate-400">
            {items.length > 0 ? Math.round((totalFlagged / items.length) * 100) : 0}% of items seen
          </p>
        </div>
        <div className="editorial-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg Difficulty (p)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {avgPValue != null ? `${avgPValue}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">proportion correct (≥5 attempts)</p>
        </div>
        <div className="editorial-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg Discrimination</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {avgDiscrimination != null ? avgDiscrimination.toFixed(2) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {globalAvgTime != null ? `${globalAvgTime}s avg time · ±${globalStddev ?? '?'}s` : 'no timing data'}
          </p>
        </div>
      </div>

      {/* Difficulty vs. Discrimination scatter plot per public/mockup-admin-charts.html. */}
      {/* Each dot is one question. ReferenceLines mark flag thresholds:                  */}
      {/*   x = 0.20 (too hard), x = 0.90 (too easy), y = 0 (low discrimination).         */}
      <ItemAnalysisScatter items={items} />

      {/* Filter bar */}
      <div className="editorial-surface p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Domain</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-300"
            >
              {DOMAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Flags</span>
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-300"
            >
              {FLAG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Error Cluster</span>
            <select
              value={clusterTagFilter}
              onChange={(e) => setClusterTagFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-300"
            >
              <option value="">All Clusters</option>
              {clusterTagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Min attempts</span>
            <select
              value={minAttempts}
              onChange={(e) => setMinAttempts(Number(e.target.value))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-300"
            >
              {[1, 3, 5, 10, 20].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </label>
          <p className="ml-auto self-end text-sm text-slate-400">
            {filtered.length} of {items.length} items
          </p>
        </div>
      </div>

      {/* Item table */}
      <div className="editorial-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Question ID</th>
                <th className="px-5 py-4">Skill / Domain</th>
                <th className="px-5 py-4 text-right">
                  <SortBtn field="attempts" label="Attempts" />
                </th>
                <th className="px-5 py-4 text-right">
                  <SortBtn field="pValue" label="Difficulty (p)" />
                </th>
                <th className="px-5 py-4 text-right">
                  <SortBtn field="discrimination" label="Discrimination" />
                </th>
                <th className="px-5 py-4 text-right">
                  <SortBtn field="avgTime" label="Avg Time" />
                </th>
                <th className="px-5 py-4">
                  <SortBtn field="flags" label="Flags" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {filtered.map((item) => (
                <>
                  <tr
                    key={item.questionId}
                    className="cursor-pointer align-top text-slate-700 hover:bg-amber-50/30 transition-colors"
                    onClick={() => setExpandedRow(expandedRow === item.questionId ? null : item.questionId)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-900">{item.questionId}</span>
                        {item.errorClusterTag && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                            {item.errorClusterTag}
                          </span>
                        )}
                        {expandedRow === item.questionId
                          ? <ChevronUp className="h-3 w-3 text-slate-400" />
                          : <ChevronDown className="h-3 w-3 text-slate-400" />}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-slate-900">
                        {item.skillId ? (PROGRESS_SKILL_LOOKUP[item.skillId]?.shortLabel ?? item.skillId) : '—'}
                      </p>
                      <p className="text-xs text-slate-400">{getDomainNameForSkill(item.skillId)}</p>
                    </td>
                    <td className="px-5 py-3 text-right">{item.attempts}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-semibold ${
                          item.pValue > 0.9 ? 'text-blue-600'
                          : item.pValue < 0.2 ? 'text-rose-600'
                          : 'text-slate-900'
                        }`}>
                          {(item.pValue * 100).toFixed(0)}%
                        </span>
                        {item.attempts >= 5 && (
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-1.5 rounded-full ${pValueBar(item.pValue)}`}
                              style={{ width: `${item.pValue * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${
                        item.discrimination <= 0 ? 'text-rose-600'
                        : item.discrimination >= 0.3 ? 'text-emerald-600'
                        : 'text-slate-700'
                      }`}>
                        {item.discrimination >= 0 ? '+' : ''}{item.discrimination.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-600">
                      {item.avgTime != null ? `${item.avgTime}s` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {item.flags.length === 0 ? (
                        <span className="text-xs text-emerald-600">✓</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.flags.map((f) => (
                            <span key={f} className={`rounded-full px-2 py-0.5 text-xs font-medium ${FLAG_STYLES[f] ?? 'bg-slate-100 text-slate-600'}`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>

                  {expandedRow === item.questionId && (
                    <tr key={`${item.questionId}-expanded`} className="bg-slate-50">
                      <td colSpan={7} className="px-5 py-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Wrong-Answer Distribution
                          </p>
                          {Object.keys(item.distractorFreqs).length === 0 ? (
                            <p className="text-xs text-slate-400">No incorrect answers recorded yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(item.distractorFreqs)
                                .sort((a, b) => b[1] - a[1])
                                .map(([ans, count]) => {
                                  const totalIncorrect = Object.values(item.distractorFreqs).reduce((s, c) => s + c, 0);
                                  const pct = totalIncorrect > 0 ? Math.round((count / totalIncorrect) * 100) : 0;
                                  const detail = item.distractorDetails?.[ans];
                                  const tierColor =
                                    detail?.tier === 'L1' ? 'text-rose-600' :
                                    detail?.tier === 'L2' ? 'text-amber-600' :
                                    detail?.tier === 'L3' ? 'text-slate-400' : '';
                                  return (
                                    <div
                                      key={ans}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                                      title={detail?.misconception ?? undefined}
                                    >
                                      <span className="font-mono font-semibold text-slate-900">{ans}</span>
                                      <span className="ml-2 text-slate-500">{count}× ({pct}%)</span>
                                      {detail?.tier && (
                                        <span className={`ml-2 font-semibold ${tierColor}`}>{detail.tier}</span>
                                      )}
                                      {detail?.errorType && (
                                        <span className="ml-1 text-slate-400">· {detail.errorType}</span>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                          <p className="mt-2 text-xs text-slate-400">
                            Discrimination {item.discrimination >= 0 ? '+' : ''}{item.discrimination.toFixed(2)} —
                            {item.discrimination > 0.3
                              ? ' good: students who know the material got this right more often'
                              : item.discrimination <= 0
                                ? ' flag: students scoring higher overall got this wrong as often or more than lower scorers'
                                : ' moderate: some differentiation between higher and lower performers'}
                          </p>

                          {/* Phase C: Error Pattern Analysis */}
                          {(item.dominantErrorPattern || item.instructionalRedFlags) && (
                            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Error Pattern Analysis
                              </p>
                              {item.dominantErrorPattern && (
                                <div className="rounded-lg bg-violet-50 px-3 py-2">
                                  <p className="text-xs font-medium text-violet-700">Dominant Error Pattern</p>
                                  <p className="mt-0.5 text-xs text-violet-600">{item.dominantErrorPattern}</p>
                                </div>
                              )}
                              {item.instructionalRedFlags && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2">
                                  <p className="text-xs font-medium text-amber-700">Instructional Red Flags</p>
                                  <p className="mt-0.5 text-xs text-amber-600">{item.instructionalRedFlags}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No items match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ItemAnalysisScatter ────────────────────────────────────────────────────
// Difficulty (p-value, x-axis) vs. Discrimination (y-axis) scatter plot.
// One dot per question. Flagged questions render in rose; normal in indigo.
// ReferenceLines mark p=0.20 (too hard), p=0.90 (too easy), and y=0
// (low discrimination — better students are not outperforming weaker ones).
function ItemAnalysisScatter({ items }: { items: ItemStat[] }) {
  const { normal, flagged } = useMemo(() => {
    const normalArr: Array<{ x: number; y: number; id: string }> = [];
    const flaggedArr: Array<{ x: number; y: number; id: string }> = [];
    for (const item of items) {
      if (item.attempts < 5) continue; // ignore low-volume noise
      const point = {
        x: item.pValue,
        y: item.discrimination,
        id: item.questionId,
      };
      if (item.flags.length > 0) flaggedArr.push(point);
      else normalArr.push(point);
    }
    return { normal: normalArr, flagged: flaggedArr };
  }, [items]);

  if (normal.length + flagged.length === 0) {
    return null;
  }

  return (
    <div className="editorial-surface p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Difficulty vs. Discrimination</h3>
        <span className="text-xs text-slate-500">{normal.length + flagged.length} items (≥5 attempts)</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        X = p-value (proportion correct, higher = easier). Y = discrimination index (higher = better-discriminating). Dashed lines mark flag thresholds.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 12, right: 24, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ece8df" />
          <XAxis
            type="number"
            dataKey="x"
            name="p-value"
            domain={[0, 1]}
            tickFormatter={(v) => v.toFixed(1)}
            stroke="#475569"
            fontSize={11}
            label={{ value: 'Difficulty (p) →', position: 'insideBottom', offset: -8, fill: '#94a3b8', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="discrimination"
            domain={['auto', 'auto']}
            stroke="#475569"
            fontSize={11}
            label={{ value: 'Discrimination ↑', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
          />
          <ZAxis range={[40, 40]} />
          <RechartsTooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e6dfd4',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              typeof value === 'number' ? value.toFixed(2) : String(value),
              name === 'p-value' ? 'p-value' : 'discrimination',
            ]}
          />
          <ReferenceLine x={0.2} stroke="#b45309" strokeDasharray="3 3" label={{ value: 'p=0.2', position: 'top', fill: '#b45309', fontSize: 10 }} />
          <ReferenceLine x={0.9} stroke="#b45309" strokeDasharray="3 3" label={{ value: 'p=0.9', position: 'top', fill: '#b45309', fontSize: 10 }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Scatter name="Normal" data={normal} fill="#818cf8" fillOpacity={0.7} />
          <Scatter name="Flagged" data={flagged} fill="#f43f5e" fillOpacity={0.85} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" /> Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" /> Flagged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-amber-700" /> Flag threshold (p&lt;0.2 or p&gt;0.9)
        </span>
      </div>
    </div>
  );
}
