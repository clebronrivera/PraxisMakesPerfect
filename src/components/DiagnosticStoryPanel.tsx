/**
 * DiagnosticStoryPanel
 *
 * Renders a question-by-question narrative of a student's adaptive diagnostic.
 * For each skill they touched, groups the initial question + any follow-ups,
 * pulls per-question and per-distractor metadata from `questions.json`, and
 * surfaces:
 *   - what the question asked
 *   - which distractor they picked when wrong (and what misconception /
 *     skill-deficit / error-type that distractor maps to)
 *   - the dominant error pattern + error-cluster tag for the question
 *   - the prerequisite-chain narrative (when present)
 *   - an inferred "what this tells us" line per skill
 *
 * Designed to live below the existing "Adaptive Diagnostic Audit" table in
 * the admin Student Detail Drawer.
 */

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { PROGRESS_SKILL_LOOKUP } from '../utils/progressTaxonomy';

interface ResponseRow {
  question_id: string;
  skill_id: string | null;
  assessment_type: string | null;
  is_correct: boolean | null;
  selected_answers: string[] | null;
  correct_answers: string[] | null;
  created_at: string | null;
  is_followup: boolean | null;
  cognitive_complexity: string | null;
  skill_question_index: number | null;
}

interface QuestionMeta {
  UNIQUEID: string;
  question_stem?: string;
  current_skill_id?: string;
  skill_name?: string;
  cognitive_complexity?: string;
  is_foundational?: boolean | string;
  dominant_error_pattern?: string;
  error_cluster_tag?: string;
  top_misconception_themes?: string;
  prereq_chain_narrative?: string;
  // Distractor metadata fields per letter A-F
  [key: string]: unknown;
}

interface DiagnosticStoryPanelProps {
  responses: ResponseRow[];
}

export default function DiagnosticStoryPanel({ responses }: DiagnosticStoryPanelProps) {
  const [questionIndex, setQuestionIndex] = useState<Map<string, QuestionMeta> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const adaptiveRows = useMemo(
    () =>
      [...responses]
        .filter(r => r.assessment_type === 'adaptive')
        .sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime(),
        ),
    [responses],
  );

  // Lazy-load questions.json once we have any adaptive rows to narrate.
  useEffect(() => {
    if (adaptiveRows.length === 0 || questionIndex) return;
    setIsLoading(true);
    import('../data/questions.json')
      .then(mod => {
        const list = (mod.default ?? mod) as QuestionMeta[];
        const map = new Map<string, QuestionMeta>();
        for (const q of list) {
          if (q?.UNIQUEID) map.set(q.UNIQUEID, q);
        }
        setQuestionIndex(map);
      })
      .catch(err => {
        console.error('[DiagnosticStoryPanel] questions.json load failed:', err);
      })
      .finally(() => setIsLoading(false));
  }, [adaptiveRows.length, questionIndex]);

  if (adaptiveRows.length === 0) return null;

  // Group rows by skill, preserving chronological order
  const skillGroups = new Map<string, ResponseRow[]>();
  for (const r of adaptiveRows) {
    const sid = r.skill_id || '(unknown)';
    if (!skillGroups.has(sid)) skillGroups.set(sid, []);
    skillGroups.get(sid)!.push(r);
  }

  // Order skills by first-seen time for narrative flow
  const orderedSkills = Array.from(skillGroups.entries()).sort((a, b) => {
    const at = new Date(a[1][0].created_at || 0).getTime();
    const bt = new Date(b[1][0].created_at || 0).getTime();
    return at - bt;
  });

  const toggleExpand = (skillId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-indigo-700" />
        <h3 className="font-semibold text-slate-900">Diagnostic Story</h3>
        <span className="text-xs text-slate-400">
          {orderedSkills.length} skill{orderedSkills.length === 1 ? '' : 's'} traced
        </span>
        {isLoading && (
          <span className="ml-2 text-xs text-slate-400">loading question metadata…</span>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Question-by-question narrative. Click any skill to expand the full story
        — what was asked, what they picked, and what each wrong answer reveals.
      </p>

      <div className="space-y-2">
        {orderedSkills.map(([skillId, rows]) => {
          const isExpanded = expanded.has(skillId);
          const skillLabel = PROGRESS_SKILL_LOOKUP[skillId]?.shortLabel ?? skillId;
          const correctCount = rows.filter(r => r.is_correct).length;
          const inference = inferSkillStory(rows);
          return (
            <div
              key={skillId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => toggleExpand(skillId)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-none text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-none text-slate-400" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      <span className="font-mono text-xs text-slate-400 mr-2">{skillId}</span>
                      {skillLabel}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {inference.headline}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs flex-none">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                    {rows.length} Q
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      correctCount === rows.length
                        ? 'bg-emerald-50 text-emerald-700'
                        : correctCount === 0
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {correctCount}/{rows.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-4 space-y-4">
                  {rows.map((r, idx) => {
                    const q = questionIndex?.get(r.question_id);
                    return (
                      <QuestionEventCard
                        key={r.question_id + idx}
                        index={idx + 1}
                        row={r}
                        question={q}
                      />
                    );
                  })}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      What this tells us
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{inference.full}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-question event card

interface QuestionEventCardProps {
  index: number;
  row: ResponseRow;
  question: QuestionMeta | undefined;
}

function QuestionEventCard({ index, row, question }: QuestionEventCardProps) {
  const stem = typeof question?.question_stem === 'string' ? question.question_stem : '';
  const truncatedStem = stem.length > 280 ? stem.slice(0, 280) + '…' : stem;
  const selectedLetter = (row.selected_answers ?? [])[0] ?? null;
  const correctLetter = (row.correct_answers ?? [])[0] ?? null;
  const isFoundational =
    question?.is_foundational === true || question?.is_foundational === 'true';

  // Pull distractor-specific fields when student picked a wrong letter
  const distractor = selectedLetter && question
    ? {
        errorType: question[`distractor_error_type_${selectedLetter}`] as string | undefined,
        misconception: question[`distractor_misconception_${selectedLetter}`] as string | undefined,
        skillDeficit: question[`distractor_skill_deficit_${selectedLetter}`] as string | undefined,
        tier: question[`distractor_tier_${selectedLetter}`] as string | undefined,
      }
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-400">#{index}</span>
          {row.is_followup ? (
            <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">
              Follow-up
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              Initial
            </span>
          )}
          {row.cognitive_complexity && (
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                row.cognitive_complexity === 'Recall'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {row.cognitive_complexity}
            </span>
          )}
          {isFoundational && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              Foundational
            </span>
          )}
        </div>
        <span
          className={`text-sm font-semibold ${
            row.is_correct ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.is_correct ? '✓ Correct' : '✗ Wrong'}
        </span>
      </div>

      {truncatedStem ? (
        <p className="text-sm leading-relaxed text-slate-700 mb-2">{truncatedStem}</p>
      ) : (
        <p className="text-xs italic text-slate-400 mb-2">
          (Question stem unavailable — metadata not loaded for {row.question_id})
        </p>
      )}

      <p className="text-xs text-slate-500 mb-2">
        Picked: <span className="font-semibold text-slate-700">{selectedLetter ?? '—'}</span>
        {' · '}
        Correct: <span className="font-semibold text-slate-700">{correctLetter ?? '—'}</span>
      </p>

      {!row.is_correct && distractor && (
        <div className="rounded-lg bg-rose-50/60 border border-rose-200 p-2 space-y-1 text-xs">
          {distractor.tier && (
            <p>
              <span className="font-semibold text-rose-800">Distractor tier:</span>{' '}
              <span className="text-rose-700">{distractor.tier}</span>
            </p>
          )}
          {distractor.errorType && (
            <p>
              <span className="font-semibold text-rose-800">Error type:</span>{' '}
              <span className="text-rose-700">{distractor.errorType}</span>
            </p>
          )}
          {distractor.misconception && (
            <p>
              <span className="font-semibold text-rose-800">Misconception:</span>{' '}
              <span className="text-rose-700">{distractor.misconception}</span>
            </p>
          )}
          {distractor.skillDeficit && (
            <p>
              <span className="font-semibold text-rose-800">Skill deficit:</span>{' '}
              <span className="text-rose-700">{distractor.skillDeficit}</span>
            </p>
          )}
        </div>
      )}

      {!row.is_correct && question?.dominant_error_pattern && (
        <p className="mt-2 text-xs text-slate-600">
          <span className="font-semibold">Dominant error pattern for this question:</span>{' '}
          {question.dominant_error_pattern}
        </p>
      )}

      {!row.is_correct && question?.prereq_chain_narrative &&
        question.prereq_chain_narrative !== 'Inherited from skill baseline.' && (
        <p className="mt-2 text-xs text-slate-600">
          <span className="font-semibold">Prerequisite chain:</span>{' '}
          {question.prereq_chain_narrative}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inference: deterministic "what this tells us" line per skill

interface SkillInference {
  headline: string;
  full: string;
}

function inferSkillStory(rows: ResponseRow[]): SkillInference {
  const ordered = [...rows].sort(
    (a, b) =>
      new Date(a.created_at || 0).getTime() -
      new Date(b.created_at || 0).getTime(),
  );
  const total = ordered.length;
  const correct = ordered.filter(r => r.is_correct).length;
  const initial = ordered[0];
  const lastIsCorrect = ordered[ordered.length - 1]?.is_correct === true;

  if (total === 1) {
    return initial.is_correct
      ? {
          headline: 'Demonstrated on first try — no follow-up needed.',
          full:
            'Student answered the initial question correctly, so the engine did not queue any follow-ups. Single-data-point evidence of competence — confirm with practice over time.',
        }
      : {
          headline: 'Missed initial — no follow-up was triggered.',
          full:
            'Student missed the initial question but no follow-up was queued (likely because the per-skill cap or follow-up pool ran out). One wrong answer is a weak signal on its own.',
        };
  }

  if (correct === total) {
    return {
      headline: 'Recovered after misses — knowledge intact at recall, may need application practice.',
      full:
        'Student missed the initial question but went on to answer every follow-up correctly. This pattern usually indicates the foundational concept is intact and the original miss was an application/transfer slip, careless error, or distractor pull rather than a true gap.',
    };
  }

  if (correct === 0) {
    return {
      headline: 'Foundational gap — wrong on initial AND on every follow-up.',
      full:
        'Student got the initial wrong AND every follow-up. This is a strong signal of a foundational deficit on this skill. The follow-ups intentionally probed different cognitive complexities; missing all of them suggests the prerequisite concepts need to be retaught, not just practiced.',
    };
  }

  // Mixed: some right, some wrong
  if (!initial.is_correct && lastIsCorrect) {
    return {
      headline: 'Climbed back — likely transfer/application gap, not foundational.',
      full:
        'Student missed the initial question and at least one follow-up but eventually got it right. The foundational concept is probably intact; the gap is in how to apply it across varied phrasings or contexts. Practice problems with diverse stems will help most.',
    };
  }

  if (initial.is_correct && !lastIsCorrect) {
    return {
      headline: 'Inconsistent — first right, later wrong. Possibly random or lucky guess.',
      full:
        'Student got the initial right but missed a later follow-up. This is unusual under the current engine logic, since follow-ups only fire on misses. Treat the initial-correct as low-confidence evidence.',
    };
  }

  return {
    headline: 'Mixed performance — partial competence.',
    full:
      'Student got some questions right and others wrong on this skill. Look at which distractor was picked on the wrong items — that distractor pattern usually pinpoints the specific misconception to address.',
  };
}
