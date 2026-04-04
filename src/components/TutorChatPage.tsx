// src/components/TutorChatPage.tsx
// Full-page AI Tutor Chat. Session sidebar + chat area + input.
// Requires diagnosticComplete (enforced in App.tsx gating).

import React, { useRef, useEffect, useState } from 'react';
import { Plus, Send, ChevronUp, MessageSquare } from 'lucide-react';
import { useTutorChat } from '../hooks/useTutorChat';
import { TutorMessageBubble } from './TutorMessageBubble';
import { TutorEmptyState } from './TutorEmptyState';

interface TutorChatPageProps {
  userId: string;
  diagnosticComplete: boolean;
  emergingSkillsCount?: number;
  emergingSkills?: { skillId: string; skillName: string; domainId: number; proficiency: 'emerging'; accuracy: number | null; attempts: number; trend: 'improving' | 'declining' | 'stable' | 'unknown'; isTentative: boolean }[];
}

export function TutorChatPage({
  userId,
  diagnosticComplete,
  emergingSkills = [],
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

  // Find latest assistant message for suggested chips
  const latestAssistantIdx = chat.messages.reduce<number>((acc, m, i) => m.role === 'assistant' ? i : acc, -1);

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Session sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col">
        {/* Header + New button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800">Sessions</h2>
          <button
            onClick={chat.startNewSession}
            className="inline-flex items-center gap-1 text-[10px] py-1 px-3 rounded-2xl font-semibold transition-all"
            style={{ backgroundColor: '#f59e0b', color: '#1a1a1a' }}
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => chat.setMode('chat')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              chat.mode === 'chat'
                ? 'bg-amber-500 text-white'
                : 'bg-transparent border border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => chat.setMode('quiz')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              chat.mode === 'quiz'
                ? 'bg-amber-500 text-white'
                : 'bg-transparent border border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            Quiz
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {chat.sessions.map(session => (
            <button
              key={session.id}
              onClick={() => chat.selectSession(session.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                session.id === chat.activeSessionId
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <MessageSquare className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate text-xs font-semibold text-slate-700">
                  {session.title || 'Untitled chat'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {new Date(session.updatedAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] text-slate-400">{session.messageCount} msg</span>
              </div>
            </button>
          ))}

          {chat.sessions.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-4 text-center">No chats yet</p>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 editorial-surface" style={{ borderRadius: '1.5rem' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: '#e6dfd4' }}>
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs">
            🤖
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">PraxisBot</span>
            <span className="text-xs text-slate-400">· AI Study Assistant</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {chat.isHydratingSession && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )}

          {chat.hasOlderMessages && !chat.isHydratingSession && (
            <button
              onClick={chat.loadOlderMessages}
              className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 py-2"
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
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs shrink-0">
                🤖
              </div>
              <div className="editorial-surface-soft p-4 max-w-md">
                <span className="text-xs text-slate-400">Typing...</span>
              </div>
            </div>
          )}

          {chat.error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {chat.error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-5 py-4 border-t" style={{ borderColor: '#e6dfd4' }}>
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chat.mode === 'quiz' ? 'Type "quiz me" or ask a question...' : 'Ask PraxisBot anything about Praxis 5403...'}
              aria-label="Message the AI tutor"
              rows={1}
              className="flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              style={{ maxHeight: '120px', overflowY: 'auto', borderColor: '#e6dfd4' }}
              disabled={chat.isSending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chat.isSending}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#f59e0b', color: '#1a1a1a' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            PraxisBot is not affiliated with ETS. Responses are for study purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
