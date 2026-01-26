import { getAllSkills, getTemplatesForSkill, hashQuestion } from './diagnostic-utils';
import { generateQuestion } from '../brain/question-generator';

export interface UniquenessResult {
  skillId: string;
  unique: number;
  duplicates: number;
  efficiency: number;
  status: string;
}

export interface UniquenessTestReport {
  results: UniquenessResult[];
  needsMore: { skillId: string; reason: string }[];
}

function determineStatus(unique: number, duplicates: number, efficiency: number): string {
  if (unique >= 50 && duplicates <= 10) {
    return '✓ GOOD';
  }

  if (unique >= 50) {
    return '✓ OK';
  }

  if (unique >= 30) {
    return '⚠ LOW VARIETY';
  }

  return '✗ CRITICAL';
}

export function runUniquenessTest(): UniquenessTestReport {
  const results: UniquenessResult[] = [];
  const needsMore: { skillId: string; reason: string }[] = [];
  const baseSeed = Date.now();

  for (const skill of getAllSkills()) {
    const templates = getTemplatesForSkill(skill.skillId);
    if (templates.length === 0) continue;

    const seenHashes = new Set<string>();
    const generated: string[] = [];
    let attempts = 0;
    let duplicates = 0;

    while (generated.length < 50 && attempts < 200) {
      const question = generateQuestion(skill.skillId, {
        seed: baseSeed + attempts + skill.skillId.length
      });

      if (!question) {
        attempts++;
        continue;
      }

      const choiceString = Object.values(question.choices).join('|');
      const hash = hashQuestion(`${question.question}|${choiceString}`);

      if (seenHashes.has(hash)) {
        duplicates++;
      } else {
        seenHashes.add(hash);
        generated.push(hash);
      }

      attempts++;
    }

    const unique = generated.length;
    const efficiency = attempts === 0 ? 0 : unique / attempts;
    const status = determineStatus(unique, duplicates, efficiency);

    if (unique < 50) {
      const reason =
        unique < 20
          ? 'Very limited variety in available templates/slots'
          : 'Fewer than target unique draws within attempt limit';
      needsMore.push({ skillId: skill.skillId, reason });
    }

    results.push({
      skillId: skill.skillId,
      unique,
      duplicates,
      efficiency,
      status
    });
  }

  console.log('UNIQUENESS STRESS TEST');
  console.log('=======================');
  console.log('Target: 50 unique questions per skill');
  console.log('');
  console.log('Skill        | Unique | Dupes | Efficiency | Status');
  console.log('-------------|--------|-------|------------|--------');

  for (const result of results) {
    const efficiencyPercent = `${Math.round(result.efficiency * 100)}%`;
    console.log(
      `${result.skillId.padEnd(12)} | ${result.unique
        .toString()
        .padStart(6)} | ${result.duplicates.toString().padStart(5)} | ${efficiencyPercent.padStart(
        10
      )} | ${result.status}`
    );
  }

  if (needsMore.length > 0) {
    console.log('');
    console.log('SKILLS NEEDING MORE TEMPLATES/SLOTS:');
    for (const warning of needsMore) {
      console.log(`  - ${warning.skillId}: ${warning.reason}`);
    }
  }

  return {
    results,
    needsMore
  };
}

if (import.meta.main) {
  runUniquenessTest();
}
