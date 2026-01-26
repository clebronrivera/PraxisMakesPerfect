import { Skill, SKILL_MAP } from '../brain/skill-map';
import { QuestionTemplate } from '../brain/template-schema';
import { domain1Templates } from '../brain/templates/domain-1-templates';
import { domain2Templates } from '../brain/templates/domain-2-templates';
import { domain3Templates } from '../brain/templates/domain-3-templates';
import { domain4Templates } from '../brain/templates/domain-4-templates';
import { domain5Templates } from '../brain/templates/domain-5-templates';
import { domain6Templates } from '../brain/templates/domain-6-templates';
import { domain7Templates } from '../brain/templates/domain-7-templates';
import { domain8Templates } from '../brain/templates/domain-8-templates';
import { domain9Templates } from '../brain/templates/domain-9-templates';
import { domain10Templates } from '../brain/templates/domain-10-templates';
import questionBank from '../data/questions.json';

export const ALL_TEMPLATES: QuestionTemplate[] = [
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

export function getAllTemplates(): QuestionTemplate[] {
  return ALL_TEMPLATES;
}

export function getTemplatesForSkill(skillId: string): QuestionTemplate[] {
  return ALL_TEMPLATES.filter(template => template.skillId === skillId);
}

export function getAllSkills(): Skill[] {
  return Object.values(SKILL_MAP).flatMap(domain => domain.clusters.flatMap(cluster => cluster.skills));
}

export function getSkillsForDomain(domainId: number): Skill[] {
  return SKILL_MAP[domainId]?.clusters.flatMap(cluster => cluster.skills) ?? [];
}

export type BankQuestion = typeof questionBank[number];

export function getAllBankQuestions(): BankQuestion[] {
  return questionBank;
}

export function hashQuestion(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}
