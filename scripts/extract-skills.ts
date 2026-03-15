import { SKILL_MAP } from '../src/brain/skill-map';
import * as fs from 'fs';

const skills: Record<string, any> = {};

Object.values(SKILL_MAP).forEach((domain: any) => {
  domain.clusters.forEach((cluster: any) => {
    cluster.skills.forEach((skill: any) => {
      skills[skill.skillId] = {
        id: skill.skillId,
        name: skill.name,
        definition: skill.description,
        decisionRule: skill.decisionRule,
        domainId: domain.domainId,
        domainName: domain.name
      };
    });
  });
});

const content = `export interface SkillStudyGuide {
  id: string;
  name: string;
  definition: string;
  decisionRule: string;
  domainId: number;
  domainName: string;
}

export const skillStudyGuide: Record<string, SkillStudyGuide> = ${JSON.stringify(skills, null, 2)};
`;

fs.writeFileSync('./src/data/skill-study-guide.ts', content);
console.log(`Extracted ${Object.keys(skills).length} skills.`);
