import { SKILL_MAP } from '../brain/skill-map';
import { getAllTemplates } from './diagnostic-utils';

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

export function runCapacityTest(): CapacityTestResult {
  const skillMetadata = buildSkillMetadata();
  const skillCapacities = new Map<string, number>();

  for (const template of getAllTemplates()) {
    const slotCounts = Object.values(template.slots).map(slot =>
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
    if (!metadata) continue;

    const roundedCapacity = Math.round(capacity);
    const domainSummary =
      domainSummaries[metadata.domainId] ??
      {
        domainId: metadata.domainId,
        name: metadata.domainName,
        total: 0,
        skills: []
      };

    domainSummary.skills.push({
      skillId,
      name: metadata.name,
      capacity: roundedCapacity
    });
    domainSummary.total += roundedCapacity;
    domainSummaries[metadata.domainId] = domainSummary;
  }

  const orderedDomains = Object.values(domainSummaries).sort((a, b) => a.domainId - b.domainId);
  const systemTotal = orderedDomains.reduce((sum, domain) => sum + domain.total, 0);

  const lowCapacityWarnings: SkillCapacitySummary[] = [];
  for (const domain of orderedDomains) {
    for (const skill of domain.skills) {
      if (skill.capacity < 20) {
        lowCapacityWarnings.push(skill);
      }
    }
  }

  return {
    systemTotal,
    domainSummaries: orderedDomains,
    lowCapacityWarnings
  };
}

if (import.meta.main) {
  const result = runCapacityTest();
  console.log('GENERATION CAPACITY');
  console.log('===================');

  for (const domain of result.domainSummaries) {
    console.log('');
    console.log(`Domain ${domain.domainId}: ${domain.name}`);
    for (const skill of domain.skills) {
      console.log(`  ${skill.skillId}: ${skill.capacity} unique questions possible`);
    }
    console.log(`  Domain total: ${domain.total} questions`);
  }

  console.log('');
  console.log(`SYSTEM TOTAL: ${result.systemTotal} unique questions`);
  console.log('');

  if (result.lowCapacityWarnings.length > 0) {
    console.log('LOW CAPACITY WARNINGS (<20 questions):');
    for (const warning of result.lowCapacityWarnings) {
      console.log(`  - ${warning.skillId}: Only ${warning.capacity} combinations`);
    }
  } else {
    console.log('LOW CAPACITY WARNINGS (<20 questions): none');
  }
}
