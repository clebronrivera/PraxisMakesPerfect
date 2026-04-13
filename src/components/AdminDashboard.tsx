import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bug,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Shield,
  Users
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { useQuestionReports, QuestionReport } from '../hooks/useQuestionReports';
import ChatActivityTab from './ChatActivityTab';
import {
  BetaFeedback,
  BetaFeedbackStatus,
  useBetaFeedback
} from '../hooks/useBetaFeedback';
import {
  buildAuditCsv,
  buildAuditSummaryMarkdown,
  buildFeedbackAudit,
  ConsolidatedAuditIssue,
  FeedbackAuditBundle
} from '../utils/feedbackAudit';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../config/admin';
import StudentDetailDrawer from './StudentDetailDrawer';
import ItemAnalysisTab from './ItemAnalysisTab';

type AdminTab = 'overview' | 'audit' | 'feedback' | 'reports' | 'users' | 'item-analysis' | 'chat-activity';

interface LastSession {
  sessionId: string;
  mode: string;
  questionIndex: number;
  elapsedSeconds: number;
  updatedAt: string;
}

interface UserAnalyticsDoc {
  id: string;
  totalQuestionsSeen?: number;
  practiceResponseCount?: number;
  screenerComplete?: boolean;
  diagnosticComplete?: boolean;
  fullAssessmentComplete?: boolean;
  lastUpdated?: string | Date | null;
  flaggedQuestions?: Record<string, string>;
  lastSession?: LastSession | null;
  avgTimePerQuestionSeconds?: number | null;
  authMetrics?: {
    email?: string | null;
    displayName?: string | null;
    loginCount?: number;
    createdAt?: string | Date | null;
    lastLoginAt?: string | Date | null;
    lastActiveAt?: string | Date | null;
  };
}

interface OverviewStats {
  totalUsers: number;
  newUsers7d: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalLoginEvents: number;
  totalQuestionsSeen: number;
  practiceUsers: number;
  screenerUsers: number;
  assessmentUsers: number;
  inProgressSessions: number;
  potentialDrops: number;
  avgTimePerQuestion: number | null;
  feedbackOpen: number;
  reportsOpen: number;
  criticalReports: number;
}

const FEEDBACK_STATUS_OPTIONS: BetaFeedbackStatus[] = [
  'new',
  'reviewing',
  'planned',
  'resolved',
  'closed'
];

const REPORT_STATUS_OPTIONS: QuestionReport['status'][] = [
  'open',
  'triaged',
  'fixed',
  'wont-fix'
];

function toMillis(value: string | number | Date | null | undefined): number | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return new Date(value).getTime();
}

function formatDate(value: string | number | Date | null | undefined): string {
  const millis = toMillis(value);
  if (!millis) {
    return 'Unknown';
  }
  return new Date(millis).toLocaleString();
}

const ASSESSMENT_MODES = new Set(['screener', 'full_assessment', 'adaptive_diagnostic']);
const DROP_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

function isInProgress(user: UserAnalyticsDoc): boolean {
  const ls = user.lastSession;
  if (!ls || !ASSESSMENT_MODES.has(ls.mode)) return false;
  if (ls.mode === 'screener' && user.screenerComplete) return false;
  if (ls.mode === 'full_assessment' && user.fullAssessmentComplete) return false;
  if (ls.mode === 'adaptive_diagnostic' && user.diagnosticComplete) return false;
  return true;
}

function isDropped(user: UserAnalyticsDoc): boolean {
  if (!isInProgress(user)) return false;
  const updatedAt = user.lastSession?.updatedAt;
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() > DROP_THRESHOLD_MS;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffH = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function formatAvgTime(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  return `${seconds}s`;
}

function getActivityTimestamp(user: UserAnalyticsDoc): number | null {
  return (
    toMillis(user.authMetrics?.lastLoginAt) ??
    toMillis(user.authMetrics?.lastActiveAt) ??
    toMillis(user.lastUpdated)
  );
}

function getCreatedTimestamp(user: UserAnalyticsDoc): number | null {
  return toMillis(user.authMetrics?.createdAt) ?? toMillis(user.lastUpdated);
}

interface AdminDashboardProps {
  onExit: () => void;
  returnLabel?: string;
  onGoHome: () => void;
  onStartPractice: () => void;
  onGoTeach: () => void;
}

export default function AdminDashboard({
  onExit,
  returnLabel = 'Return to site',
  onGoHome,
  onStartPractice,
  onGoTeach
}: AdminDashboardProps) {
  const { user } = useAuth();
  const { getAllReports, updateReportStatus } = useQuestionReports();
  const { getAllFeedback, updateFeedbackStatus } = useBetaFeedback();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserAnalyticsDoc[]>([]);
  const [reports, setReports] = useState<(QuestionReport & { id: string })[]>([]);
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [auditBundle, setAuditBundle] = useState<FeedbackAuditBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<UserAnalyticsDoc | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!user || !isAdminEmail(user.email)) {
      return;
    }

    setIsRefreshing(true);
    try {
      // Fetch users via admin API (bypasses RLS — anon key only sees own row)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      interface UserRow {
        user_id: string;
        total_questions_seen?: number;
        practice_response_count?: number;
        screener_complete?: boolean;
        diagnostic_complete?: boolean;
        full_assessment_complete?: boolean;
        updated_at?: string | Date | null;
        flagged_questions?: Record<string, string>;
        last_session?: LastSession | null;
        email?: string | null;
        display_name?: string | null;
        login_count?: number;
        created_at?: string | Date | null;
        last_login_at?: string | Date | null;
        last_active_at?: string | Date | null;
      }
      let usersData: UserRow[] = [];
      let timingStats: Record<string, number> = {};
      if (token) {
        try {
          const res = await fetch('/api/admin-list-users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const body = await res.json();
            usersData = body.users || [];
            timingStats = body.timingStats || {};
          } else {
            console.warn('[AdminDashboard] admin-list-users returned', res.status, '— falling back to client query');
            const { data } = await supabase.from('user_progress').select('*');
            usersData = data || [];
          }
        } catch {
          // Fallback for local dev without Netlify functions
          const { data } = await supabase.from('user_progress').select('*');
          usersData = data || [];
        }
      }

      const [allReports, allFeedback] = await Promise.all([
        getAllReports(),
        getAllFeedback()
      ]);

      const allUsers: UserAnalyticsDoc[] = (usersData || []).map((row: UserRow) => ({
        id: row.user_id,
        totalQuestionsSeen: row.total_questions_seen,
        practiceResponseCount: row.practice_response_count,
        screenerComplete: row.screener_complete,
        diagnosticComplete: row.diagnostic_complete,
        fullAssessmentComplete: row.full_assessment_complete,
        lastUpdated: row.updated_at,
        flaggedQuestions: row.flagged_questions || {},
        lastSession: row.last_session ?? null,
        avgTimePerQuestionSeconds: timingStats[row.user_id] ?? null,
        authMetrics: {
          email: row.email,
          displayName: row.display_name,
          loginCount: row.login_count,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
          lastActiveAt: row.last_active_at
        }
      }));

      allUsers.sort((a, b) => (getActivityTimestamp(b) ?? 0) - (getActivityTimestamp(a) ?? 0));

      setUsers(allUsers);
      setReports(allReports);
      setFeedback(allFeedback);
    } catch (error) {
      console.error('[AdminDashboard] Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getAllFeedback, getAllReports, user]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const runAssessmentReset = useCallback(
    async (targetUserId: string, scope: 'screener' | 'full_diagnostic') => {
      const label =
        scope === 'screener'
          ? 'baseline assessment (all baseline screener responses will be archived, then deleted)'
          : 'adaptive diagnostic (all diagnostic responses will be archived, then deleted)';
      if (
        !window.confirm(
          `Reset ${label} for this learner?\n\nA row will be saved to assessment_reset_archive with their prior responses and profile snapshot. Practice data is not removed.`
        )
      ) {
        return;
      }

      setResetNotice(null);
      setResettingUserId(targetUserId);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setResetNotice({ tone: 'err', text: 'No active session — sign in again.' });
          return;
        }

        const res = await fetch('/api/admin-reset-assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ targetUserId, scope })
        });

        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          deletedResponseCount?: number;
          detail?: string;
        };

        if (!res.ok) {
          throw new Error(body.error || body.detail || res.statusText || 'Request failed');
        }

        setResetNotice({
          tone: 'ok',
          text: `Reset complete — removed ${body.deletedResponseCount ?? 0} response row(s); aggregates rebuilt from remaining data.`
        });
        await loadAdminData();
      } catch (err) {
        setResetNotice({
          tone: 'err',
          text: err instanceof Error ? err.message : String(err)
        });
      } finally {
        setResettingUserId(null);
      }
    },
    [loadAdminData]
  );

  const runDeleteUser = useCallback(
    async (targetUserId: string, userLabel: string) => {
      if (
        !window.confirm(
          `DELETE ALL DATA for "${userLabel}"?\n\nThis removes responses, progress, study plans, module tracking, feedback, and reports. The auth account will remain (delete it from Supabase Dashboard).\n\nThis cannot be undone.`
        )
      ) {
        return;
      }

      setResetNotice(null);
      setResettingUserId(targetUserId);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setResetNotice({ tone: 'err', text: 'No active session — sign in again.' });
          return;
        }

        const res = await fetch('/api/admin-delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ targetUserId })
        });

        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          totalDeletedRows?: number;
          note?: string;
        };

        if (!res.ok) {
          throw new Error(body.error || res.statusText || 'Request failed');
        }

        setResetNotice({
          tone: 'ok',
          text: `Deleted ${body.totalDeletedRows ?? 0} row(s) across all tables. ${body.note ?? ''}`
        });
        await loadAdminData();
      } catch (err) {
        setResetNotice({
          tone: 'err',
          text: err instanceof Error ? err.message : String(err)
        });
      } finally {
        setResettingUserId(null);
      }
    },
    [loadAdminData]
  );

  const overview = useMemo<OverviewStats>(() => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    const usersWithTime = users.filter((u) => u.avgTimePerQuestionSeconds != null);
    const avgTimePerQuestion = usersWithTime.length > 0
      ? Math.round(usersWithTime.reduce((sum, u) => sum + (u.avgTimePerQuestionSeconds ?? 0), 0) / usersWithTime.length)
      : null;

    return {
      totalUsers: users.length,
      newUsers7d: users.filter((entry) => {
        const createdAt = getCreatedTimestamp(entry);
        return createdAt !== null && createdAt >= sevenDaysAgo;
      }).length,
      activeUsers24h: users.filter((entry) => {
        const lastSeen = getActivityTimestamp(entry);
        return lastSeen !== null && lastSeen >= oneDayAgo;
      }).length,
      activeUsers7d: users.filter((entry) => {
        const lastSeen = getActivityTimestamp(entry);
        return lastSeen !== null && lastSeen >= sevenDaysAgo;
      }).length,
      totalLoginEvents: users.reduce((sum, entry) => sum + (entry.authMetrics?.loginCount ?? 0), 0),
      totalQuestionsSeen: users.reduce((sum, entry) => sum + (entry.totalQuestionsSeen ?? 0), 0),
      practiceUsers: users.filter((entry) => (entry.practiceResponseCount ?? 0) > 0).length,
      screenerUsers: users.filter((entry) => Boolean(entry.screenerComplete)).length,
      assessmentUsers: users.filter((entry) => Boolean(entry.diagnosticComplete || entry.fullAssessmentComplete)).length,
      inProgressSessions: users.filter(isInProgress).length,
      potentialDrops: users.filter(isDropped).length,
      avgTimePerQuestion,
      feedbackOpen: feedback.filter((item) => ['new', 'reviewing', 'planned'].includes(item.status)).length,
      reportsOpen: reports.filter((item) => ['open', 'triaged'].includes(item.status)).length,
      criticalReports: reports.filter((item) => item.severity === 'critical' && item.status !== 'fixed').length
    };
  }, [feedback, reports, users]);

  const recentUsers = useMemo(
    () => users.slice(0, 8),
    [users]
  );

  const recentFeedback = useMemo(
    () => feedback.slice(0, 8),
    [feedback]
  );

  const recentReports = useMemo(
    () => reports.slice(0, 8),
    [reports]
  );

  useEffect(() => {
    let active = true;
    setIsAuditLoading(true);

    buildFeedbackAudit({
      reports,
      feedback,
      users
    })
      .then((bundle) => {
        if (!active) {
          return;
        }
        setAuditBundle(bundle);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error('[AdminDashboard] Failed to build feedback audit:', error);
        setAuditBundle(null);
      })
      .finally(() => {
        if (active) {
          setIsAuditLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [feedback, reports, users]);

  const handleFeedbackStatusChange = async (feedbackId: string, status: BetaFeedbackStatus) => {
    await updateFeedbackStatus(feedbackId, status);
    setFeedback((current) => current.map((item) => (
      item.id === feedbackId ? { ...item, status } : item
    )));
  };

  const handleReportStatusChange = async (
    reportId: string,
    status: QuestionReport['status']
  ) => {
    await updateReportStatus(reportId, status);
    setReports((current) => current.map((item) => (
      item.id === reportId ? { ...item, status } : item
    )));
  };

  const downloadBlob = useCallback((filename: string, contents: string, mimeType: string) => {
    const blob = new Blob([contents], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <Shield className="mx-auto mb-3 h-10 w-10 text-rose-500" />
        <h2 className="text-2xl font-semibold text-rose-800">Admin access required</h2>
        <p className="mt-2 text-sm text-rose-700">
          This page is restricted to the configured admin account.
        </p>
        <button
          onClick={onExit}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {returnLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="editorial-surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3 text-amber-700">
            <Shield className="h-8 w-8" />
            <h2 className="text-2xl font-bold text-slate-900">Beta Admin Dashboard</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Monitor beta usage, review tester feedback, and triage question issues from one place.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadAdminData}
            className="editorial-button-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onExit}
            className="editorial-button-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {returnLabel}
          </button>
        </div>
      </div>

      <div className="editorial-surface-soft rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Testing Shortcuts</p>
            <p className="mt-2 text-sm text-slate-600">
              Jump back into the app instantly while staying signed in as admin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGoHome}
              className="editorial-button-secondary"
            >
              Home
            </button>
            <button
              onClick={onStartPractice}
              className="editorial-button-primary"
            >
              Test Practice
            </button>
            <button
              onClick={onGoTeach}
              className="editorial-button-secondary"
            >
              Teach Mode
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {([
          ['overview', 'Overview'],
          ['audit', 'Audit'],
          ['feedback', 'Beta Feedback'],
          ['reports', 'Question Reports'],
          ['users', 'Users'],
          ['item-analysis', 'Item Analysis'],
          ['chat-activity', 'AI Tutor']
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-900 shadow-md'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="editorial-surface p-10 text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-500">Loading admin data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  icon={<Users className="h-5 w-5" />}
                  label="Total Users"
                  value={overview.totalUsers}
                  detail={`${overview.newUsers7d} new in 7 days`}
                />
                <MetricCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Active Users"
                  value={overview.activeUsers24h}
                  detail={`${overview.activeUsers7d} active in 7 days`}
                />
                <MetricCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="Login Events"
                  value={overview.totalLoginEvents}
                  detail={`${overview.totalQuestionsSeen} total questions seen`}
                />
                <MetricCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Avg Q Time"
                  value={overview.avgTimePerQuestion ?? 0}
                  detail={overview.avgTimePerQuestion != null ? 'seconds per question (global avg)' : 'no timing data yet'}
                  valueFormatter={(v) => v > 0 ? `${v}s` : '—'}
                />
                <MetricCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Open Content Queue"
                  value={overview.reportsOpen + overview.feedbackOpen}
                  detail={`${overview.criticalReports} critical reports`}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <section className="editorial-surface p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Adoption Snapshot</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatLine label="Completed screener" value={overview.screenerUsers} />
                    <StatLine label="Reached assessment beyond screener" value={overview.assessmentUsers} />
                    <StatLine label="Used practice mode" value={overview.practiceUsers} />
                    <StatLine label="In-progress assessments" value={overview.inProgressSessions} />
                    <StatLine label="Potential drops (4h+)" value={overview.potentialDrops} />
                    <StatLine label="Open beta feedback" value={overview.feedbackOpen} />
                    <StatLine label="Open question reports" value={overview.reportsOpen} />
                    <StatLine label="Critical content reports" value={overview.criticalReports} />
                  </div>
                </section>

                <section className="editorial-surface p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentUsers.length === 0 && (
                      <p className="text-sm text-slate-500">No users found yet.</p>
                    )}
                    {recentUsers.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {entry.authMetrics?.displayName || entry.authMetrics?.email || entry.id}
                            </p>
                            <p className="text-sm text-slate-500">
                              {entry.authMetrics?.email || 'No email on record'}
                            </p>
                          </div>
                          <div className="text-right text-sm text-slate-400">
                            <p>{entry.authMetrics?.loginCount ?? 0} sessions</p>
                            <p>{formatDate(entry.authMetrics?.lastLoginAt || entry.lastUpdated)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <QueuePanel
                  icon={<MessageSquare className="h-5 w-5 text-amber-700" />}
                  title="Latest Beta Feedback"
                  items={recentFeedback.map((item) => ({
                    id: item.id || item.userId,
                    title: item.featureArea || item.category,
                    meta: `${item.userEmail || item.userId} • ${formatDate(item.createdAt)}`,
                    body: item.message
                  }))}
                  emptyLabel="No beta feedback yet."
                />
                <QueuePanel
                  icon={<ClipboardList className="h-5 w-5 text-amber-700" />}
                  title="Latest Question Reports"
                  items={recentReports.map((item) => ({
                    id: item.id || item.questionId,
                    title: `${item.questionId} • ${item.severity}`,
                    meta: `${item.userEmail || item.userId} • ${formatDate(item.createdAt)}`,
                    body: item.notes || item.issueTypes.join(', ')
                  }))}
                  emptyLabel="No question reports yet."
                />
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            auditBundle ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Feedback Audit</p>
                      <p className="mt-2 text-sm text-emerald-700">
                        Consolidates live `question_reports`, `beta_feedback`, and Teach Mode `flagged_questions` into one audit view with snapshot comparison against the current bundled question bank.
                      </p>
                      <p className="mt-2 text-xs text-emerald-600">
                        Generated: {formatDate(auditBundle.generatedAt)} • Window: {auditBundle.auditWindow.firstSeenAt ? formatDate(auditBundle.auditWindow.firstSeenAt) : 'Unknown'} to {auditBundle.auditWindow.lastSeenAt ? formatDate(auditBundle.auditWindow.lastSeenAt) : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => downloadBlob(`feedback-audit-${auditBundle.generatedAt}.json`, JSON.stringify(auditBundle, null, 2), 'application/json')}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
                      >
                        <Download className="h-4 w-4" />
                        Download JSON
                      </button>
                      <button
                        onClick={() => downloadBlob(`feedback-audit-${auditBundle.generatedAt}.csv`, buildAuditCsv(auditBundle.consolidatedIssues), 'text/csv;charset=utf-8')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300"
                      >
                        <Download className="h-4 w-4" />
                        Download CSV
                      </button>
                      <button
                        onClick={() => downloadBlob(`feedback-audit-summary-${auditBundle.generatedAt}.md`, buildAuditSummaryMarkdown(auditBundle), 'text/markdown;charset=utf-8')}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
                      >
                        <Download className="h-4 w-4" />
                        Download Summary
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    icon={<ClipboardList className="h-5 w-5" />}
                    label="Consolidated Issues"
                    value={auditBundle.summary.totalConsolidatedIssues}
                    detail={`${auditBundle.rawRecords.length} raw records in audit window`}
                  />
                  <MetricCard
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label="Still Present"
                    value={auditBundle.summary.verificationCounts['still present']}
                    detail={`${auditBundle.summary.verificationCounts['cannot verify from current evidence']} need manual verification`}
                  />
                  <MetricCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label="Likely Resolved"
                    value={auditBundle.summary.verificationCounts['likely already resolved']}
                    detail={`${auditBundle.summary.verificationCounts['non-actionable / too vague']} low-signal items`}
                  />
                  <MetricCard
                    icon={<MessageSquare className="h-5 w-5" />}
                    label="Question Reports"
                    value={auditBundle.summary.sourceCounts.question_reports}
                    detail="flagged by users"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="editorial-surface p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Top Themes</h3>
                    <div className="space-y-3">
                      {auditBundle.summary.topThemes.map((theme) => (
                        <div key={theme.bucket} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-slate-800">{theme.bucket}</p>
                            <span className="text-sm font-semibold text-amber-700">{theme.count}</span>
                          </div>
                        </div>
                      ))}
                      {auditBundle.summary.topThemes.length === 0 && (
                        <p className="text-sm text-slate-500">No audit issues yet.</p>
                      )}
                    </div>
                  </section>

                  <section className="editorial-surface p-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Top Recurring Questions</h3>
                    <div className="space-y-3">
                      {auditBundle.summary.topRecurringQuestions.map((item) => (
                        <div key={item.questionId} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{item.questionId}</p>
                            <span className="text-sm font-semibold text-amber-700">{item.count}</span>
                          </div>
                        </div>
                      ))}
                      {auditBundle.summary.topRecurringQuestions.length === 0 && (
                        <p className="text-sm text-slate-500">No recurring question ids in the current audit window.</p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <AuditIssuePanel
                    title="Unresolved Highlights"
                    emptyLabel="No issues currently classified as still present."
                    issues={auditBundle.summary.unresolvedHighlights}
                  />
                  <AuditIssuePanel
                    title="Likely Resolved Highlights"
                    emptyLabel="No issues currently classified as likely resolved."
                    issues={auditBundle.summary.likelyResolvedHighlights}
                  />
                </div>

                <section className="editorial-surface p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Instrumentation Gaps</h3>
                  <div className="space-y-3">
                    {auditBundle.summary.instrumentationGaps.map((gap) => (
                      <div key={gap} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4 text-sm text-slate-700">
                        {gap}
                      </div>
                    ))}
                    {auditBundle.summary.instrumentationGaps.length === 0 && (
                      <p className="text-sm text-slate-500">No obvious instrumentation gaps detected from the current dataset.</p>
                    )}
                  </div>
                </section>

                <section className="editorial-surface">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">Row-Level Audit Table</h3>
                    <p className="text-sm text-slate-400">
                      One row per consolidated issue cluster. Use the CSV export for spreadsheet work.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Issue</th>
                          <th className="px-6 py-4">Bucket</th>
                          <th className="px-6 py-4">Counts</th>
                          <th className="px-6 py-4">Verification</th>
                          <th className="px-6 py-4">Signals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 text-sm">
                        {auditBundle.consolidatedIssues.map((issue) => (
                          <tr key={issue.issueId} className="align-top text-slate-700">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{issue.questionId || issue.issueId}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {issue.sourceTypes.join(', ')}
                                {issue.displayAssessmentTypes.length > 0 && ` • ${issue.displayAssessmentTypes.join(', ')}`}
                              </p>
                              {issue.representativeNotes.length > 0 && (
                                <p className="mt-2 text-slate-700">{issue.representativeNotes[0]}</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <DecisionPill label={issue.bucket} tone="info" />
                                {issue.highestSeverity && (
                                  <DecisionPill label={issue.highestSeverity} tone={issue.highestSeverity === 'critical' ? 'danger' : issue.highestSeverity === 'major' ? 'warn' : 'neutral'} />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-800">
                              <p>{issue.reportCount} records</p>
                              <p className="text-slate-500">{issue.uniqueReporterCount} reporters</p>
                              <p className="mt-2 text-xs text-slate-500">
                                {issue.firstSeenAt ? formatDate(issue.firstSeenAt) : 'Unknown'} to {issue.lastSeenAt ? formatDate(issue.lastSeenAt) : 'Unknown'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <DecisionPill
                                label={issue.verificationDecision}
                                tone={issue.verificationDecision === 'still present'
                                  ? 'danger'
                                  : issue.verificationDecision === 'likely already resolved'
                                    ? 'success'
                                    : issue.verificationDecision === 'non-actionable / too vague'
                                      ? 'neutral'
                                      : 'warn'}
                              />
                              <p className="mt-3 text-sm text-slate-700">{issue.verificationReason}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-700">
                              <p>Snapshot changed: {issue.snapshotChanged ? 'Yes' : 'No'}</p>
                              <p>Current question: {issue.currentQuestionExists ? 'Present' : 'Missing'}</p>
                              {issue.changedFields.length > 0 && (
                                <p className="mt-2 text-xs text-slate-500">Changed: {issue.changedFields.join(', ')}</p>
                              )}
                              {issue.exactDuplicateStemCount > 1 && (
                                <p className="mt-2 text-xs text-slate-500">Duplicate stems: {issue.exactDuplicateStemCount}</p>
                              )}
                            </td>
                          </tr>
                        ))}
                        {auditBundle.consolidatedIssues.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                              No audit records available yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : (
              <div className="editorial-surface p-10 text-center">
                <RefreshCw className={`mx-auto mb-3 h-8 w-8 text-amber-700 ${isAuditLoading ? 'animate-spin' : ''}`} />
                <p className="text-slate-700">
                  {isAuditLoading ? 'Building audit from live feedback and the bundled question bank...' : 'Audit data is unavailable right now.'}
                </p>
              </div>
            )
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedback.length === 0 && (
                <EmptyPanel
                  icon={<MessageSquare className="h-8 w-8 text-slate-500" />}
                  title="No beta feedback yet"
                  description="General tester feedback will appear here once users start submitting it."
                />
              )}
              {feedback.map((item) => (
                <div key={item.id} className="editorial-surface p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                          {item.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {item.contextType}
                        </span>
                        {item.featureArea && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {item.featureArea}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {item.userDisplayName || item.userEmail || item.userId} • {formatDate(item.createdAt)}
                      </p>
                      <p className="text-slate-900">{item.message}</p>
                      {item.page && (
                        <p className="text-sm text-slate-500">Page: {item.page}</p>
                      )}
                    </div>

                    {item.id && (
                      <label className="block min-w-[170px] text-sm text-slate-400">
                        Status
                        <select
                          value={item.status}
                          onChange={(event) => handleFeedbackStatusChange(item.id!, event.target.value as BetaFeedbackStatus)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-amber-300"
                        >
                          {FEEDBACK_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 && (
                <EmptyPanel
                  icon={<Bug className="h-8 w-8 text-slate-500" />}
                  title="No question reports yet"
                  description="Question-specific reports from the assessment UI will appear here."
                />
              )}
              {reports.map((item) => (
                <div key={item.id} className="editorial-surface p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          item.severity === 'critical'
                            ? 'bg-rose-50 text-rose-700'
                            : item.severity === 'major'
                              ? 'bg-amber-500/15 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.severity}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {item.assessmentType}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {item.questionId}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {item.userDisplayName || item.userEmail || item.userId} • {formatDate(item.createdAt)}
                      </p>
                      <p className="text-sm text-slate-700">
                        Targets: {item.targets.join(', ')}
                      </p>
                      <p className="text-sm text-slate-700">
                        Issue types: {item.issueTypes.join(', ')}
                      </p>
                      {item.notes && (
                        <p className="text-slate-900">{item.notes}</p>
                      )}
                      {item.questionSnapshot?.stem && (
                        <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
                          <p className="line-clamp-3 text-sm text-slate-400">
                            {item.questionSnapshot.stem}
                          </p>
                        </div>
                      )}
                    </div>

                    {item.id && (
                      <label className="block min-w-[170px] text-sm text-slate-400">
                        Status
                        <select
                          value={item.status}
                          onChange={(event) => handleReportStatusChange(item.id!, event.target.value as QuestionReport['status'])}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-white px-3 py-2 text-slate-900 outline-none focus:border-amber-300"
                        >
                          {REPORT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="editorial-surface">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">User Usage</h3>
                <p className="text-sm text-slate-400">
                  Login counts are tracked as authenticated app sessions for beta analytics. Use the actions column to
                  archive and clear screener or full/diagnostic data for a learner (requires{' '}
                  <code className="rounded bg-slate-100 px-1 text-xs text-amber-600">SUPABASE_SERVICE_ROLE_KEY</code> on
                  Netlify for the admin-reset API).
                </p>
                {resetNotice && (
                  <p
                    className={`mt-3 text-sm ${
                      resetNotice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {resetNotice.text}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4">Logins</th>
                      <th className="px-6 py-4">Qs Seen</th>
                      <th className="px-6 py-4">Avg Q Time</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-sm">
                    {users.map((entry) => (
                      <tr
                        key={entry.id}
                        className="align-top text-slate-700 cursor-pointer hover:bg-amber-50/40 transition-colors"
                        onClick={() => setSelectedStudent(entry)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-slate-900">
                                {entry.authMetrics?.displayName || entry.authMetrics?.email || entry.id}
                              </p>
                              <p className="text-slate-500">
                                {entry.authMetrics?.email || 'No email'}
                              </p>
                              <p className="mt-1 font-mono text-xs text-slate-600">{entry.id}</p>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(entry.authMetrics?.createdAt || entry.lastUpdated)}</td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(entry.authMetrics?.lastLoginAt || entry.lastUpdated)}</td>
                        <td className="px-6 py-4 text-slate-900">{entry.authMetrics?.loginCount ?? 0}</td>
                        <td className="px-6 py-4 text-slate-900">{entry.totalQuestionsSeen ?? 0}</td>
                        <td className="px-6 py-4 text-slate-900 font-mono">{formatAvgTime(entry.avgTimePerQuestionSeconds)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {entry.screenerComplete && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">Screener</span>
                            )}
                            {entry.fullAssessmentComplete && (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Full assessment</span>
                            )}
                            {entry.diagnosticComplete && !entry.fullAssessmentComplete && (
                              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700">Archived assessment</span>
                            )}
                            {(entry.practiceResponseCount ?? 0) > 0 && (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                                Practice {entry.practiceResponseCount}
                              </span>
                            )}
                            {isDropped(entry) && entry.lastSession && (
                              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                                Dropped Q{entry.lastSession.questionIndex} ({formatRelativeTime(entry.lastSession.updatedAt)})
                              </span>
                            )}
                            {isInProgress(entry) && !isDropped(entry) && entry.lastSession && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
                                In Progress Q{entry.lastSession.questionIndex} · {entry.lastSession.mode}
                              </span>
                            )}
                            {!entry.screenerComplete && !entry.diagnosticComplete && !entry.fullAssessmentComplete && (entry.practiceResponseCount ?? 0) === 0 && !isInProgress(entry) && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-400">Not started</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              disabled={resettingUserId === entry.id}
                              onClick={() => void runAssessmentReset(entry.id, 'screener')}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset baseline
                            </button>
                            <button
                              type="button"
                              disabled={resettingUserId === entry.id}
                              onClick={() => void runAssessmentReset(entry.id, 'full_diagnostic')}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset diagnostic
                            </button>
                            <div className="mt-2 border-t border-slate-200 pt-2">
                              <button
                                type="button"
                                disabled={resettingUserId === entry.id}
                                onClick={() => void runDeleteUser(
                                  entry.id,
                                  entry.authMetrics?.email || entry.authMetrics?.displayName || entry.id
                                )}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Delete all data
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'item-analysis' && (
            <ItemAnalysisTab />
          )}
          {activeTab === 'chat-activity' && (
            <ChatActivityTab />
          )}
        </>
      )}

      {selectedStudent && (
        <StudentDetailDrawer
          user={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  valueFormatter
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <div className="editorial-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-2xl bg-slate-100 p-3 text-amber-700">{icon}</span>
        <p className="text-3xl font-bold text-slate-900">{valueFormatter ? valueFormatter(value) : value}</p>
      </div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QueuePanel({
  icon,
  title,
  items,
  emptyLabel
}: {
  icon: ReactNode;
  title: string;
  items: Array<{ id: string; title: string; meta: string; body: string }>;
  emptyLabel: string;
}) {
  return (
    <section className="editorial-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-slate-900">{item.title}</p>
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-600" />
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
            <p className="mt-3 line-clamp-3 text-sm text-slate-700">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionPill({
  label,
  tone
}: {
  label: string;
  tone: 'info' | 'success' | 'warn' | 'danger' | 'neutral';
}) {
  const styles = {
    info: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    neutral: 'bg-slate-100 text-slate-500'
  } as const;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[tone]}`}>
      {label}
    </span>
  );
}

function AuditIssuePanel({
  title,
  issues,
  emptyLabel
}: {
  title: string;
  issues: ConsolidatedAuditIssue[];
  emptyLabel: string;
}) {
  return (
    <section className="editorial-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.issueId} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{issue.questionId || issue.issueId}</p>
                <p className="mt-1 text-sm text-slate-400">{issue.bucket}</p>
              </div>
              <span className="text-sm font-semibold text-slate-800">{issue.reportCount}</span>
            </div>
            <p className="mt-3 text-sm text-slate-700">{issue.verificationReason}</p>
          </div>
        ))}
        {issues.length === 0 && (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

function EmptyPanel({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="editorial-surface p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
