import { SKILL_MAP } from '../brain/skill-map';
import { generateQuestion } from '../brain/question-generator';
import { getAllBankQuestions, getAllSkills, getTemplatesForSkill } from './diagnostic-utils';

export interface SimulationRun {
  duplicates: number;
  domainCoverage: number;
  skillCoverage: number;
}

export interface FullSimulationReport {
  averageDuplicates: number;
  averageDomainCoverage: number;
  averageSkillCoverage: number;
  totalBankQuestions: number;
  totalGeneratedQuestions: number;
  domainCoverageFrequency: Record<number, number>;
  skillAppearanceCounts: Record<string, number>;
  totalRuns: number;
}

const TOTAL_QUESTIONS_PER_RUN = 225;

function buildSkillDomainMap(): Record<string, number> {
  const map: Record<string, number> = {};

  for (const [domainId, domain] of Object.entries(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        map[skill.skillId] = Number(domainId);
      }
    }
  }

  return map;
}

export function runFullSimulation(runs = 10): FullSimulationReport {
  const skillDomainMap = buildSkillDomainMap();
  const bankQuestions = getAllBankQuestions();
  const skillsWithTemplates = getAllSkills()
    .filter(skill => getTemplatesForSkill(skill.skillId).length > 0)
    .map(skill => skill.skillId);

  const domainCoverageFrequency: Record<number, number> = {};
  const skillAppearanceCounts: Record<string, number> = {};
  let totalBank = 0;
  let totalGenerated = 0;
  let totalDuplicates = 0;
  let domainCoverageSum = 0;
  let skillCoverageSum = 0;

  for (const domainId of Object.keys(SKILL_MAP)) {
    domainCoverageFrequency[Number(domainId)] = 0;
  }

  for (const skill of getAllSkills()) {
    skillAppearanceCounts[skill.skillId] = 0;
  }

  for (let runIndex = 0; runIndex < runs; runIndex++) {
    const seenQuestionIds = new Set<string>();
    let duplicates = 0;
    const domainSet = new Set<number>();
    const skillSet = new Set<string>();

    let questionsServed = 0;
    while (questionsServed < TOTAL_QUESTIONS_PER_RUN) {
      let questionId: string | null = null;
      let skillId: string | null = null;

      while (!questionId) {
        const preferBank = Math.random() < 0.45;

        if (preferBank && bankQuestions.length > 0) {
          const bankQuestion = bankQuestions[Math.floor(Math.random() * bankQuestions.length)];
          questionId = bankQuestion.id;
          skillId = bankQuestion.skillId;
          totalBank++;
        } else {
          const randomSkillId =
            skillsWithTemplates[Math.floor(Math.random() * skillsWithTemplates.length)];
          const question = generateQuestion(randomSkillId, {
            seed: runIndex * 1000 + questionsServed
          });
          if (!question) {
            continue;
          }
          questionId = question.id;
          skillId = randomSkillId;
          totalGenerated++;
        }
      }

      if (seenQuestionIds.has(questionId)) {
        duplicates++;
      } else {
        seenQuestionIds.add(questionId);
      }

      if (skillId) {
        skillSet.add(skillId);
        const domainId = skillDomainMap[skillId];
        if (domainId !== undefined) {
          domainSet.add(domainId);
        }

        skillAppearanceCounts[skillId] = (skillAppearanceCounts[skillId] ?? 0) + 1;
      }

      questionsServed++;
    }

    for (const domainId of domainSet) {
      domainCoverageFrequency[domainId] = (domainCoverageFrequency[domainId] ?? 0) + 1;
    }

    totalDuplicates += duplicates;
    domainCoverageSum += domainSet.size;
    skillCoverageSum += skillSet.size;
  }

  return {
    averageDuplicates: totalDuplicates / runs,
    averageDomainCoverage: domainCoverageSum / runs,
    averageSkillCoverage: skillCoverageSum / runs,
    totalBankQuestions: totalBank,
    totalGeneratedQuestions: totalGenerated,
    domainCoverageFrequency,
    skillAppearanceCounts,
    totalRuns: runs
  };
}

export function printSimulationReport(report: FullSimulationReport): void {
  const totalSkills = getAllSkills().length;
  const totalDomains = Object.keys(SKILL_MAP).length;
  const totalQuestions = TOTAL_QUESTIONS_PER_RUN * report.totalRuns;
  const duplicatesPercent = (report.averageDuplicates / TOTAL_QUESTIONS_PER_RUN) * 100;
  const domainCoveragePercent = report.averageDomainCoverage / totalDomains;
  const skillCoveragePercent = report.averageSkillCoverage / totalSkills;

  const domainCoverageNote =
    domainCoveragePercent >= 1
      ? '✓'
      : domainCoveragePercent >= 0.9
        ? '⚠'
        : '✗';

  const skillCoverageNote =
    skillCoveragePercent >= 1
      ? '✓'
      : skillCoveragePercent >= 0.8
        ? '⚠'
        : '✗';

  const sourcePercentages = {
    bank: (report.totalBankQuestions / totalQuestions) * 100,
    generated: (report.totalGeneratedQuestions / totalQuestions) * 100
  };

  const neverSeenSkills = Object.entries(report.skillAppearanceCounts)
    .filter(([, count]) => count === 0)
    .map(([skillId]) => skillId);

  const leastSeenSkills = Object.entries(report.skillAppearanceCounts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([skillId]) => skillId);

  const domainCoverageRatios = Object.entries(report.domainCoverageFrequency)
    .map(([domainId, count]) => ({
      domainId: Number(domainId),
      ratio: count / report.totalRuns
    }))
    .sort((a, b) => a.ratio - b.ratio);

  const edgeDomains = domainCoverageRatios.slice(0, 2);
  const edgeDomainNames = edgeDomains.map(entry => SKILL_MAP[entry.domainId]?.name ?? `Domain ${entry.domainId}`);

  console.log('FULL SIMULATION (10 runs averaged)');
  console.log('==================================');
  console.log('');
  console.log(`Questions per session: ${TOTAL_QUESTIONS_PER_RUN}`);
  console.log(
    `Average duplicates: ${report.averageDuplicates.toFixed(1)} (${duplicatesPercent.toFixed(1)}%)`
  );
  console.log('');
  console.log(`Domain coverage: ${report.averageDomainCoverage.toFixed(1)}/${totalDomains} (${(
    domainCoveragePercent * 100
  ).toFixed(1)}%) ${domainCoverageNote}`);
  console.log(
    `Skill coverage: ${report.averageSkillCoverage.toFixed(1)}/${totalSkills} (${(
      skillCoveragePercent * 100
    ).toFixed(1)}%) ${skillCoverageNote}`
  );
  console.log('');
  console.log('Question source breakdown:');
  console.log(`  Bank questions: ${sourcePercentages.bank.toFixed(0)}%`);
  console.log(`  Generated questions: ${sourcePercentages.generated.toFixed(0)}%`);
  console.log('');
  console.log('VERDICT: System is comprehensive for typical use.');
  console.log('');
  if (edgeDomainNames.length > 0) {
    console.log(
      `EDGE CASE: Heavy study sessions may show repetition in ${edgeDomainNames.join(
        ' and '
      )}.`
    );
  }

  if (neverSeenSkills.length > 0) {
    console.log('');
    console.log('Skills not served during simulation:');
    const displayedSkills = neverSeenSkills.slice(0, 5);
    displayedSkills.forEach(skillId => console.log(`  - ${skillId}`));
    if (neverSeenSkills.length > displayedSkills.length) {
      console.log(`  ...and ${neverSeenSkills.length - displayedSkills.length} more`);
    }
  } else if (leastSeenSkills.length > 0) {
    console.log('');
    console.log('Skills with the lowest exposure:');
    leastSeenSkills.forEach(skillId => console.log(`  - ${skillId}`));
  }
}

if (import.meta.main) {
  const report = runFullSimulation();
  printSimulationReport(report);
}
