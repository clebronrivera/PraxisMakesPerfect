// src/components/FloatingTutorWidget.tsx
// Persistent chat bubble fixed bottom-right. Expands to 360px panel.
// Suppressed during active assessments (controlled by App.tsx).

import React, { useRef, useEffect, useState } from 'react';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import { useTutorChat } from '../hooks/useTutorChat';
import { TutorMessageBubble } from './TutorMessageBubble';
import { TutorEmptyState } from './TutorEmptyState';
import type { PageContext } from '../types/tutorChat';

interface FloatingTutorWidgetProps {
  userId: string;
  diagnosticComplete: boolean;
  pageContext: PageContext;
}

export function FloatingTutorWidget({
  userId,
  diagnosticComplete,
  pageContext,
}: FloatingTutorWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat = useTutorChat({ userId, sessionType: 'floating', pageContext });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat.messages, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || chat.isSending) return;
    setInput('');
    await chat.sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUp = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleSubmitQuizAnswer = (questionId: string, selectedAnswers: string[]) => {
    chat.submitQuizAnswer(questionId, selectedAnswers);
  };

  const latestAssistantIdx = chat.messages.reduce<number>((acc, m, i) => m.role === 'assistant' ? i : acc, -1);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      {isOpen && (
        <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">PraxisBot</p>
                <p className="text-[10px] text-stone-500">AI Study Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-stone-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chat.messages.length === 0 && !chat.isHydratingSession && (
              <TutorEmptyState
                sessionType="floating"
                diagnosticComplete={diagnosticComplete}
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
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {chat.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                {chat.error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-stone-200 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Praxis 5403…"
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={chat.isSending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || chat.isSending}
                className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95
          ${isOpen ? 'bg-stone-700' : 'bg-amber-600 hover:bg-amber-700'}
        `}
        aria-label={isOpen ? 'Close PraxisBot' : 'Open PraxisBot'}
      >
        {isOpen
          ? <X className="w-6 h-6 text-white" />
          : <Bot className="w-6 h-6 text-white" />
        }
      </button>
    </div>
  );
}
