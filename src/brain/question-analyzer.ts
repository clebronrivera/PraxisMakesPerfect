import questionSkillMapData from '../data/question-skill-map.json';
import { NASP_DOMAINS } from '../../knowledge-base';

export interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
}

export interface AnalyzedQuestion extends Question {
  domains: number[];
  dok: number;
  questionType: 'Scenario-Based' | 'Direct Knowledge';
  stemType: string;
  keyConcepts: string[];
  skillId?: string;
  isGenerated?: boolean;
  source?: 'bank' | 'generated';
  templateId?: string; // For generated questions, shows which template was used
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface QuestionSkillEntry {
  questionId: string;
  skillId: string;
  confidence: ConfidenceLevel;
}

interface QuestionSkillMapSchema {
  totalQuestions: number;
  mappedQuestions: QuestionSkillEntry[];
}

// Build QUESTION_SKILL_LOOKUP from question-skill-map.json
const questionSkillMap: QuestionSkillMapSchema = questionSkillMapData;
const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1 };

const INTERIM_SKILL_LOOKUP = questionSkillMap.mappedQuestions.reduce<
  Record<string, { skillId: string; confidence: ConfidenceLevel }>
>((acc, entry) => {
  const existing = acc[entry.questionId];
  if (!existing || CONFIDENCE_RANK[entry.confidence] > CONFIDENCE_RANK[existing.confidence]) {
    acc[entry.questionId] = { skillId: entry.skillId, confidence: entry.confidence };
  }
  return acc;
}, {});

const QUESTION_SKILL_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(INTERIM_SKILL_LOOKUP).map(([questionId, value]) => [questionId, value.skillId])
);

export function analyzeQuestion(q: Question): AnalyzedQuestion {
  const text = q.question.toLowerCase();
  const rationale = q.rationale.toLowerCase();
  
  // Detect domains based on content
  const domains: number[] = [];
  
  // Domain detection keywords
  const domainKeywords: Record<number, string[]> = {
    1: ['reliability', 'validity', 'assessment', 'data', 'cbm', 'screening', 'progress monitoring', 'measurement', 'psychometric'],
    2: ['consultation', 'collaborate', 'consultee', 'indirect'],
    3: ['academic', 'intervention', 'reading', 'math', 'instruction', 'tier 2', 'tier 3', 'learning disability'],
    4: ['behavior', 'mental health', 'counseling', 'fba', 'bip', 'anxiety', 'depression', 'suicide', 'social-emotional'],
    5: ['school-wide', 'pbis', 'mtss', 'rti', 'universal', 'tier 1', 'climate'],
    6: ['crisis', 'threat', 'safety', 'prevention', 'responsive'],
    7: ['family', 'parent', 'home-school', 'caregiver'],
    8: ['cultural', 'diversity', 'bias', 'equity', 'ell', 'multicultural', 'disproportional'],
    9: ['research', 'meta-analysis', 'effect size', 'statistical', 'study', 'evidence-based'],
    10: ['ethical', 'legal', 'confidential', 'idea', 'ferpa', 'court case', 'nasp', 'mandated', 'tarasoff']
  };
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => text.includes(kw) || rationale.includes(kw))) {
      domains.push(parseInt(domain));
    }
  }
  
  if (domains.length === 0) domains.push(1); // Default
  
  // Detect question type
  const scenarioIndicators = ['school psychologist', 'teacher', 'student', 'parent', 'dr.'];
  const isScenario = scenarioIndicators.some(ind => text.includes(ind)) && q.question.length > 150;
  
  // Detect stem type
  let stemType = 'Other';
  if (text.includes('first step') || text.includes('should first')) stemType = 'First Step';
  else if (text.includes('most appropriate')) stemType = 'Most Appropriate';
  else if (text.includes('best example')) stemType = 'Best Example';
  else if (text.includes('best describes')) stemType = 'Best Description';
  else if (text.includes('which of the following is the best')) stemType = 'Best Answer';
  
  // Estimate DOK
  let dok = 2;
  if (stemType === 'First Step' || isScenario) dok = 3;
  if (text.includes('definition') || text.includes('which of the following is')) dok = 1;
  
  // Extract key concepts being tested
  const keyConcepts: string[] = [];
  for (const domain of domains) {
    const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
    if (domainInfo?.keyConcepts) {
      for (const concept of domainInfo.keyConcepts) {
        if (text.includes(concept) || rationale.includes(concept)) {
          keyConcepts.push(concept);
        }
      }
    }
  }
  
  return {
    ...q,
    skillId: QUESTION_SKILL_LOOKUP[q.id],
    domains,
    dok,
    questionType: isScenario ? 'Scenario-Based' : 'Direct Knowledge',
    stemType,
    keyConcepts,
    source: 'bank' // Questions from questions.json are from the bank
  };
}
