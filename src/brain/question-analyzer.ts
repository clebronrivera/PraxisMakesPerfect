import questionSkillMapData from '../data/question-skill-map.json';
import { Distractor } from './answer-generator';
import { resolveProgressDomainId } from '../utils/progressTaxonomy';

export interface Question {
  id: string;
  UNIQUEID?: string;
  question?: string;
  questionStem?: string;
  question_stem?: string;
  choices?: Record<string, string>;
  options?: { letter: string; text: string }[];
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  F?: string;
  correct_answer?: string[];
  correctAnswers?: string[];
  correct_answers?: string;
  rationale?: string;
  correctExplanation?: string;
  CORRECT_Explanation?: string;
  skillId?: string;
  current_skill_id?: string;
  domainName?: string;
  domain_name?: string;
  DOMAIN?: number | string;
  domain?: number | string;
  isMultiSelect?: boolean;
  is_multi_select?: boolean | string;
  cognitiveComplexity?: 'Recall' | 'Application' | string;
  cognitive_complexity?: 'Recall' | 'Application' | string;
  distractors?: Distractor[];
  metadata?: any;
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
  isFoundational?: boolean; // true for vetted anchor questions (entry-point priority)
  source?: 'bank' | 'generated';
  templateId?: string; // For generated questions, shows which template was used
  isMultiSelect?: boolean;
  cognitiveComplexity?: 'Recall' | 'Application' | string;
  distractors?: Distractor[];
  metadata?: any;
}

export function getQuestionPrompt(q: Pick<Question, 'question' | 'questionStem'>): string {
  return q.question || q.questionStem || (q as Question).question_stem || '';
}

export function getQuestionChoices(q: Pick<Question, 'choices' | 'options'>): Record<string, string> {
  if (q.choices) {
    return q.choices;
  }

  if (!q.options) {
    const rawQuestion = q as Question;
    const letterChoices = ['A', 'B', 'C', 'D', 'E', 'F']
      .map((letter) => [letter, rawQuestion[letter as keyof Question]])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0);

    return Object.fromEntries(letterChoices);
  }

  return Object.fromEntries(
    q.options.map(option => [option.letter, option.text])
  );
}

export function getQuestionChoiceText(
  q: Pick<Question, 'choices' | 'options'>,
  letter: string
): string {
  const choices = getQuestionChoices(q);
  return choices[letter] || '';
}

export function getQuestionCorrectAnswers(
  q: Pick<Question, 'correct_answer' | 'correctAnswers'>
): string[] {
  const rawAnswers = (q as Question).correct_answers;
  if (Array.isArray(q.correct_answer) && q.correct_answer.length > 0) {
    return q.correct_answer;
  }

  if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
    return q.correctAnswers;
  }

  if (typeof rawAnswers === 'string' && rawAnswers.trim().length > 0) {
    return rawAnswers
      .split(',')
      .map(answer => answer.trim())
      .filter(Boolean);
  }

  return [];
}

export function getQuestionRationale(
  q: Pick<Question, 'rationale' | 'correctExplanation'>
): string {
  return q.rationale || q.correctExplanation || (q as Question).CORRECT_Explanation || '';
}

export function getQuestionIdentifierLabel(q: Pick<Question, 'id'>): string {
  return q.id || (q as Question).UNIQUEID || 'Unknown question';
}

export function isQuestionSelectionCorrect(
  q: Pick<Question, 'correct_answer' | 'correctAnswers'>,
  selectedAnswers: string[]
): boolean {
  const correctAnswers = getQuestionCorrectAnswers(q);
  return (
    selectedAnswers.every(answer => correctAnswers.includes(answer)) &&
    selectedAnswers.length === correctAnswers.length
  );
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
  const questionText = getQuestionPrompt(q);
  const choices = getQuestionChoices(q);
  const correctAnswers = getQuestionCorrectAnswers(q);
  const rationale = getQuestionRationale(q);
  const questionId = q.id || q.UNIQUEID || 'unknown-question';
  const resolvedSkillId = q.skillId || q.current_skill_id || QUESTION_SKILL_LOOKUP[questionId];
  const text = questionText.toLowerCase();
  
  // Resolve the Praxis domain from the canonical skill map first.
  let domainId: number | undefined;

  const rawDomainName = q.domainName || q.domain_name;

  if (rawDomainName && PRAXIS_DOMAIN_MAP[rawDomainName]) {
    domainId = PRAXIS_DOMAIN_MAP[rawDomainName];
  } else if (q.DOMAIN !== undefined) {
    domainId = typeof q.DOMAIN === 'number' ? q.DOMAIN : parseInt(q.DOMAIN as string);
  } else {
    if (q.domain !== undefined) {
      domainId = typeof q.domain === 'number' ? q.domain : parseInt(q.domain as string);
    }
  }

  const domains = [resolveProgressDomainId(resolvedSkillId, domainId)];
  
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
    id: questionId,
    question: questionText,
    questionStem: q.questionStem || q.question_stem || questionText,
    choices,
    options: q.options || Object.entries(choices).map(([letter, choiceText]) => ({
      letter,
      text: choiceText
    })),
    correct_answer: correctAnswers,
    correctAnswers,
    rationale,
    skillId: resolvedSkillId,
    domainName: rawDomainName,
    domains,
    dok,
    questionType: isScenario ? 'Scenario-Based' : 'Direct Knowledge',
    stemType,
    keyConcepts,
    isMultiSelect: q.isMultiSelect ?? String(q.is_multi_select).toLowerCase() === 'true',
    cognitiveComplexity: q.cognitiveComplexity || q.cognitive_complexity,
    isFoundational: (q as any).is_foundational === true || (q as any).is_foundational === 'true',
    source: 'bank' // Questions from questions.json are from the bank
  };
}
