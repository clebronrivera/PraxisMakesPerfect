import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { termsForSkill } from '../src/utils/vocabSkillIndex';
import skillVocabData from '../src/data/skill-vocabulary-map.json';
import glossaryData from '../src/data/master-glossary.json';

/**
 * Drift guard for the Vocabulary Fluency Drill.
 *
 * The drill (vocabSkillIndex.ts) and the quiz (vocabQuizGenerator.ts) must both read
 * their term↔skill data from the single canonical source, skill-vocabulary-map.json.
 * These tests fail loudly if a future change re-introduces a second vocab source
 * (the bug Phase 0a fixed) or if a map term loses its glossary definition.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const skills = (skillVocabData as { skills: Record<string, { skillId: string; vocabularyTerms: string[] }> }).skills;
const glossaryTerms = new Set(
  (glossaryData as { terms: { term: string; definition: string }[] }).terms
    .filter((t) => t.definition && t.definition.length > 10)
    .map((t) => t.term.toLowerCase()),
);

describe('vocab drift guard', () => {
  it('every skill-vocabulary-map term has a usable master-glossary definition', () => {
    const orphaned: string[] = [];
    for (const data of Object.values(skills)) {
      for (const term of data.vocabularyTerms) {
        if (!glossaryTerms.has(term.toLowerCase())) orphaned.push(`${data.skillId}:${term}`);
      }
    }
    // No-op glossary filter is what makes all 45 skills fully drillable.
    expect(orphaned, `map terms missing a glossary definition:\n${orphaned.join('\n')}`).toEqual([]);
  });

  it('the drill faithfully reflects the canonical map (per skill, glossary-filtered)', () => {
    for (const [skillId, data] of Object.entries(skills)) {
      const expected = new Set(
        data.vocabularyTerms
          .map((t) => t.toLowerCase())
          .filter((t) => glossaryTerms.has(t)),
      );
      const actual = new Set(termsForSkill(skillId).map((t) => t.toLowerCase()));
      expect(actual, `drill terms diverged from the map for ${skillId}`).toEqual(expected);
    }
  });

  it('both the drill and the quiz import the same canonical vocab source', () => {
    const read = (rel: string) => readFileSync(join(__dirname, rel), 'utf-8');
    const drill = read('../src/utils/vocabSkillIndex.ts');
    const quiz = read('../src/utils/vocabQuizGenerator.ts');
    expect(drill, 'vocabSkillIndex must read skill-vocabulary-map.json').toMatch(/skill-vocabulary-map\.json/);
    expect(quiz, 'vocabQuizGenerator must read skill-vocabulary-map.json').toMatch(/skill-vocabulary-map\.json/);
    // The drill must NOT re-introduce skill-metadata-v1 as a vocab source.
    expect(drill, 'vocabSkillIndex must not import skill-metadata-v1 (drift source)').not.toMatch(
      /from '\.\.\/data\/skill-metadata-v1'/,
    );
  });
});
