/**
 * vocabDrillService — persistence + data-feedback for the Vocabulary Fluency Drill.
 *
 * Option B1 feedback model:
 *   - every answered card is logged to `vocab_attempts` (raw audit events),
 *   - a missed term is flagged in the user's glossary via `increment_glossary_miss`
 *     (adds the term if absent, bumps `miss_count`, re-flags as unrevealed),
 *   - skills missed repeatedly in a single drill (≥ REPEAT_MISS_THRESHOLD) are
 *     returned so the caller can nudge them via the EXISTING adaptive engine
 *     (`updateSkillProgress(skillId, false, 'low')`) — a single timeout can't tank
 *     a skill, and the nudge is at low confidence.
 *
 * `updateSkillProgress` is a React hook function, so this service does not call it
 * directly — it returns the skill IDs to nudge and the caller applies them.
 */

import { supabase } from '../config/supabase';

/**
 * One drill card's outcome. Structurally compatible with the drill component's
 * `TermResult` so callers can pass results straight through without coupling.
 */
export interface VocabDrillResult {
  term: string;
  /** Skills that list this term as vocabulary (may be empty). */
  skillIds: string[];
  correct: boolean;
  timedOut: boolean;
  direction: 'term' | 'definition';
}

/** A skill must be missed at least this many times in one drill to earn a nudge. */
export const REPEAT_MISS_THRESHOLD = 2;

/**
 * Pure: which skills were missed enough times this drill to warrant a low-confidence
 * nudge. De-dampened so a single slip never moves a skill.
 */
export function computeSkillNudges(results: VocabDrillResult[]): string[] {
  const missesBySkill = new Map<string, number>();
  for (const r of results) {
    if (r.correct) continue;
    for (const skillId of r.skillIds) {
      missesBySkill.set(skillId, (missesBySkill.get(skillId) ?? 0) + 1);
    }
  }
  const out: string[] = [];
  for (const [skillId, misses] of missesBySkill) {
    if (misses >= REPEAT_MISS_THRESHOLD) out.push(skillId);
  }
  return out;
}

interface VocabAttemptInsert {
  user_id: string;
  term: string;
  skill_id: string | null;
  direction: 'term' | 'definition';
  is_correct: boolean;
  timed_out: boolean;
}

/** Persist every card as raw events (one row per term × skill; one null-skill row if unmapped). */
async function saveVocabAttempts(userId: string, results: VocabDrillResult[]): Promise<void> {
  const rows = results.flatMap((r): VocabAttemptInsert[] => {
    const base = {
      user_id: userId,
      term: r.term,
      direction: r.direction,
      is_correct: r.correct,
      timed_out: r.timedOut,
    };
    if (r.skillIds.length === 0) return [{ ...base, skill_id: null }];
    return r.skillIds.map((skillId) => ({ ...base, skill_id: skillId }));
  });
  if (rows.length === 0) return;

  const { error } = await supabase.from('vocab_attempts').insert(rows);
  if (error) {
    console.error('[vocabDrillService] saveVocabAttempts error:', error);
  }
}

/** Flag a missed term in the glossary (adds if absent, bumps miss_count). */
async function flagGlossaryMiss(userId: string, term: string, skillId: string | null): Promise<void> {
  const { error } = await supabase.rpc('increment_glossary_miss', {
    p_user_id: userId,
    p_term: term,
    p_skill_id: skillId,
  });
  if (error) {
    console.error('[vocabDrillService] increment_glossary_miss error:', error);
  }
}

/**
 * Record a completed drill: persist attempts, flag missed terms to the glossary,
 * and return the skills to nudge (caller applies via updateSkillProgress).
 */
export async function recordDrillResults(
  userId: string,
  results: VocabDrillResult[],
): Promise<{ nudgeSkillIds: string[]; flaggedTermCount: number }> {
  if (!userId || results.length === 0) {
    return { nudgeSkillIds: [], flaggedTermCount: 0 };
  }

  await saveVocabAttempts(userId, results);

  const seen = new Set<string>();
  let flagged = 0;
  for (const r of results) {
    if (r.correct) continue;
    const key = r.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    await flagGlossaryMiss(userId, r.term, r.skillIds[0] ?? null);
    flagged += 1;
  }

  return { nudgeSkillIds: computeSkillNudges(results), flaggedTermCount: flagged };
}
