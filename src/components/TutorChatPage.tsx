// src/components/TutorChatPage.tsx
// Full-page AI Tutor — atelier 3-column workspace:
//   sessions · conversation · grounding rail
// Requires diagnosticComplete (enforced in App.tsx gating).

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Plus, Send, ChevronUp, Paperclip } from 'lucide-react';
import { useTutorChat } from '../hooks/useTutorChat';
import { TutorMessageBubble } from './TutorMessageBubble';
import { TutorEmptyState } from './TutorEmptyState';

interface TutorChatPageProps {
  userId: string;
  diagnosticComplete: boolean;
  emergingSkillsCount?: number;
  emergingSkills?: { skillId: string; skillName: string; domainId: number; proficiency: 'emerging'; accuracy: number | null; attempts: number; trend: 'improving' | 'declining' | 'stable' | 'unknown'; isTentative: boolean }[];
  approachingSkills?: { skillId: string; skillName: string; domainId: number; accuracy: number | null; attempts: number }[];
}

export function TutorChatPage({
  userId,
  diagnosticComplete,
  emergingSkills = [],
  approachingSkills: _approachingSkills = [],
}: TutorChatPageProps) {
  const chat = useTutorChat({ userId, sessionType: 'page-tutor' });
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || chat.isSending) return;
    setInput('');
    await chat.sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUp = (text: string) => {
    if (chat.isSending) return;
    chat.sendMessage(text);
  };

  const handleSubmitQuizAnswer = (questionId: string, selectedAnswers: string[]) => {
    chat.submitQuizAnswer(questionId, selectedAnswers);
  };

  // Derived state for the grounding rail ────────────────────────────────────
  const activeSession = useMemo(
    () => chat.sessions.find(s => s.id === chat.activeSessionId) ?? null,
    [chat.sessions, chat.activeSessionId]
  );

  const artifactsInSession = useMemo(
    () => chat.messages.filter(m => m.artifactType && m.artifactPayload),
    [chat.messages]
  );

  const quizItemsInSession = useMemo(
    () => chat.messages.filter(m => m.quizQuestion).length,
    [chat.messages]
  );

  // Find latest assistant message for suggested chips
  const latestAssistantIdx = chat.messages.reduce<number>(
    (acc, m, i) => m.role === 'assistant' ? i : acc,
    -1
  );

  return (
    <div className="flex h-full min-h-0 text-slate-200" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══════ LEFT: sessions ══════ */}
      <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col bg-[rgba(6,13,26,0.45)] backdrop-blur-md">
        <div className="p-4 flex items-center justify-between">
          <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400">Sessions</p>
          <button
            onClick={chat.startNewSession}
            title="New chat"
            className="w-7 h-7 rounded-full border border-white/15 text-white flex items-center justify-center hover:border-[color:var(--d1-peach)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-4 pb-3">
          <div className="flex p-0.5 rounded-full border border-white/10 bg-[rgba(6,13,26,0.6)]">
            <button
              onClick={() => chat.setMode('chat')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                chat.mode === 'chat'
                  ? 'bg-gradient-to-br from-[#fde4c1] to-[#fbcfe8] text-[#1e1b3a] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => chat.setMode('quiz')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                chat.mode === 'quiz'
                  ? 'bg-gradient-to-br from-[#fde4c1] to-[#fbcfe8] text-[#1e1b3a] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quiz
            </button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {chat.sessions.map(session => {
            const isActive = session.id === chat.activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => chat.selectSession(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors border ${
                  isActive
                    ? 'bg-[rgba(252,213,180,0.08)] border-[rgba(252,213,180,0.25)]'
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <p className={`text-[12px] font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {session.title || 'Untitled chat'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {session.messageCount} {session.messageCount === 1 ? 'message' : 'messages'}
                </p>
              </button>
            );
          })}

          {chat.sessions.length === 0 && (
            <p className="text-[11px] text-slate-500 px-3 py-6 text-center">No chats yet</p>
          )}
        </div>
      </aside>

      {/* ══════ CENTER: conversation ══════ */}
      <section className="flex-1 flex flex-col min-h-0 relative z-10">

        {/* Header */}
        <header className="glass mx-4 mt-4 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
          <div className="mini-orb" style={{ width: 28, height: 28 }} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">
              {activeSession?.title || 'Ask anything, get quizzed'}
            </p>
            <p className="text-[11px] text-slate-500">
              AI Tutor · Praxis 5403 · {chat.mode === 'quiz' ? 'Quiz mode' : 'Chat mode'}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {chat.isHydratingSession && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--d1-peach)] border-t-transparent" />
            </div>
          )}

          {chat.hasOlderMessages && !chat.isHydratingSession && (
            <button
              onClick={chat.loadOlderMessages}
              className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-200 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)] rounded"
            >
              <ChevronUp className="w-3 h-3" />
              Load older messages
            </button>
          )}

          {chat.messages.length === 0 && !chat.isHydratingSession && (
            <TutorEmptyState
              sessionType="page-tutor"
              diagnosticComplete={diagnosticComplete}
              emergingSkills={emergingSkills}
              onSelect={handleFollowUp}
              disabled={chat.isSending}
            />
          )}

          {chat.messages.map((message, idx) => (
            <TutorMessageBubble
              key={message.id}
              message={message}
              isLatest={idx === latestAssistantIdx}
              suggestedFollowUps={idx === latestAssistantIdx ? (message.suggestedFollowUps || []) : []}
              onFollowUp={handleFollowUp}
              onSubmitQuizAnswer={handleSubmitQuizAnswer}
              isSending={chat.isSending}
            />
          ))}

          {chat.isSending && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[color:var(--d1-peach)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[color:var(--accent-rose)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[color:var(--d4-lavender)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs">Tutor is thinking…</span>
            </div>
          )}

          {chat.error && (
            <div className="text-[11px] text-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/10 border border-[color:var(--accent-rose)]/30 rounded-lg px-3 py-2">
              {chat.error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="flex items-end gap-3 p-3.5 rounded-2xl bg-[rgba(6,13,26,0.85)] border border-white/12 focus-within:border-[color:var(--d1-peach)]/50 focus-within:ring-2 focus-within:ring-[color:var(--d1-peach)]/20 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chat.mode === 'quiz' ? 'Type "quiz me" or ask a question…' : 'Ask anything about this skill, or tell me how to quiz you…'}
              rows={1}
              disabled={chat.isSending}
              className="flex-1 resize-none bg-transparent border-0 outline-none text-slate-100 text-[13.5px] font-[inherit] placeholder:text-slate-500 min-h-[22px] leading-[1.5] p-0"
              style={{ maxHeight: '180px', overflowY: 'auto' }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Attach context"
                className="btn-ghost-atelier"
                style={{ padding: '8px 10px' }}
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || chat.isSending}
                className="btn-soft-glow disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '9px 18px', fontSize: 12 }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Send
                </span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Shift + Enter for newline · Responses are for study purposes only, not affiliated with ETS.
          </p>
        </div>
      </section>

      {/* ══════ RIGHT: grounding rail (hidden below 1280px) ══════ */}
      <aside className="hidden xl:flex w-[300px] shrink-0 border-l border-white/5 flex-col overflow-y-auto p-3 gap-3 bg-[rgba(6,13,26,0.3)]">

        <div className="rounded-xl p-4 bg-[rgba(10,22,40,0.4)] border border-white/6">
          <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-2">Grounded in</p>
          {activeSession ? (
            <>
              <p className="text-[13px] text-white font-medium leading-tight truncate">{activeSession.title || 'Current chat'}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeSession.messageCount} {activeSession.messageCount === 1 ? 'message' : 'messages'}
              </p>
            </>
          ) : (
            <p className="text-[12px] text-slate-500 italic">Start a chat or pick a session to see its grounding.</p>
          )}
        </div>

        <div className="rounded-xl p-4 bg-[rgba(10,22,40,0.4)] border border-white/6">
          <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-2">This session</p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Messages</span>
              <span className="text-white">{chat.messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Artifacts</span>
              <span className="text-white">{artifactsInSession.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Quiz items</span>
              <span className="text-white">{quizItemsInSession}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mode</span>
              <span className="text-white capitalize">{chat.mode}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 bg-[rgba(10,22,40,0.4)] border border-white/6">
          <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-2">Artifacts · this chat</p>
          {artifactsInSession.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">None yet — ask the tutor to break something down or quiz you.</p>
          ) : (
            <div className="space-y-2">
              {artifactsInSession.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <div
                    className="w-1 self-stretch rounded-full"
                    style={{ background: m.artifactType === 'quiz' ? 'var(--accent-rose)' : 'var(--d3-ice)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white truncate">
                      {(m.artifactPayload as { title?: string })?.title ?? 'Artifact'}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{m.artifactType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl p-4 border" style={{ borderColor: 'rgba(252,213,180,0.25)', background: 'rgba(252,213,180,0.04)' }}>
          <p className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-2" style={{ color: 'var(--d1-peach)' }}>Suggestion</p>
          <p className="text-[12px] text-slate-300 leading-relaxed">
            When this chat ends, ask the tutor to <span className="text-white font-semibold">add a 10-minute spaced review</span> to lock in what you learned.
          </p>
        </div>
      </aside>
    </div>
  );
}
