import skillPhaseDRaw from './skill-phase-d.json';

export interface SkillPhaseDEntry {
  skill_id: string;
  nasp_domain_primary: string;
  skill_prerequisites: string;
  prereq_chain_narrative: string;
}

export const skillPhaseDMap = skillPhaseDRaw as Record<string, SkillPhaseDEntry>;

export function getSkillPhaseDEntry(skillId: string): SkillPhaseDEntry | undefined {
  return skillPhaseDMap[skillId];
}
