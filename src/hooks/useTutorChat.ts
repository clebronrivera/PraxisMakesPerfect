// src/hooks/useTutorChat.ts
// Manages AI Tutor Chat state for both page-tutor and floating widget.
// Pattern: follows useRedemptionRounds.ts architecture.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import type {
  ChatMessage,
  ChatSessionSummary,
  TutorChatRequest,
  TutorChatResponse,
  PageContext,
} from '../types/tutorChat';

interface UseTutorChatOptions {
  userId: string | null;
  sessionType: 'page-tutor' | 'floating';
  pageContext?: PageContext;
}

const API_URL = '/api/tutor-chat';
const MESSAGES_PAGE_SIZE = 20;

async function getAccessToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.access_token ?? '';
}

export function useTutorChat({ userId, sessionType, pageContext }: UseTutorChatOptions) {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isHydratingSession, setIsHydratingSession] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [mode, setMode] = useState<'chat' | 'quiz'>('chat');
  const [error, setError] = useState<string | null>(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [messagesOffset, setMessagesOffset] = useState(0);

  // Track pending quiz question from the latest assistant message
  const pendingQuizRef = useRef<TutorChatResponse['quizQuestion'] | null>(null);

  // Adaptive retry: track consecutive misses on the same skill
  const quizRetryStateRef = useRef<{ skillId: string; missCount: number } | null>(null);

  // ── Load session list on mount (page-tutor only) ─────────────────────────
  useEffect(() => {
    if (!userId || sessionType !== 'page-tutor') return;

    let active = true;
    supabase
      .from('chat_sessions')
      .select('id, title, session_type, message_count, updated_at')
      .eq('user_id', userId)
      .eq('session_type', 'page-tutor')
      .order('updated_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!active || !data) return;
        setSessions(data.map(s => ({
          id: s.id,
          title: s.title,
          sessionType: s.session_type as 'page-tutor' | 'floating',
          messageCount: s.message_count,
          updatedAt: s.updated_at,
        })));
      });

    return () => { active = false; };
  }, [userId, sessionType]);

  // ── Load messages for active session ─────────────────────────────────────
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setIsHydratingSession(true);
    setMessagesOffset(0);
    setHasOlderMessages(false);
    quizRetryStateRef.current = null;

    const { data, count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);

    setIsHydratingSession(false);

    if (!data) return;

    const reversed = [...data].reverse();
    setMessages(reversed.map(rowToMessage));
    setMessagesOffset(data.length);
    setHasOlderMessages((count ?? 0) > data.length);

    // Restore pending quiz from latest assistant message
    const assistantMsgs = reversed.filter(m => m.role === 'assistant');
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    pendingQuizRef.current = null;
    if (lastAssistant?.quiz_question_id && !lastAssistant?.quiz_answered) {
      // We don't have full quiz question data from DB — user must re-request
      // (quiz card is cleared on page reload; that's acceptable UX)
    }
  }, []);

  // ── Select session ────────────────────────────────────────────────────────
  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    pendingQuizRef.current = null;
    quizRetryStateRef.current = null;
    loadSessionMessages(sessionId);
  }, [loadSessionMessages]);

  // ── Start new session ─────────────────────────────────────────────────────
  const startNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    pendingQuizRef.current = null;
    quizRetryStateRef.current = null;
  }, []);

  // ── Load older messages (pagination) ─────────────────────────────────────
  const loadOlderMessages = useCallback(async () => {
    if (!activeSessionId || !hasOlderMessages) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: false })
      .range(messagesOffset, messagesOffset + MESSAGES_PAGE_SIZE - 1);

    if (!data || data.length === 0) {
      setHasOlderMessages(false);
      return;
    }

    const older = [...data].reverse().map(rowToMessage);
    setMessages(prev => [...older, ...prev]);
    setMessagesOffset(prev => prev + data.length);
    setHasOlderMessages(data.length === MESSAGES_PAGE_SIZE);
  }, [activeSessionId, hasOlderMessages, messagesOffset]);

  // ── Core send message ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (
    text: string,
    quizAnswerFor?: TutorChatRequest['quizAnswerFor'],
  ) => {
    if (!userId || !text.trim()) return;

    setError(null);

    // Optimistic local append for user message
    const optimisticUserMsg: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      sessionId: activeSessionId ?? '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      pageContext,
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    setIsSending(true);
    if (!activeSessionId) setIsCreatingSession(true);

    try {
      const idToken = await getAccessToken();
      if (!idToken) {
        setError('Your session has expired. Please log out and log back in.');
        setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
        return;
      }

      const requestBody: TutorChatRequest = {
        userId,
        sessionId: activeSessionId,
        message: text,
        mode,
        sessionType,
        pageContext,
        quizAnswerFor,
      };

      // ── Adaptive retry: inject prioritySkillId / quizRetryContext ──────
      const retryState = quizRetryStateRef.current;
      if (retryState) {
        if (!quizAnswerFor) {
          // Quiz-request turn: attach prioritySkillId only when this looks
          // like a quiz request (mode=quiz or message matches quiz patterns).
          // The server ignores it on non-quiz-request intents anyway, but
          // we avoid sending it on general chat turns per spec.
          const isQuizRequest = mode === 'quiz' ||
            /\b(quiz|test|drill)\s*me\b/i.test(text) ||
            /\b(give|ask)\s*me\s*(a\s*)?(quiz|question)\b/i.test(text) ||
            /\b(one\s*(more\s*)?|try\s+(a\s*)?)question\b/i.test(text);
          if (isQuizRequest) {
            requestBody.prioritySkillId = retryState.skillId;
          }
        } else {
          // Quiz-answer turn: attach retryContext only if the pending quiz
          // matches the retry skill (guard against skill mismatch).
          if (pendingQuizRef.current?.skillId === retryState.skillId) {
            requestBody.quizRetryContext = {
              skillId: retryState.skillId,
              missCount: retryState.missCount,
            };
          }
        }
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data: TutorChatResponse = await res.json();

      // Update session ID if newly created
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
        // Add to sessions list
        setSessions(prev => [{
          id: data.sessionId,
          title: text.slice(0, 60),
          sessionType,
          messageCount: 2,
          updatedAt: new Date().toISOString(),
        }, ...prev]);
      }

      // Replace optimistic message and append assistant message
      const assistantMsg: ChatMessage = {
        id: data.messageId,
        sessionId: data.sessionId,
        role: 'assistant',
        content: data.content,
        createdAt: new Date().toISOString(),
        quizQuestion: data.quizQuestion,
        artifactType: data.artifact?.type,
        artifactPayload: data.artifact?.payload,
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setMessages(prev => [
        ...prev.filter(m => m.id !== optimisticUserMsg.id),
        { ...optimisticUserMsg, sessionId: data.sessionId },
        assistantMsg,
      ]);

      // Store pending quiz question reference
      if (data.quizQuestion) {
        pendingQuizRef.current = data.quizQuestion;
      } else if (quizAnswerFor) {
        pendingQuizRef.current = null;
      }

      // ── Adaptive retry: state transitions ─────────────────────────────
      // Quiz question received: check if priority skill was actually served
      if (data.quizQuestion) {
        const currentRetry = quizRetryStateRef.current;
        if (currentRetry && data.quizQuestion.skillId !== currentRetry.skillId) {
          // Pool exhausted for retry skill — clear retry immediately
          quizRetryStateRef.current = null;
        }
      }
      // Quiz answer graded: update retry state machine
      if (data.quizResult) {
        const currentRetry = quizRetryStateRef.current;
        if (currentRetry) {
          // Active retry → always clear (remediation already happened if wrong)
          quizRetryStateRef.current = null;
        } else if (!data.quizResult.isCorrect && data.quizResult.skillId) {
          // First miss on this skill → start retry.
          // Guard: only start when skillId is truthy — empty string from
          // unresolved questions is a clear-only signal, not a retry target.
          quizRetryStateRef.current = { skillId: data.quizResult.skillId, missCount: 1 };
        }
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
    } finally {
      setIsSending(false);
      setIsCreatingSession(false);
    }
  }, [userId, activeSessionId, mode, sessionType, pageContext]);

  // ── Submit quiz answer ────────────────────────────────────────────────────
  const submitQuizAnswer = useCallback(async (
    questionId: string,
    selectedAnswers: string[],
  ) => {
    await sendMessage(
      `My answer: ${selectedAnswers.join(', ')}`,
      { questionId, selectedAnswers },
    );
  }, [sendMessage]);

  return {
    sessions,
    activeSessionId,
    messages,
    isSending,
    isHydratingSession,
    isCreatingSession,
    mode,
    setMode,
    sendMessage: (text: string) => sendMessage(text),
    submitQuizAnswer,
    startNewSession,
    selectSession,
    loadOlderMessages,
    hasOlderMessages,
    error,
    pendingQuiz: pendingQuizRef.current,
  };
}

// ─── Row → ChatMessage mapper ─────────────────────────────────────────────────

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    createdAt: row.created_at as string,
    assistantIntent: row.assistant_intent as ChatMessage['assistantIntent'],
    quizQuestionId: row.quiz_question_id as string | undefined,
    quizSkillId: row.quiz_skill_id as string | undefined,
    quizAnswered: row.quiz_answered as boolean | undefined,
    artifactType: row.artifact_type as string | undefined,
    artifactPayload: row.artifact_payload as Record<string, unknown> | undefined,
    pageContext: row.page_context as ChatMessage['pageContext'],
  };
}
