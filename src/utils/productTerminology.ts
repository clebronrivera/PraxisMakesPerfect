export type ProductTermId =
  | 'screener'
  | 'fullAssessment'
  | 'questionBank'
  | 'practiceQuestionPool';

export interface ProductTermDefinition {
  id: ProductTermId;
  label: string;
  synonyms: string[];
  definition: string;
  codeMeaning: string;
  codeAnchors: string[];
}

// Central place for live product vocabulary that tends to drift in conversation.
export const PRODUCT_TERMINOLOGY: Record<ProductTermId, ProductTermDefinition> = {
  screener: {
    id: 'screener',
    label: 'Screener',
    synonyms: ['skills screener', '50-question screener'],
    definition:
      'The active 50-question short assessment intended to sample skills broadly and seed domain review and study guidance.',
    codeMeaning:
      "Built by buildScreener(). In active code this is the kept short assessment flow and it now logs as assessmentType 'screener' in shared responses.",
    codeAnchors: [
      'src/utils/assessment-builder.ts',
      'src/components/ScreenerAssessment.tsx',
      'src/hooks/useProgressTracking.ts',
      'src/components/ScreenerResults.tsx'
    ]
  },
  fullAssessment: {
    id: 'fullAssessment',
    label: 'Full Assessment',
    synonyms: ['full assessment', 'full Praxis'],
    definition:
      'The 125-question full-length assessment aligned to the Praxis blueprint.',
    codeMeaning:
      "Built by buildFullAssessment() and logged with assessmentType 'full'.",
    codeAnchors: [
      'src/utils/assessment-builder.ts',
      'App.tsx',
      'src/components/FullAssessment.tsx'
    ]
  },
  questionBank: {
    id: 'questionBank',
    label: 'Question Bank',
    synonyms: ['bank', 'canonical bank', 'main bank'],
    definition:
      'The canonical curated set of static questions that the app loads before analysis, assessment building, and practice selection.',
    codeMeaning:
      'Today this primarily means src/data/questions.json, then its analyzed in-memory form (analyzedQuestions).',
    codeAnchors: [
      'src/data/questions.json',
      'src/brain/question-analyzer.ts',
      'App.tsx'
    ]
  },
  practiceQuestionPool: {
    id: 'practiceQuestionPool',
    label: 'Practice Question Pool',
    synonyms: ['practice question bank', 'practice pool', 'mixed review questions'],
    definition:
      'The subset of the canonical question bank currently eligible for mixed review or skill review after filtering, exclusions, and optional domain or skill scoping.',
    codeMeaning:
      'This is not a second saved bank. In the app today it is the derived practiceQuestions/analyzedQuestions pool that the practice selector uses.',
    codeAnchors: [
      'App.tsx',
      'src/hooks/useAdaptiveLearning.ts',
      'src/brain/question-analyzer.ts'
    ]
  }
};

export function getProductTermDefinition(termId: ProductTermId): ProductTermDefinition {
  return PRODUCT_TERMINOLOGY[termId];
}
