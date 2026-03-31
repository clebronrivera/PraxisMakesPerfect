// src/utils/tutorContextBuilder.ts
// Deterministic context assembly for the AI tutor.
// Transforms raw skill_scores into a structured snapshot
// that Claude receives as pre-computed facts — not raw data to interpret.

import type { TutorUserContext, TutorSkillSnapshot } from '../types/tutorChat';
import { PROGRESS_SKILLS } from './progressTaxonomy';
import {
  READINESS_TARGET,
  DEMONSTRATING_THRESHOLD,
  APPROACHING_THRESHOLD,
} from './skillProficiency';
import { getMisconceptionsByProgressSkill } from './misconceptionRegistry';

// These types mirror what's stored in user_progress.skill_scores
interface RawSkillScore {
  attempts: number;
  score: number;         // 0–1 accuracy ratio
  correct: number;
  incorrect: number;
  attemptHistory?: { correct: boolean; timestamp: string }[];
  nextReviewDate?: string;  // ISO date-only "YYYY-MM-DD" — set by the SRS engine
}

type SkillScoresMap = Record<string, RawSkillScore>;

// READINESS_TARGET is imported from skillProficiency — single source of truth.

function getProficiency(score: number | null, attempts: number): TutorSkillSnapshot['proficiency'] {
  if (attempts === 0 || score === null) return 'not-started';
  if (score >= DEMONSTRATING_THRESHOLD) return 'demonstrating';
  if (score >= APPROACHING_THRESHOLD) return 'approaching';
  return 'emerging';
}

function getTrend(history?: { correct: boolean }[]): TutorSkillSnapshot['trend'] {
  if (!history || history.length < 6) return 'unknown';
  const mid = Math.floor(history.length / 2);
  const firstAcc = history.slice(0, mid).filter(a => a.correct).length / mid;
  const lastAcc = history.slice(mid).filter(a => a.correct).length / (history.length - mid);
  const delta = lastAcc - firstAcc;
  if (delta >= 0.15) return 'improving';
  if (delta <= -0.15) return 'declining';
  return 'stable';
}

export function buildTutorContext(
  userId: string,
  displayName: string | null,
  diagnosticComplete: boolean,
  totalQuestionsSeen: number,
  skillScores: SkillScoresMap,
): TutorUserContext {
  const todayStr = new Date().toISOString().slice(0, 10);

  const snapshots: TutorSkillSnapshot[] = PROGRESS_SKILLS.map(def => {
    const raw = skillScores[def.skillId];
    const attempts = raw?.attempts ?? 0;
    const accuracy = attempts > 0 ? (raw?.score ?? null) : null;

    return {
      skillId: def.skillId,
      skillName: def.fullLabel,
      domainId: def.domainId,
      proficiency: getProficiency(accuracy, attempts),
      accuracy,
      attempts,
      trend: getTrend(raw?.attemptHistory),
      isTentative: attempts > 0 && attempts < 6,
      overdueForReview: attempts > 0 && !!raw?.nextReviewDate && raw.nextReviewDate <= todayStr,
    };
  });

  const emerging = snapshots
    .filter(s => s.proficiency === 'emerging')
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const approaching = snapshots
    .filter(s => s.proficiency === 'approaching')
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const demonstratingCount = snapshots.filter(s => s.proficiency === 'demonstrating').length;
  const notStartedCount = snapshots.filter(s => s.proficiency === 'not-started').length;

  return {
    userId,
    displayName,
    diagnosticComplete,
    totalQuestionsSeen,
    skillSnapshots: snapshots,
    emergingSkills: emerging,
    approachingSkills: approaching,
    demonstratingCount,
    notStartedCount,
    readinessRatio: demonstratingCount / READINESS_TARGET,
  };
}

// ─── Format context for system prompt injection ──────────────────────────────

export function formatContextForPrompt(ctx: TutorUserContext): string {
  const lines: string[] = [];

  lines.push(`USER SKILL PROFILE (${ctx.totalQuestionsSeen} questions answered):`);
  lines.push(`Readiness: ${Math.round(ctx.readinessRatio * 100)}% (${ctx.demonstratingCount}/${READINESS_TARGET} skills Demonstrating)`);
  lines.push('');

  if (ctx.emergingSkills.length > 0) {
    lines.push('EMERGING SKILLS (highest priority — these need the most work):');
    for (const s of ctx.emergingSkills) {
      const tentative = s.isTentative ? ` [LOW SAMPLE — only ${s.attempts} attempts]` : '';
      const trend = s.trend !== 'unknown' ? ` | trend: ${s.trend}` : '';
      const overdue = s.overdueForReview ? ' ⟳ overdue for review' : '';
      lines.push(`  - ${s.skillId}: ${s.skillName} — ${Math.round((s.accuracy ?? 0) * 100)}% (${s.attempts} attempts${trend})${tentative}${overdue}`);
      // Include top misconceptions from taxonomy for emerging skills
      const misconceptions = getMisconceptionsByProgressSkill(s.skillId);
      if (misconceptions.length > 0) {
        const topMisc = misconceptions.slice(0, 2);
        lines.push(`    Common misconceptions: ${topMisc.map(m => m.text).join('; ')}`);
      }
    }
    lines.push('');
  }

  if (ctx.approachingSkills.length > 0) {
    lines.push('APPROACHING SKILLS (close — targeted practice can push these over):');
    for (const s of ctx.approachingSkills.slice(0, 5)) {
      const trend = s.trend !== 'unknown' ? ` | trend: ${s.trend}` : '';
      const overdue = s.overdueForReview ? ' ⟳ overdue for review' : '';
      lines.push(`  - ${s.skillId}: ${s.skillName} — ${Math.round((s.accuracy ?? 0) * 100)}%${trend}${overdue}`);
    }
    if (ctx.approachingSkills.length > 5) {
      lines.push(`  ... and ${ctx.approachingSkills.length - 5} more`);
    }
    lines.push('');
  }

  lines.push(`${ctx.demonstratingCount} skills Demonstrating (≥80%)`);
  lines.push(`${ctx.notStartedCount} skills Not Started`);

  return lines.join('\n');
}
