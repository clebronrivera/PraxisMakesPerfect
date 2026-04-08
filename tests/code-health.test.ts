import QUESTIONS_DATA from '../src/data/questions.json';
import {
  analyzeQuestion,
  getQuestionChoices,
  getQuestionCorrectAnswers,
  getQuestionPrompt,
  getQuestionRationale,
  isQuestionSelectionCorrect
} from '../src/brain/question-analyzer';
import { generateDiagnosticFeedback } from '../src/brain/diagnostic-feedback';
import { DISTRACTOR_PATTERNS } from '../src/brain/distractor-patterns';
import { ERROR_LIBRARY } from '../src/brain/error-library';
import { FRAMEWORK_STEPS } from '../src/brain/framework-definitions';
import { calculateGlobalScoresFromData } from '../src/utils/globalScoreCalculator';
import { normalizeStudyInputs } from '../src/services/studyPlanService';
import type { UserProfile } from '../src/hooks/useProgressTracking';
import type { EngineConfig } from '../src/types/engine';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runTest(name: string, fn: () => void): TestResult {
  try {
    fn();
    return { name, passed: true };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const question = analyzeQuestion((QUESTIONS_DATA as any[])[0]);

const testProfile: UserProfile = {
  preAssessmentComplete: true,
  domainScores: {},
  skillScores: {} as UserProfile['skillScores'],
  weakestDomains: [question.domains?.[0] ?? 1],
  factualGaps: [],
  errorPatterns: [],
  totalQuestionsSeen: 1,
  streak: 0,
  flaggedQuestions: {},
  distractorErrors: {},
  skillDistractorErrors: {} as UserProfile['skillDistractorErrors'],
  preAssessmentQuestionIds: [],
  fullAssessmentQuestionIds: [],
  recentPracticeQuestionIds: [],
  screenerItemIds: [],
  practiceResponseCount: 0,
  migrationVersion: 1,
  screenerComplete: false,
  diagnosticComplete: false
};

const testEngine: EngineConfig = {
  skills: [],
  domains: [{ id: String(question.domains?.[0] ?? 1), name: 'Foundations', shortName: 'FND' } as any],
  errorLibrary: ERROR_LIBRARY as any,
  frameworkSteps: FRAMEWORK_STEPS as any,
  distractorPatterns: DISTRACTOR_PATTERNS as any
};

function testQuestionNormalization(): TestResult[] {
  return [
    runTest('analyzeQuestion normalizes options into choices', () => {
      const choices = getQuestionChoices(question);
      const answers = getQuestionCorrectAnswers(question);

      assert(question.question === getQuestionPrompt(question), 'Expected normalized question prompt');
      assert(Object.keys(choices).length === 4, `Expected 4 normalized choices, got ${Object.keys(choices).length}`);
      assert(Array.isArray(question.correct_answer) && question.correct_answer.length === 1, 'Expected normalized correct_answer');
      assert(answers[0] === 'B', `Expected correct answer B, got ${answers[0]}`);
      assert(getQuestionRationale(question).length > 0, 'Expected normalized rationale');
    }),
    runTest('isQuestionSelectionCorrect uses normalized answers', () => {
      assert(isQuestionSelectionCorrect(question, ['B']) === true, 'Expected B to be correct');
      assert(isQuestionSelectionCorrect(question, ['A']) === false, 'Expected A to be incorrect');
    })
  ];
}

function testDiagnosticFeedback(): TestResult[] {
  return [
    runTest('generateDiagnosticFeedback handles canonical bank question shape', () => {
      const feedback = generateDiagnosticFeedback(
        {
          id: question.id,
          question: getQuestionPrompt(question),
          choices: getQuestionChoices(question),
          correct_answer: getQuestionCorrectAnswers(question),
          rationale: getQuestionRationale(question),
          skillId: question.skillId
        },
        ['A'],
        false,
        testProfile,
        testEngine
      );

      assert(feedback.isCorrect === false, 'Expected incorrect feedback');
      assert(feedback.selectedAnswerText.length > 0, 'Expected selected answer text');
    })
  ];
}

function testStudyPlanNormalization(): TestResult[] {
  return [
    runTest('normalizeStudyInputs filters invalid screener domains and normalizes assessment rows', () => {
      const normalized = normalizeStudyInputs(
        {
          screenerResponses: [
            { domain_id: 'bad', skill_id: 'LEG-01', is_correct: false, confidence: 'medium' },
            { domain_id: '4', skill_id: 'LEG-01', is_correct: true, confidence: 'high' }
          ],
          responseLogs: [
            {
              assessmentType: 'diagnostic',
              domainIds: ['4', 'x'],
              skillId: 'LEG-01',
              isCorrect: false,
              confidence: 'low',
              selectedAnswers: ['A'],
              correctAnswers: ['D']
            } as any,
            {
              assessmentType: 'full',
              domainId: '2',
              skillId: 'ACA-01',
              isCorrect: true,
              confidence: 'medium',
              selectedAnswers: ['B'],
              correctAnswers: ['B']
            } as any
          ]
        },
        new Map([
          [2, 'Student-Level Services'],
          [4, 'Foundations']
        ]),
        new Map([
          ['LEG-01', 'FERPA'],
          ['ACA-01', 'Academic Intervention']
        ])
      );

      assert(normalized.screenerResponses.length === 1, `Expected 1 screener response, got ${normalized.screenerResponses.length}`);
      assert(normalized.assessmentResponses.length === 2, `Expected 2 assessment responses, got ${normalized.assessmentResponses.length}`);
      assert(normalized.assessmentResponses[0].assessment_type === 'diagnostic', 'Expected diagnostic assessment type');
      assert(normalized.assessmentResponses[1].assessment_type === 'full', 'Expected full assessment type');
    })
  ];
}

function testGlobalScoreCoercion(): TestResult[] {
  return [
    runTest('calculateGlobalScoresFromData coerces mixed domain ids safely', () => {
      const scores = calculateGlobalScoresFromData({
        screenerResponses: [
          { domain_id: '4', skill_id: 'LEG-01', is_correct: true, confidence: 'high' }
        ],
        responseLogs: [
          {
            assessmentType: 'practice',
            domainIds: ['4', 'bad'],
            skillId: 'LEG-01',
            isCorrect: false,
            confidence: 'high'
          }
        ]
      });

      assert(typeof scores.domainScores[4] === 'number', 'Expected numeric domain score for domain 4');
      assert(scores.flaggedSkills.includes('LEG-01'), 'Expected high-confidence wrong skill to be flagged');
    })
  ];
}

function printResults(results: TestResult[]): void {
  const passed = results.filter(result => result.passed).length;
  const failed = results.length - passed;

  console.log('\n🧪 Code Health Regression Tests\n');

  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
    } else {
      console.log(`❌ ${result.name}`);
      console.log(`   ${result.error}`);
    }
  }

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

const results = [
  ...testQuestionNormalization(),
  ...testDiagnosticFeedback(),
  ...testStudyPlanNormalization(),
  ...testGlobalScoreCoercion()
];

printResults(results);
