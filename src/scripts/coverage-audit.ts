import { Skill } from '../brain/skill-map';
import {
  getAllSkills,
  getTemplatesForSkill,
  getAllBankQuestions,
  formatPercent
} from './diagnostic-utils';

export interface SkillCoverage {
  skillId: Skill['skillId'];
  name: Skill['name'];
  templateCount: number;
  bankQuestionCount: number;
}

export interface CoverageAuditResult {
  totalSkills: number;
  skillsWithTwoPlus: number;
  skillsWithOne: number;
  skillsWithZero: number;
  deadZones: SkillCoverage[];
  lowCoverage: SkillCoverage[];
}

export function runCoverageAudit(): CoverageAuditResult {
  const skills = getAllSkills();
  const bankQuestionCounts = new Map<string, number>();

  for (const question of getAllBankQuestions()) {
    bankQuestionCounts.set(
      question.skillId,
      (bankQuestionCounts.get(question.skillId) ?? 0) + 1
    );
  }

  const coverageData: SkillCoverage[] = skills.map(skill => {
    const templateCount = getTemplatesForSkill(skill.skillId).length;
    const bankQuestionCount = bankQuestionCounts.get(skill.skillId) ?? 0;

    return {
      skillId: skill.skillId,
      name: skill.name,
      templateCount,
      bankQuestionCount
    };
  });

  const deadZones = coverageData.filter(
    data => data.templateCount === 0 && data.bankQuestionCount === 0
  );

  const lowCoverage = coverageData.filter(
    data => data.templateCount === 1 && data.bankQuestionCount < 2
  );

  const skillsWithTwoPlus = coverageData.filter(data => data.templateCount >= 2).length;
  const skillsWithOne = coverageData.filter(data => data.templateCount === 1).length;
  const skillsWithZero = coverageData.filter(data => data.templateCount === 0).length;

  console.log('COVERAGE AUDIT');
  console.log('==============');
  console.log(`Total skills: ${skills.length}`);
  console.log(
    `Skills with 2+ templates: ${skillsWithTwoPlus} (${formatPercent(
      skillsWithTwoPlus / skills.length
    )})`
  );
  console.log(
    `Skills with 1 template: ${skillsWithOne} (${formatPercent(
      skillsWithOne / skills.length
    )})`
  );
  console.log(
    `Skills with 0 templates: ${skillsWithZero} (${formatPercent(
      skillsWithZero / skills.length
    )}) ← CRITICAL`
  );
  console.log('');

  console.log('DEAD ZONES (no templates, no bank questions):');
  if (deadZones.length === 0) {
    console.log('  (none)');
  } else {
    for (const deadZone of deadZones) {
      console.log(`  - ${deadZone.skillId}: ${deadZone.name}`);
    }
  }
  console.log('');

  console.log('LOW COVERAGE (1 template, <2 bank questions):');
  if (lowCoverage.length === 0) {
    console.log('  (none)');
  } else {
    for (const gap of lowCoverage) {
      console.log(`  - ${gap.skillId}: ${gap.name}`);
    }
  }

  return {
    totalSkills: skills.length,
    skillsWithTwoPlus,
    skillsWithOne,
    skillsWithZero,
    deadZones,
    lowCoverage
  };
}

if (import.meta.main) {
  runCoverageAudit();
}
