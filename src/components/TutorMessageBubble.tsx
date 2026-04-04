// src/components/TutorMessageBubble.tsx
// Renders a single chat message, dispatching to text / quiz card / artifact card.

import { type ReactNode } from 'react';
import type { ChatMessage } from '../types/tutorChat';
import { QuizQuestionBubble } from './QuizQuestionBubble';
import { ArtifactCard } from './ArtifactCard';
import { TutorSuggestedChips } from './TutorSuggestedChips';

interface TutorMessageBubbleProps {
  message: ChatMessage;
  isLatest: boolean;
  suggestedFollowUps?: string[];
  onFollowUp?: (text: string) => void;
  onSubmitQuizAnswer?: (questionId: string, selectedAnswers: string[]) => void;
  isSending?: boolean;
}

// Simple inline markdown renderer for bold, bullets, and line breaks
function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const result: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `line-${i}`;

    if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(
        <li key={key} className="text-slate-700 ml-4 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    } else if (line.startsWith('## ')) {
      result.push(<h3 key={key} className="font-semibold text-slate-900 mt-2 mb-1">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      result.push(<h2 key={key} className="font-bold text-slate-900 mt-2 mb-1">{line.slice(2)}</h2>);
    } else if (line.trim() === '') {
      result.push(<br key={key} />);
    } else {
      result.push(<p key={key} className="mb-1 last:mb-0">{renderInline(line)}</p>);
    }
  }

  return result;
}

function renderInline(text: string): ReactNode[] {
  // Handle **bold** and `code`
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-900">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<code key={match.index} className="bg-slate-100 px-1 rounded text-xs font-mono">{match[2]}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function TutorMessageBubble({
  message,
  isLatest,
  suggestedFollowUps,
  onFollowUp,
  onSubmitQuizAnswer,
  isSending,
}: TutorMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end items-start gap-2">
        <div className="rounded-2xl bg-indigo-600 text-white p-4 max-w-md text-sm">
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
          U
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2 max-w-[90%]">
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs shrink-0">
          🤖
        </div>
        <div>
        {/* Markdown content */}
        <div className="editorial-surface-soft p-4 max-w-md text-sm text-slate-800">
          {renderMarkdown(message.content)}
        </div>

        {/* Quiz question card (when bot posed a question) */}
        {message.quizQuestion && onSubmitQuizAnswer && (
          <QuizQuestionBubble
            questionId={message.quizQuestion.questionId}
            skillId={message.quizQuestion.skillId}
            stem={message.quizQuestion.stem}
            choices={message.quizQuestion.choices}
            isMultiSelect={message.quizQuestion.isMultiSelect}
            onSubmit={onSubmitQuizAnswer}
            disabled={isSending}
            isSubmitted={message.quizAnswered}
          />
        )}

        {/* Artifact card */}
        {message.artifactType && message.artifactPayload && (
          <ArtifactCard
            type={message.artifactType}
            payload={message.artifactPayload}
          />
        )}
        </div>
      </div>

      {/* Suggested follow-ups (only on latest assistant message) */}
      {isLatest && suggestedFollowUps && suggestedFollowUps.length > 0 && onFollowUp && (
        <TutorSuggestedChips
          suggestions={suggestedFollowUps}
          onSelect={onFollowUp}
          disabled={isSending}
        />
      )}
    </div>
  );
}
