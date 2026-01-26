import { AnalyzedQuestion } from './question-analyzer';
import { PatternId } from './template-schema';

export interface UserResponse {
  questionId: string;
  selectedAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
  timeSpent: number;
  confidence: 'low' | 'medium' | 'high';
  timestamp: number;
  selectedDistractor?: {
    letter: string;
    text: string;
    patternId?: PatternId;
  };
}

export function detectWeaknesses(
  responses: UserResponse[],
  questions: AnalyzedQuestion[]
): {
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  domainScores: Record<number, { correct: number; total: number }>;
} {
  const domainScores: Record<number, { correct: number; total: number }> = {};
  const errorPatterns: Record<string, number> = {};
  const factualGaps: string[] = [];
  
  // Initialize all domains
  for (let i = 1; i <= 10; i++) {
    domainScores[i] = { correct: 0, total: 0 };
  }
  
  // Analyze each response
  for (const response of responses) {
    const question = questions.find(q => q.id === response.questionId);
    if (!question) continue;
    
    // Update domain scores
    for (const domain of question.domains) {
      domainScores[domain].total++;
      if (response.isCorrect) {
        domainScores[domain].correct++;
      }
    }
    
    // If wrong, analyze why
    if (!response.isCorrect) {
      // Check for pattern in wrong answer
      const selectedText = response.selectedAnswers
        .map(a => question.choices[a])
        .join(' ')
        .toLowerCase();
      
      // Detect error patterns
      if (selectedText.includes('immediately') || selectedText.includes('refer')) {
        errorPatterns['prematureAction'] = (errorPatterns['prematureAction'] || 0) + 1;
      }
      if (selectedText.includes('take over') || selectedText.includes('prescribe')) {
        errorPatterns['roleConfusion'] = (errorPatterns['roleConfusion'] || 0) + 1;
      }
      
      // Track concepts missed
      for (const concept of question.keyConcepts) {
        if (!factualGaps.includes(concept)) {
          factualGaps.push(concept);
        }
      }
    }
  }
  
  // Find weakest domains (score < 60%)
  const weakestDomains = Object.entries(domainScores)
    .filter(([_, score]) => score.total > 0 && (score.correct / score.total) < 0.6)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .map(([domain]) => parseInt(domain));
  
  // Get top error patterns
  const topErrorPatterns = Object.entries(errorPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern]) => pattern);
  
  return {
    weakestDomains,
    factualGaps: factualGaps.slice(0, 10),
    errorPatterns: topErrorPatterns,
    domainScores
  };
}
