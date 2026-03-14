import { QuestionTemplate } from './template-schema';
import { SKILL_MAP } from './skill-map';
import { domain1Templates } from './templates/domain-1-templates';
import { domain2Templates } from './templates/domain-2-templates';
import { domain3Templates } from './templates/domain-3-templates';
import { domain4Templates } from './templates/domain-4-templates';
import { domain5Templates } from './templates/domain-5-templates';
import { domain6Templates } from './templates/domain-6-templates';
import { domain7Templates } from './templates/domain-7-templates';
import { domain8Templates } from './templates/domain-8-templates';
import { domain9Templates } from './templates/domain-9-templates';
import { domain10Templates } from './templates/domain-10-templates';

export interface SkillCapacitySummary {
  skillId: string;
  name: string;
  capacity: number;
}

export interface DomainCapacitySummary {
  domainId: number;
  name: string;
  total: number;
  skills: SkillCapacitySummary[];
}

export interface CapacityTestResult {
  systemTotal: number;
  domainSummaries: DomainCapacitySummary[];
  lowCapacityWarnings: SkillCapacitySummary[];
}

const ALL_TEMPLATES: QuestionTemplate[] = [
  ...domain1Templates,
  ...domain2Templates,
  ...domain3Templates,
  ...domain4Templates,
  ...domain5Templates,
  ...domain6Templates,
  ...domain7Templates,
  ...domain8Templates,
  ...domain9Templates,
  ...domain10Templates
];

function buildSkillMetadata() {
  const metadata: Record<string, { name: string; domainId: number; domainName: string }> = {};

  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        metadata[skill.skillId] = {
          name: skill.name,
          domainId: domain.domainId,
          domainName: domain.name
        };
      }
    }
  }

  return metadata;
}

function getAllQuestionTemplates(): QuestionTemplate[] {
  return ALL_TEMPLATES;
}

export function runCapacityTest(
  templates: QuestionTemplate[] = getAllQuestionTemplates()
): CapacityTestResult {
  const skillMetadata = buildSkillMetadata();
  const skillCapacities = new Map<string, number>();

  for (const template of templates) {
    const slotCounts = Object.values(template.slots).map((slot) =>
      Math.max(slot.possibleValues.length, 1)
    );
    const theoreticalCombinations = slotCounts.reduce((acc, count) => acc * count, 1);
    const estimatedValid = theoreticalCombinations * 0.7;

    const existing = skillCapacities.get(template.skillId) ?? 0;
    skillCapacities.set(template.skillId, existing + estimatedValid);
  }

  const domainSummaries: Record<number, DomainCapacitySummary> = {};

  for (const [skillId, capacity] of skillCapacities.entries()) {
    const metadata = skillMetadata[skillId];
    if (!metadata) {
      continue;
    }

    const roundedCapacity = Math.round(capacity);
    const summary =
      domainSummaries[metadata.domainId] ??
      {
        domainId: metadata.domainId,
        name: metadata.domainName,
        total: 0,
        skills: []
      };

    summary.skills.push({
      skillId,
      name: metadata.name,
      capacity: roundedCapacity
    });
    summary.total += roundedCapacity;
    domainSummaries[metadata.domainId] = summary;
  }

  const orderedDomains = Object.values(domainSummaries).sort((a, b) => a.domainId - b.domainId);
  const lowCapacityWarnings: SkillCapacitySummary[] = [];

  for (const domain of orderedDomains) {
    for (const skill of domain.skills) {
      if (skill.capacity < 20) {
        lowCapacityWarnings.push(skill);
      }
    }
  }

  return {
    systemTotal: orderedDomains.reduce((sum, domain) => sum + domain.total, 0),
    domainSummaries: orderedDomains,
    lowCapacityWarnings
  };
}
