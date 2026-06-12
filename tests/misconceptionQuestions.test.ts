import { describe, it, expect } from 'vitest';
import { MISCONCEPTION_TAXONOMY } from '../src/data/misconception-taxonomy';
import misconceptionQuestionMap from '../src/data/misconceptionQuestionMap.json';
import { toProgressId } from '../src/data/skillIdMap';
import questions from '../src/data/questions.json';

const map = (misconceptionQuestionMap as {
  meta: { cap: number };
  misconceptions: Record<string, { questionIds: string[]; topScore: number }>;
}).misconceptions;
const CAP = (misconceptionQuestionMap as { meta: { cap: number } }).meta.cap;

const QUESTION_IDS = new Set(questions.map((q) => q.UNIQUEID));
const SKILL_OF = new Map(questions.map((q) => [q.UNIQUEID, q.current_skill_id]));
const MC_BY_ID = new Map(MISCONCEPTION_TAXONOMY.map((m) => [m.id, m]));

describe('misconceptionQuestionMap (backfilled questionIds)', () => {
  it('every mapped key is a real misconception id', () => {
    const unknown = Object.keys(map).filter((id) => !MC_BY_ID.has(id));
    expect(unknown, `unknown misconception ids: ${unknown.join(', ')}`).toEqual([]);
  });

  it('every linked questionId exists in the question bank', () => {
    const missing: string[] = [];
    for (const [mid, e] of Object.entries(map)) {
      for (const qid of e.questionIds) if (!QUESTION_IDS.has(qid)) missing.push(`${mid}:${qid}`);
    }
    expect(missing, `links to non-existent questions: ${missing.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it("every linked question's skill maps to the misconception's metadata skill", () => {
    const mismatches: string[] = [];
    for (const [mid, e] of Object.entries(map)) {
      const mcSkill = MC_BY_ID.get(mid)?.skillId;
      for (const qid of e.questionIds) {
        const prog = SKILL_OF.get(qid);
        if (toProgressId(mcSkill!) !== prog) mismatches.push(`${mid}(${mcSkill}) <- ${qid}(${prog})`);
      }
    }
    expect(mismatches, `cross-skill links: ${mismatches.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it('respects the per-misconception cap and has no duplicate links', () => {
    const bad: string[] = [];
    for (const [mid, e] of Object.entries(map)) {
      if (e.questionIds.length > CAP) bad.push(`${mid}: ${e.questionIds.length} > cap ${CAP}`);
      if (new Set(e.questionIds).size !== e.questionIds.length) bad.push(`${mid}: duplicate questionIds`);
    }
    expect(bad).toEqual([]);
  });

  it('the derived ids are wired onto the live taxonomy entries', () => {
    const mismatches: string[] = [];
    for (const m of MISCONCEPTION_TAXONOMY) {
      const expected = map[m.id]?.questionIds ?? [];
      if (JSON.stringify(m.questionIds) !== JSON.stringify(expected)) {
        mismatches.push(`${m.id}: entry=${JSON.stringify(m.questionIds)} map=${JSON.stringify(expected)}`);
      }
    }
    expect(mismatches, `taxonomy.questionIds out of sync: ${mismatches.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('reports coverage (informational)', () => {
    const total = MISCONCEPTION_TAXONOMY.length;
    const covered = Object.keys(map).length;
    const linkedQ = new Set(Object.values(map).flatMap((e) => e.questionIds)).size;
    console.info(`  ℹ misconceptionQuestionMap: ${covered}/${total} misconceptions linked, ${linkedQ} distinct questions`);
    expect(covered).toBeGreaterThan(0);
  });
});
