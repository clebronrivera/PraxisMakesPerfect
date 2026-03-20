import type { Skill } from '../types/content';
import type { SkillPerformance } from '../brain/learning-state';
import {
  getProgressDomainDefinition,
  getProgressSkillDefinition,
  getProgressSkillsForDomain,
  PROGRESS_DOMAINS,
  type PraxisDomainId
} from './progressTaxonomy';
import { getSkillProficiency, PROFICIENCY_META } from './skillProficiency';

export type SkillColorState = 'gray' | 'red' | 'yellow' | 'green';

export interface SkillProgressSummary {
  skillId: string;
  fullLabel: string;
  shortLabel: string;
  domainId: PraxisDomainId;
  domainName: string;
  attempted: number;
  correct: number;
  score: number | null;
  colorState: SkillColorState;
  statusLabel: string;
  prerequisites: string[];
  prerequisiteNames: string[];
}

export interface DomainProgressSummary {
  domainId: PraxisDomainId;
  domainName: string;
  subtitle: string;
  attempted: number;
  correct: number;
  score: number | null;
  activeSkillCount: number;
  assessedSkillCount: number;
  weakSkillCount: number;
  developingSkillCount: number;
  strongerSkillCount: number;
  skills: SkillProgressSummary[];
}

export interface ProgressSummary {
  domains: DomainProgressSummary[];
  skills: SkillProgressSummary[];
  weakestDomainId: PraxisDomainId | null;
}

function getColorState(score: number | null, attempted: number): SkillColorState {
  const tier = getSkillProficiency(score ?? 0, attempted);

  switch (tier) {
    case 'unstarted':
      return 'gray';
    case 'emerging':
      return 'red';
    case 'approaching':
      return 'yellow';
    case 'proficient':
      return 'green';
  }
}

function getStatusLabel(colorState: SkillColorState): string {
  switch (colorState) {
    case 'gray':
      return PROFICIENCY_META.unstarted.label;
    case 'red':
      return PROFICIENCY_META.emerging.label;
    case 'yellow':
      return PROFICIENCY_META.approaching.label;
    case 'green':
      return PROFICIENCY_META.proficient.label;
    default:
      return PROFICIENCY_META.unstarted.label;
  }
}

function getPrerequisiteNames(skillId: string, allSkills: Skill[]): { ids: string[]; names: string[] } {
  const match = allSkills.find((skill) => skill.id === skillId);
  const prerequisites = match?.prerequisites ?? [];
  const names = prerequisites.map((prereqId) => (
    allSkills.find((skill) => skill.id === prereqId)?.name ||
    getProgressSkillDefinition(prereqId)?.fullLabel ||
    prereqId
  ));

  return {
    ids: prerequisites,
    names
  };
}

function buildSkillSummary(
  skillId: string,
  performance: SkillPerformance | undefined,
  allSkills: Skill[]
): SkillProgressSummary | null {
  const definition = getProgressSkillDefinition(skillId);
  if (!definition) {
    return null;
  }

  const attempted = performance?.attempts ?? 0;
  const correct = performance?.correct ?? 0;
  const score = attempted > 0 ? correct / attempted : null;
  const colorState = getColorState(score, attempted);
  const prerequisiteInfo = getPrerequisiteNames(skillId, allSkills);

  return {
    skillId,
    fullLabel: definition.fullLabel,
    shortLabel: definition.shortLabel,
    domainId: definition.domainId,
    domainName: getProgressDomainDefinition(definition.domainId)?.name || `Domain ${definition.domainId}`,
    attempted,
    correct,
    score,
    colorState,
    statusLabel: getStatusLabel(colorState),
    prerequisites: prerequisiteInfo.ids,
    prerequisiteNames: prerequisiteInfo.names
  };
}

export function buildProgressSummary(
  skillScores: Record<string, SkillPerformance>,
  allSkills: Skill[] = []
): ProgressSummary {
  const skills = Object.keys(skillScores);
  const summaries = skills
    .map((skillId) => buildSkillSummary(skillId, skillScores[skillId], allSkills))
    .filter((summary): summary is SkillProgressSummary => Boolean(summary));

  const missingSkills = PROGRESS_DOMAINS.flatMap((domain) => (
    getProgressSkillsForDomain(domain.id)
      .filter((skill) => !skillScores[skill.skillId])
      .map((skill) => buildSkillSummary(skill.skillId, undefined, allSkills))
  )).filter((summary): summary is SkillProgressSummary => Boolean(summary));

  const allSkillSummaries = [...summaries, ...missingSkills]
    .sort((a, b) => {
      if (a.domainId !== b.domainId) {
        return a.domainId - b.domainId;
      }

      if (a.attempted === 0 && b.attempted > 0) {
        return 1;
      }

      if (b.attempted === 0 && a.attempted > 0) {
        return -1;
      }

      if (a.score !== null && b.score !== null && a.score !== b.score) {
        return a.score - b.score;
      }

      return a.skillId.localeCompare(b.skillId);
    });

  const domains = PROGRESS_DOMAINS.map((domain) => {
    const domainSkills = allSkillSummaries.filter((skill) => skill.domainId === domain.id);
    const attempted = domainSkills.reduce((sum, skill) => sum + skill.attempted, 0);
    const correct = domainSkills.reduce((sum, skill) => sum + skill.correct, 0);
    const score = attempted > 0 ? correct / attempted : null;

    return {
      domainId: domain.id,
      domainName: domain.name,
      subtitle: domain.subtitle,
      attempted,
      correct,
      score,
      activeSkillCount: domainSkills.length,
      assessedSkillCount: domainSkills.filter((skill) => skill.attempted > 0).length,
      weakSkillCount: domainSkills.filter((skill) => skill.colorState === 'red').length,
      developingSkillCount: domainSkills.filter((skill) => skill.colorState === 'yellow').length,
      strongerSkillCount: domainSkills.filter((skill) => skill.colorState === 'green').length,
      skills: domainSkills
    };
  });

  const weakestDomain = [...domains]
    .filter((domain) => domain.attempted > 0 && domain.score !== null)
    .sort((a, b) => {
      if (a.score !== null && b.score !== null && a.score !== b.score) {
        return a.score - b.score;
      }

      return b.weakSkillCount - a.weakSkillCount;
    })[0] || null;

  return {
    domains,
    skills: allSkillSummaries,
    weakestDomainId: weakestDomain?.domainId || null
  };
}
