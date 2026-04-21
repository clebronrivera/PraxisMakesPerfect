// src/components/TutorMessageBubble.tsx
// Renders a single chat message (atelier styling), dispatching to text / quiz / artifact.

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

// Simple inline markdown renderer (bold, bullets, headings, line breaks)
function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const result: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `line-${i}`;

    if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(
        <li key={key} className="text-slate-300 ml-4 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    } else if (line.startsWith('## ')) {
      result.push(<h3 key={key} className="font-semibold text-white mt-2 mb-1">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      result.push(<h2 key={key} className="font-bold text-white mt-2 mb-1">{line.slice(2)}</h2>);
    } else if (line.trim() === '') {
      result.push(<br key={key} />);
    } else {
      result.push(<p key={key} className="mb-1 last:mb-0 text-slate-200">{renderInline(line)}</p>);
    }
  }

  return result;
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(
        <code
          key={match.index}
          className="px-1 rounded text-xs font-mono text-slate-200"
          style={{ background: 'rgba(226,232,240,0.08)' }}
        >
          {match[2]}
        </code>
      );
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
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-4 py-3 text-[13.5px] text-slate-100 leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, rgba(252,213,180,0.15), rgba(216,213,252,0.1))',
            border: '1px solid rgba(252,213,180,0.25)',
            borderRadius: '18px 18px 4px 18px',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message — orb avatar on the left, navy-glass bubble
  return (
    <div className="flex gap-3">
      <div className="mini-orb mt-1" style={{ width: 26, height: 26 }} aria-hidden="true" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div
          className="px-4 py-3.5 text-[13.5px] leading-relaxed text-slate-200"
          style={{
            background: 'rgba(10,22,40,0.65)',
            border: '1px solid rgba(226,232,240,0.08)',
            borderRadius: '4px 18px 18px 18px',
          }}
        >
          {renderMarkdown(message.content)}
        </div>

        {/* Quiz question card */}
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
            variant="atelier"
          />
        )}

        {/* Suggested follow-ups (only on latest assistant message) */}
        {isLatest && suggestedFollowUps && suggestedFollowUps.length > 0 && onFollowUp && (
          <TutorSuggestedChips
            suggestions={suggestedFollowUps}
            onSelect={onFollowUp}
            disabled={isSending}
          />
        )}
      </div>
    </div>
  );
}
