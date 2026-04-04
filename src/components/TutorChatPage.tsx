// src/components/TutorChatPage.tsx
// Full-page AI Tutor Chat. Session sidebar + chat area + input.
// Requires diagnosticComplete (enforced in App.tsx gating).

import React, { useRef, useEffect, useState } from 'react';
import { Bot, Plus, Send, ChevronUp, MessageSquare } from 'lucide-react';
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
    <div className="flex h-full min-h-0">
      {/* Session sidebar */}
      <aside className="w-56 shrink-0 border-r border-stone-200 bg-stone-50 flex flex-col">
        <div className="p-3 border-b border-stone-200">
          <button
            onClick={chat.startNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chat.sessions.map(session => (
            <button
              key={session.id}
              onClick={() => chat.selectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                session.id === chat.activeSessionId
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <MessageSquare className="w-3 h-3 shrink-0" />
                <span className="truncate">{session.title || 'Untitled chat'}</span>
              </div>
              <span className="text-stone-400 text-[10px]">{session.messageCount} messages</span>
            </button>
          ))}

          {chat.sessions.length === 0 && (
            <p className="text-xs text-stone-400 px-3 py-4 text-center">No chats yet</p>
          )}
        </div>

        {/* Mode toggle */}
        <div className="p-3 border-t border-stone-200">
          <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
            <button
              onClick={() => chat.setMode('chat')}
              className={`flex-1 py-1.5 transition-colors ${chat.mode === 'chat' ? 'bg-amber-600 text-white font-semibold' : 'bg-white text-stone-500 hover:bg-stone-50'}`}
            >
              Chat
            </button>
            <button
              onClick={() => chat.setMode('quiz')}
              className={`flex-1 py-1.5 transition-colors ${chat.mode === 'quiz' ? 'bg-amber-600 text-white font-semibold' : 'bg-white text-stone-500 hover:bg-stone-50'}`}
            >
              Quiz
            </button>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">PraxisBot</p>
            <p className="text-xs text-stone-500">AI Study Assistant · Praxis 5403</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {chat.isHydratingSession && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )}

          {chat.hasOlderMessages && !chat.isHydratingSession && (
            <button
              onClick={chat.loadOlderMessages}
              className="w-full flex items-center justify-center gap-1 text-xs text-stone-500 hover:text-stone-700 py-2"
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
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs">PraxisBot is thinking…</span>
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
        <div className="px-6 py-4 border-t border-stone-200 bg-white">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chat.mode === 'quiz' ? 'Type "quiz me" or ask a question…' : 'Ask PraxisBot anything about Praxis 5403…'}
              aria-label="Message the AI tutor"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
              disabled={chat.isSending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chat.isSending}
              className="shrink-0 w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 text-center">
            PraxisBot is not affiliated with ETS. Responses are for study purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}

