import type { Domain, Skill } from '../types/content';
import type { UserResponse } from '../brain/weakness-detector';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { APPROACHING_THRESHOLD, DEMONSTRATING_THRESHOLD, PROFICIENCY_META } from './skillProficiency';
import type { MissedConceptSummary } from '../types/diagnosticSummary';

export const DOMAIN_READY_THRESHOLD = DEMONSTRATING_THRESHOLD;
export const DOMAIN_BUILDING_THRESHOLD = APPROACHING_THRESHOLD;
export const OVERALL_READY_THRESHOLD = DEMONSTRATING_THRESHOLD;
export const OVERALL_BUILDING_THRESHOLD = APPROACHING_THRESHOLD;

export type ReadinessTone = 'ready' | 'building' | 'priority';

// MissedConceptSummary is defined in src/types/diagnosticSummary.ts and re-exported here
// so existing callers that import it from assessmentReport keep working.
export type { MissedConceptSummary };

export interface ReportSkillSummary {
  skillId: string;
  skillName: string;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  /** Concepts that were missed in wrong answers. Empty array when none missed. */
  missedConcepts: MissedConceptSummary[];
}

export interface FoundationalGapSummary {
  skillId: string;
  skillName: string;
  triggeredBy: string[];
  reason?: string;
  domainIds: number[];
}

export interface DomainReportSummary {
  id: number;
  name: string;
  correct: number;
  total: number;
  score: number;
  tone: ReadinessTone;
  strengths: ReportSkillSummary[];
  weaknesses: ReportSkillSummary[];
  foundationalGaps: FoundationalGapSummary[];
  recommendations: string[];
}

export interface AssessmentReportModel {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  overallScore: number;
  readiness: {
    label: string;
    tone: ReadinessTone;
    description: string;
    nextAction: string;
  };
  highestNeedDomains: DomainReportSummary[];
  strongestDomains: DomainReportSummary[];
  domainSummaries: DomainReportSummary[];
  foundationalGaps: FoundationalGapSummary[];
  strengths: ReportSkillSummary[];
  /** Skills with the most incorrect answers — includes missedConcepts (Step 2 unstrip). */
  weaknesses: ReportSkillSummary[];
}

interface SkillAttemptSummary extends ReportSkillSummary {
  domainIds: Set<number>;
  /** Internal concept tracking: concept → count of incorrect answers touching it */
  missedConceptCounts: Map<string, number>;
}

function toDomainName(domainId: number, domains: Domain[]): string {
  return domains.find(domain => Number(domain.id) === domainId)?.name || `Domain ${domainId}`;
}

function getSkillName(skillId: string, skills: Skill[]): string {
  const match = skills.find(skill => skill.id === skillId);
  return match?.name || skillId;
}

function getTone(score: number): ReadinessTone {
  if (score >= DOMAIN_READY_THRESHOLD) {
    return 'ready';
  }
  if (score >= DOMAIN_BUILDING_THRESHOLD) {
    return 'building';
  }
  return 'priority';
}

function summarizeReadiness(
  overallScore: number,
  highestNeedDomains: DomainReportSummary[]
): AssessmentReportModel['readiness'] {
  const topDomainNames = highestNeedDomains.slice(0, 2).map(domain => domain.name);
  const focusText = topDomainNames.length > 0 ? topDomainNames.join(' and ') : 'your lowest domains';

  if (overallScore >= OVERALL_READY_THRESHOLD) {
    return {
      label: PROFICIENCY_META.proficient.label,
      tone: 'ready',
      description: `You are meeting the threshold overall. Keep reinforcing ${focusText} so strong performance stays consistent across mixed practice.`,
      nextAction: `Start mixed review and focus first on ${focusText}.`
    };
  }

  if (overallScore >= OVERALL_BUILDING_THRESHOLD) {
    return {
      label: PROFICIENCY_META.approaching.label,
      tone: 'building',
      description: `You are nearing the threshold overall, but gaps in ${focusText} are still limiting consistent application.`,
      nextAction: `Review the weakest areas below, then use mixed review to reinforce them.`
    };
  }

  return {
    label: PROFICIENCY_META.emerging.label,
    tone: 'priority',
    description: `Your results show foundational gaps, especially in ${focusText}. Start with remediation and core concepts before pushing into harder mixed practice.`,
    nextAction: `Review foundational concepts first, then begin mixed review in your weakest domain.`
  };
}

export function buildAssessmentReportModel(
  responses: UserResponse[],
  questions: AnalyzedQuestion[],
  domains: Domain[],
  skills: Skill[]
): AssessmentReportModel {
  const questionMap = new Map(questions.map(question => [question.id, question]));
  const skillMap = new Map(skills.map(skill => [skill.id, skill]));
  const domainStats = new Map<number, { correct: number; total: number }>();
  const skillStats = new Map<string, SkillAttemptSummary>();

  responses.forEach((response) => {
    const question = questionMap.get(response.questionId);
    if (!question) {
      return;
    }

    const domainIds = [...new Set(question.domains || [])];
    domainIds.forEach((domainId) => {
      const current = domainStats.get(domainId) || { correct: 0, total: 0 };
      current.total += 1;
      if (response.isCorrect) {
        current.correct += 1;
      }
      domainStats.set(domainId, current);
    });

    if (!question.skillId) {
      return;
    }

    const currentSkill = skillStats.get(question.skillId) || {
      skillId: question.skillId,
      skillName: getSkillName(question.skillId, skills),
      attempted: 0,
      correct: 0,
      incorrect: 0,
      score: 0,
      missedConcepts: [],
      domainIds: new Set<number>(),
      missedConceptCounts: new Map<string, number>(),
    };

    currentSkill.attempted += 1;
    if (response.isCorrect) {
      currentSkill.correct += 1;
    } else {
      currentSkill.incorrect += 1;
      (question.keyConcepts || []).forEach((concept) => {
        currentSkill.missedConceptCounts.set(
          concept,
          (currentSkill.missedConceptCounts.get(concept) ?? 0) + 1
        );
      });
    }
    currentSkill.score = currentSkill.attempted > 0 ? currentSkill.correct / currentSkill.attempted : 0;
    domainIds.forEach((domainId) => currentSkill.domainIds.add(domainId));
    skillStats.set(question.skillId, currentSkill);
  });

  const foundationalGapMap = new Map<string, FoundationalGapSummary>();
  skillStats.forEach((skillSummary) => {
    if (skillSummary.incorrect === 0) {
      return;
    }

    const skill = skillMap.get(skillSummary.skillId);
    const prerequisites = skill?.prerequisites || [];

    prerequisites.forEach((prereqId) => {
      const prereqSkill = skillMap.get(prereqId);
      const existing = foundationalGapMap.get(prereqId) || {
        skillId: prereqId,
        skillName: prereqSkill?.name || prereqId,
        triggeredBy: [],
        reason: skill?.prerequisiteReasoning,
        domainIds: []
      };

      existing.triggeredBy = Array.from(new Set([...existing.triggeredBy, skillSummary.skillName]));
      existing.domainIds = Array.from(new Set([...existing.domainIds, ...Array.from(skillSummary.domainIds)]));
      if (!existing.reason && skill?.prerequisiteReasoning) {
        existing.reason = skill.prerequisiteReasoning;
      }
      foundationalGapMap.set(prereqId, existing);
    });
  });

  const domainSummaries = Array.from(domainStats.entries())
    .map(([domainId, stats]) => {
      const score = stats.total > 0 ? stats.correct / stats.total : 0;
      const domainSkillStats = Array.from(skillStats.values()).filter((skill) => skill.domainIds.has(domainId));
      const strengths = domainSkillStats
        .filter((skill) => skill.correct > 0 && skill.score >= DOMAIN_READY_THRESHOLD)
        .sort((a, b) => b.score - a.score || b.correct - a.correct)
        .slice(0, 3)
        .map(({ domainIds: _domainIds, missedConceptCounts: _missedConceptCounts, ...summary }) => ({
          ...summary,
          missedConcepts: [] as MissedConceptSummary[],
        }));
      const weaknesses = domainSkillStats
        .filter((skill) => skill.incorrect > 0)
        .sort((a, b) => b.incorrect - a.incorrect || a.score - b.score)
        .slice(0, 4)
        .map(({ domainIds: _domainIds, missedConceptCounts, ...summary }) => ({
          ...summary,
          missedConcepts: Array.from(missedConceptCounts.entries())
            .map(([concept, count]) => ({
              concept,
              skillId: summary.skillId,
              skillName: summary.skillName,
              count,
            }))
            .sort((a, b) => b.count - a.count),
        }));
      const foundationalGaps = Array.from(foundationalGapMap.values())
        .filter((gap) => gap.domainIds.includes(domainId))
        .slice(0, 3);

      const recommendations: string[] = [];
      if (weaknesses.length > 0) {
        recommendations.push(`Refresh ${weaknesses.slice(0, 2).map((skill) => skill.skillName).join(' and ')}.`);
      }
      if (foundationalGaps.length > 0) {
        recommendations.push(`Review prerequisites: ${foundationalGaps.map((gap) => gap.skillName).join(', ')}.`);
      }
      if (recommendations.length === 0) {
        recommendations.push(`Keep this domain warm with mixed practice and periodic review.`);
      }

      return {
        id: domainId,
        name: toDomainName(domainId, domains),
        correct: stats.correct,
        total: stats.total,
        score,
        tone: getTone(score),
        strengths,
        weaknesses,
        foundationalGaps,
        recommendations
      };
    })
    .sort((a, b) => a.score - b.score || a.id - b.id);

  const highestNeedDomains = domainSummaries.slice(0, 3);
  const strongestDomains = [...domainSummaries]
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, 2);
    
  const validResponses = responses.filter(r => questionMap.has(r.questionId));
  const overallScore = validResponses.length > 0
    ? validResponses.filter((response) => response.isCorrect).length / validResponses.length
    : 0;
    
  const strengths = Array.from(skillStats.values())
    .filter((skill) => skill.correct > 0)
    .sort((a, b) => b.score - a.score || b.correct - a.correct)
    .slice(0, 4)
    .map(({ domainIds: _domainIds, missedConceptCounts: _missedConceptCounts, ...summary }) => ({
      ...summary,
      missedConcepts: [] as MissedConceptSummary[],
    }));

  // Top-level weaknesses with missedConcepts populated (Step 2 unstrip)
  const weaknesses = Array.from(skillStats.values())
    .filter((skill) => skill.incorrect > 0)
    .sort((a, b) => b.incorrect - a.incorrect || a.score - b.score)
    .slice(0, 5)
    .map(({ domainIds: _domainIds, missedConceptCounts, ...summary }) => ({
      ...summary,
      missedConcepts: Array.from(missedConceptCounts.entries())
        .map(([concept, count]) => ({
          concept,
          skillId: summary.skillId,
          skillName: summary.skillName,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    }));

  return {
    totalQuestions: validResponses.length,
    correctAnswers: validResponses.filter((response) => response.isCorrect).length,
    incorrectAnswers: validResponses.filter((response) => !response.isCorrect).length,
    overallScore,
    readiness: summarizeReadiness(overallScore, highestNeedDomains),
    highestNeedDomains,
    strongestDomains,
    domainSummaries,
    foundationalGaps: Array.from(foundationalGapMap.values()).slice(0, 5),
    strengths,
    weaknesses,
  };
}
