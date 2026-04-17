import { useEffect, useState } from 'react';
import { ArrowLeft, Download, MessageSquare, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '../config/supabase';
import { ArtifactCard } from './ArtifactCard';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  user_id: string;
  title: string | null;
  session_type: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  displayName: string;
  artifactCount: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  assistant_intent: string | null;
  artifact_type: string | null;
  artifact_payload: Record<string, unknown> | null;
  quiz_question_id: string | null;
  quiz_skill_id: string | null;
  page_context: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type DateRange = '7d' | '30d' | 'all';

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

const INTENT_COLORS: Record<string, string> = {
  'quiz-request': 'bg-blue-100 text-blue-700',
  'quiz-answer': 'bg-blue-50 text-blue-600',
  'artifact-request': 'bg-purple-100 text-purple-700',
  'app-guide': 'bg-teal-100 text-teal-700',
  'hint-request': 'bg-yellow-100 text-yellow-700',
  'general': 'bg-slate-100 text-slate-600',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ChatActivityTab() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Detail view state
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Fetch session list ─────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (active) setError('Not authenticated.');
        if (active) setIsLoading(false);
        return;
      }

      const res = await fetch('/api/admin-chat-activity', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (active) setError(body.error || `HTTP ${res.status}`);
        if (active) setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (active) setSessions(data.sessions || []);
      if (active) setIsLoading(false);
    })();

    return () => { active = false; };
  }, []);

  // ─── Fetch session detail ───────────────────────────────────────────────
  async function openSession(s: SessionSummary) {
    setSelectedSession(s);
    setDetailLoading(true);
    setMessages([]);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const res = await fetch(`/api/admin-chat-activity?sessionId=${s.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
    }
    setDetailLoading(false);
  }

  // ─── CSV export ─────────────────────────────────────────────────────────
  function exportCsv() {
    const header = 'Session ID,User,Title,Type,Messages,Artifacts,Last Active,Created\n';
    const rows = filtered.map(s =>
      [s.id, s.displayName, `"${(s.title || '').replace(/"/g, '""')}"`, s.session_type, s.message_count, s.artifactCount, s.updated_at, s.created_at].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-activity-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Filter by date range ───────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    if (dateRange === 'all') return true;
    const days = dateRange === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 86400000;
    return new Date(s.updated_at).getTime() > cutoff;
  });

  // ─── Detail view ────────────────────────────────────────────────────────
  if (selectedSession) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedSession(null)}
          className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sessions
        </button>

        <div className="editorial-surface p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">
                {selectedSession.title || 'Untitled Session'}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedSession.displayName} · {selectedSession.session_type} · {formatDate(selectedSession.created_at)}
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {selectedSession.message_count} messages
            </span>
          </div>
        </div>

        {detailLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-50 border border-blue-100 ml-8'
                    : 'bg-white border border-slate-200 mr-8'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {msg.role}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.assistant_intent && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${INTENT_COLORS[msg.assistant_intent] || INTENT_COLORS.general}`}>
                        {msg.assistant_intent}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {msg.content.length > 800 ? msg.content.slice(0, 800) + '...' : msg.content}
                </div>
                {msg.artifact_type && msg.artifact_payload && (
                  <div className="mt-2">
                    <ArtifactCard type={msg.artifact_type} payload={msg.artifact_payload} />
                  </div>
                )}
                {msg.metadata && (
                  <div className="mt-1 flex gap-3 text-[10px] text-slate-400">
                    {(msg.metadata as { model?: string }).model && (
                      <span>{(msg.metadata as { model?: string }).model}</span>
                    )}
                    {(msg.metadata as { latency_ms?: number }).latency_ms && (
                      <span>{(msg.metadata as { latency_ms?: number }).latency_ms}ms</span>
                    )}
                    {(msg.metadata as { input_tokens?: number }).input_tokens && (
                      <span>{(msg.metadata as { input_tokens?: number }).input_tokens} in / {(msg.metadata as { output_tokens?: number }).output_tokens} out tokens</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Session list view ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-10 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
        <p className="mt-2 text-sm text-slate-500">Loading chat activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editorial-surface p-6 text-center">
        <p className="text-rose-600 text-sm font-medium">{error}</p>
        <p className="text-xs text-slate-500 mt-1">
          Make sure you are running <code>netlify dev</code> and SUPABASE_SERVICE_ROLE_KEY is set.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-slate-800">
            AI Tutor Sessions
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({filtered.length} sessions)
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range filter */}
          {(['7d', '30d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                dateRange === range
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range === 'all' ? 'All' : range}
            </button>
          ))}
          {/* CSV export */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      {/* Sessions table */}
      {filtered.length === 0 ? (
        <div className="editorial-surface p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">No chat sessions found.</p>
        </div>
      ) : (
        <div className="editorial-surface overflow-x-auto rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Messages</th>
                <th className="px-4 py-3 text-center">Artifacts</th>
                <th className="px-4 py-3 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr
                  key={s.id}
                  onClick={() => openSession(s)}
                  className="cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.displayName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                    {s.title || <span className="text-slate-400 italic">Untitled</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.session_type === 'page-tutor'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-teal-50 text-teal-700'
                    }`}>
                      {s.session_type === 'page-tutor' ? 'Page' : 'Float'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {s.message_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.artifactCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-purple-600">
                        <FileText className="w-3 h-3" />
                        {s.artifactCount}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {relativeTime(s.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
