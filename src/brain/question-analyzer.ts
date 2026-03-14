import questionSkillMapData from '../data/question-skill-map.json';

export interface Question {
  id: string;
  question?: string;
  questionStem?: string;
  choices?: Record<string, string>;
  options?: { letter: string; text: string }[];
  correct_answer?: string[];
  correctAnswers?: string[];
  rationale?: string;
  correctExplanation?: string;
  skillId?: string;
  domainName?: string;
  DOMAIN?: number | string;
  domain?: number | string;
  isMultiSelect?: boolean;
  cognitiveComplexity?: 'Recall' | 'Application' | string;
}

export interface AnalyzedQuestion extends Question {
  domains?: number[];
  domainName?: string;
  dok?: number;
  questionType?: string;
  hasCaseVignette?: boolean;
  caseText?: string;
  stemType?: string;
  keyConcepts?: string[];
  skillId?: string;
  isGenerated?: boolean;
  source?: 'bank' | 'generated';
  templateId?: string; // For generated questions, shows which template was used
  isMultiSelect?: boolean;
  cognitiveComplexity?: 'Recall' | 'Application' | string;
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
const questionSkillMap = questionSkillMapData as QuestionSkillMapSchema;
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

const PRAXIS_DOMAIN_MAP: Record<string, number> = { 
  'Professional Practices that Permeate All Aspects of Service Delivery': 1, 
  'Direct and Indirect Services for Children, Families, and Schools (Student-Level Services)': 2, 
  'Systems-Level Services': 3, 
  'Foundations of School Psychological Service Delivery': 4,
  // Keep fallbacks just in case
  'Professional Practices': 1,
  'Student-Level Services': 2,
  'Foundations': 4
};

export function analyzeQuestion(q: Question): AnalyzedQuestion {
  const text = (q.question || q.questionStem || '').toLowerCase();
  
  // Detect domains based on PRAXIS_DOMAIN_MAP and q.DOMAIN
  let domainId: number | undefined;
  
  // Read q.domainName first, fall back to numeric q.DOMAIN field
  if (q.domainName && PRAXIS_DOMAIN_MAP[q.domainName]) {
    domainId = PRAXIS_DOMAIN_MAP[q.domainName];
  } else if (q.DOMAIN !== undefined) {
    domainId = typeof q.DOMAIN === 'number' ? q.DOMAIN : parseInt(q.DOMAIN as string);
  } else {
    // Log warning if neither domainName nor DOMAIN is present
    console.warn(`[QuestionAnalyzer] No domainName or DOMAIN for question ${q.id}. Falling back.`);
    // Fall back to original domain field if available
    if (q.domain !== undefined) {
      domainId = typeof q.domain === 'number' ? q.domain : parseInt(q.domain as string);
    }
  }

  if (!domainId || domainId < 1 || domainId > 4) {
    domainId = 1; // Default fallback
  }

  const domains = [domainId];
  
  // Detect question type
  const scenarioIndicators = ['school psychologist', 'teacher', 'student', 'parent', 'dr.'];
  const isScenario = scenarioIndicators.some(ind => text.includes(ind)) && text.length > 150;
  
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
  
  // Extract key concepts being tested (Requires generic domain array passed in next iteration, 
  // bypassing hardcoded extraction for now to decouple it)
  const keyConcepts: string[] = [];
  // For now, keyConcepts can be mapped later when we have complete Domain integration in context.
  
  return {
    ...q,
    skillId: q.skillId || QUESTION_SKILL_LOOKUP[q.id],
    domains,
    dok,
    questionType: isScenario ? 'Scenario-Based' : 'Direct Knowledge',
    stemType,
    keyConcepts,
    source: 'bank' // Questions from questions.json are from the bank
  };
}
