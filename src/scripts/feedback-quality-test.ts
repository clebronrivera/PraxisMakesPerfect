// Feedback Quality Test - Tests diagnostic feedback generation
// Part of Phase D Step 10: Test and Validate Adaptive Feedback Quality
// Tests: Error type identification, framework step context, remediation tips, skill guidance

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateDiagnosticFeedback, DiagnosticFeedback } from '../brain/diagnostic-feedback';
import { Question } from '../brain/question-analyzer';
import { UserProfile } from '../hooks/useFirebaseProgress';
import { PatternId } from '../brain/template-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestCase {
  name: string;
  question: Question;
  selectedAnswers: string[];
  isCorrect: boolean;
  expectedPattern?: PatternId;
  expectedFrameworkStep?: string;
  expectedErrorType?: string;
  description: string;
}

// Load questions
const questionsPath = join(__dirname, '../data/questions.json');
const allQuestions: Question[] = JSON.parse(readFileSync(questionsPath, 'utf-8'));

// Create test user profile
function createTestUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    preAssessmentComplete: true,
    domainScores: {},
    skillScores: {},
    weakestDomains: [],
    factualGaps: [],
    errorPatterns: [],
    practiceHistory: [],
    totalQuestionsSeen: 0,
    streak: 0,
    generatedQuestionsSeen: [],
    flaggedQuestions: {},
    distractorErrors: {},
    skillDistractorErrors: {},
    ...overrides
  };
}

// Select 10 diverse test questions
function selectTestQuestions(): Question[] {
  const selected: Question[] = [];
  const seenSkills = new Set<string>();
  const seenDok = new Set<number>();
  const seenFrameworks = new Set<string | null>();

  for (const q of allQuestions) {
    if (selected.length >= 10) break;
    
    // Ensure diversity
    const skillKey = q.skillId || 'none';
    const dokKey = q.dok || 0;
    const frameworkKey = q.frameworkType || 'none';
    
    if (!seenSkills.has(skillKey) || !seenDok.has(dokKey) || !seenFrameworks.has(frameworkKey)) {
      selected.push(q);
      seenSkills.add(skillKey);
      seenDok.add(dokKey);
      seenFrameworks.add(frameworkKey);
    }
  }

  // Fill remaining slots if needed
  if (selected.length < 10) {
    for (const q of allQuestions) {
      if (selected.length >= 10) break;
      if (!selected.includes(q)) {
        selected.push(q);
      }
    }
  }

  return selected.slice(0, 10);
}

// Create test cases with known distractor patterns
function createTestCases(questions: Question[]): TestCase[] {
  const testCases: TestCase[] = [];

  // Create synthetic test cases with known patterns
  const syntheticQuestions: Question[] = [
    {
      id: 'TEST_PREMATURE_ACTION',
      question: 'A school psychologist notices a student struggling with reading. What should be the first step?',
      choices: {
        A: 'Implement a reading intervention immediately',
        B: 'Collect baseline data and assess reading skills',
        C: 'Refer the student for special education evaluation',
        D: 'Contact the parents about the concern'
      },
      correct_answer: ['B'],
      rationale: 'Data collection must come before intervention',
      skillId: 'DBDM-S01',
      dok: 2,
      frameworkType: 'problem-solving',
      frameworkStep: 'data-collection'
    },
    {
      id: 'TEST_ROLE_CONFUSION',
      question: 'A teacher reports a student is disruptive. What should the school psychologist do?',
      choices: {
        A: 'Take over teaching the student directly',
        B: 'Consult with the teacher to develop a behavior plan',
        C: 'Prescribe medication for the student',
        D: 'Make disciplinary decisions for the student'
      },
      correct_answer: ['B'],
      rationale: 'School psychologists consult, not take over teaching',
      skillId: 'CC-S01',
      dok: 2,
      frameworkType: 'consultation',
      frameworkStep: 'consultee-identification'
    },
    {
      id: 'TEST_SEQUENCE_ERROR',
      question: 'What is the correct sequence for problem-solving?',
      choices: {
        A: 'Implement intervention before collecting data',
        B: 'Problem identification → Data collection → Analysis → Intervention',
        C: 'Analysis before problem identification',
        D: 'Intervention before problem identification'
      },
      correct_answer: ['B'],
      rationale: 'Must follow proper sequence',
      skillId: 'DBDM-S01',
      dok: 2,
      frameworkType: 'problem-solving',
      frameworkStep: 'problem-identification'
    },
    {
      id: 'TEST_CONTEXT_MISMATCH',
      question: 'Which assessment tool is appropriate for comprehensive evaluation?',
      choices: {
        A: 'CBM for comprehensive evaluation',
        B: 'Standardized achievement test battery',
        C: 'Screening tool for eligibility determination',
        D: 'Progress monitoring tool for evaluation'
      },
      correct_answer: ['B'],
      rationale: 'CBM is for progress monitoring, not comprehensive evaluation',
      skillId: 'DBDM-S01',
      dok: 2,
      frameworkType: 'problem-solving',
      frameworkStep: 'assessment-selection'
    },
    {
      id: 'TEST_DEFINITION_ERROR',
      question: 'What does FAPE require?',
      choices: {
        A: 'Optimal education for all students',
        B: 'Appropriate education, not optimal',
        C: 'Best possible education',
        D: 'Maximum educational benefit'
      },
      correct_answer: ['B'],
      rationale: 'FAPE requires appropriate, not optimal',
      skillId: 'LEG-S01',
      dok: 1,
      frameworkType: null,
      frameworkStep: null
    },
    {
      id: 'TEST_DATA_IGNORANCE',
      question: 'How should eligibility be determined?',
      choices: {
        A: 'Decide based on teacher reports without reviewing assessment data',
        B: 'Review all assessment data and analyze results',
        C: 'Make determination without data review',
        D: 'Decide immediately without evaluation'
      },
      correct_answer: ['B'],
      rationale: 'Must review data before determining eligibility',
      skillId: 'DBDM-S01',
      dok: 3,
      frameworkType: 'eligibility',
      frameworkStep: 'eligibility-analysis'
    },
    {
      id: 'TEST_EXTREME_LANGUAGE',
      question: 'When should this intervention be used?',
      choices: {
        A: 'Always use this approach for all students',
        B: 'Use when appropriate based on student needs',
        C: 'Never use this approach',
        D: 'Only use this approach, never alternatives'
      },
      correct_answer: ['B'],
      rationale: 'Avoid extreme language, consider context',
      skillId: 'DBDM-S01',
      dok: 2,
      frameworkType: null,
      frameworkStep: null
    }
  ];

  // Add synthetic test cases
  testCases.push({
    name: 'Premature Action Pattern',
    question: syntheticQuestions[0],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'premature-action',
    expectedFrameworkStep: 'data-collection',
    description: 'Testing premature-action pattern with synthetic question'
  });

  testCases.push({
    name: 'Role Confusion Pattern',
    question: syntheticQuestions[1],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'role-confusion',
    expectedFrameworkStep: 'consultee-identification',
    description: 'Testing role-confusion pattern with synthetic question'
  });

  testCases.push({
    name: 'Sequence Error Pattern',
    question: syntheticQuestions[2],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'sequence-error',
    expectedFrameworkStep: 'problem-identification',
    description: 'Testing sequence-error pattern with synthetic question'
  });

  testCases.push({
    name: 'Context Mismatch Pattern',
    question: syntheticQuestions[3],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'context-mismatch',
    expectedFrameworkStep: 'assessment-selection',
    description: 'Testing context-mismatch pattern with synthetic question'
  });

  testCases.push({
    name: 'Definition Error Pattern',
    question: syntheticQuestions[4],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'definition-error',
    description: 'Testing definition-error pattern with synthetic question'
  });

  testCases.push({
    name: 'Data Ignorance Pattern',
    question: syntheticQuestions[5],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'data-ignorance',
    expectedFrameworkStep: 'eligibility-analysis',
    description: 'Testing data-ignorance pattern with synthetic question'
  });

  testCases.push({
    name: 'Extreme Language Pattern',
    question: syntheticQuestions[6],
    selectedAnswers: ['A'],
    isCorrect: false,
    expectedPattern: 'extreme-language',
    description: 'Testing extreme-language pattern with synthetic question'
  });

  // Add real question test cases for diversity
  for (const question of questions.slice(0, 3)) {
    if (question.choices && Object.keys(question.choices).length > 0) {
      const wrongAnswers = Object.keys(question.choices).filter(
        letter => !question.correct_answer.includes(letter) && question.choices[letter]
      );

      if (wrongAnswers.length > 0) {
        testCases.push({
          name: `Real Question - ${question.id}`,
          question,
          selectedAnswers: [wrongAnswers[0]],
          isCorrect: false,
          expectedFrameworkStep: question.frameworkStep || undefined,
          description: `Testing with real question ${question.id} (pattern detection may vary)`
        });
      }
    }
  }

  // Add a correct answer test case
  if (questions.length > 0) {
    const correctQuestion = questions[0];
    testCases.push({
      name: `Correct Answer - ${correctQuestion.id}`,
      question: correctQuestion,
      selectedAnswers: correctQuestion.correct_answer,
      isCorrect: true,
      description: `Testing correct answer feedback for question ${correctQuestion.id}`
    });
  }

  return testCases;
}

// Run a single test case
function runTestCase(testCase: TestCase, userProfile: UserProfile): {
  passed: boolean;
  feedback: DiagnosticFeedback;
  errors: string[];
} {
  const errors: string[] = [];
  const feedback = generateDiagnosticFeedback(
    testCase.question,
    testCase.selectedAnswers,
    testCase.isCorrect,
    userProfile
  );

  // Validate correct answer handling
  if (testCase.isCorrect) {
    if (!feedback.isCorrect) {
      errors.push(`Expected isCorrect=true for correct answer`);
    }
    if (!feedback.masteryStatus) {
      errors.push(`Missing masteryStatus for correct answer`);
    }
    if (feedback.patternId !== null) {
      errors.push(`Expected patternId=null for correct answer, got ${feedback.patternId}`);
    }
  } else {
    // Validate wrong answer handling
    if (feedback.isCorrect) {
      errors.push(`Expected isCorrect=false for wrong answer`);
    }

    // Check pattern identification
    if (testCase.expectedPattern) {
      if (!feedback.patternId) {
        errors.push(`Expected pattern ${testCase.expectedPattern}, but none identified`);
      } else if (feedback.patternId !== testCase.expectedPattern) {
        // For synthetic test cases, this is an error; for real questions, it's a warning
        if (testCase.question.id.startsWith('TEST_')) {
          errors.push(`Expected pattern ${testCase.expectedPattern}, got ${feedback.patternId}`);
        } else {
          console.warn(`  ⚠ Pattern mismatch: expected ${testCase.expectedPattern}, got ${feedback.patternId}`);
        }
      }
    }

    // Check framework guidance
    if (testCase.expectedFrameworkStep) {
      if (!feedback.frameworkGuidance) {
        errors.push(`Expected framework guidance for step ${testCase.expectedFrameworkStep}`);
      } else if (feedback.frameworkGuidance.currentStepId !== testCase.expectedFrameworkStep) {
        console.warn(`  ⚠ Framework step mismatch: expected ${testCase.expectedFrameworkStep}, got ${feedback.frameworkGuidance.currentStepId}`);
      }
    }

    // Check remediation tips exist
    if (!feedback.remediationTips || feedback.remediationTips.length === 0) {
      errors.push(`Missing remediation tips for wrong answer`);
    }

    // Check general explanation exists
    if (!feedback.generalExplanation || feedback.generalExplanation.trim().length === 0) {
      errors.push(`Missing general explanation`);
    }
  }

  // Check skill guidance if skillId exists
  if (testCase.question.skillId) {
    if (!feedback.skillGuidance) {
      errors.push(`Missing skill guidance for skill ${testCase.question.skillId}`);
    } else {
      if (!feedback.skillGuidance.currentState) {
        errors.push(`Missing currentState in skill guidance`);
      }
      if (!feedback.skillGuidance.remediationTips || feedback.skillGuidance.remediationTips.length === 0) {
        errors.push(`Missing remediation tips in skill guidance`);
      }
      if (!feedback.skillGuidance.prerequisiteCheck) {
        errors.push(`Missing prerequisiteCheck in skill guidance`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    feedback,
    errors
  };
}

// Main test execution
function runFeedbackQualityTests(): void {
  console.log('🧪 Feedback Quality Test Suite\n');
  console.log('=' .repeat(60));
  console.log('Testing diagnostic feedback generation\n');

  const testQuestions = selectTestQuestions();
  console.log(`Selected ${testQuestions.length} diverse test questions\n`);

  const testCases = createTestCases(testQuestions);
  console.log(`Created ${testCases.length} test cases\n`);

  const userProfile = createTestUserProfile();
  let passedCount = 0;
  let failedCount = 0;
  const results: Array<{
    testCase: TestCase;
    passed: boolean;
    errors: string[];
    feedback: DiagnosticFeedback;
  }> = [];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   ${testCase.description}`);
    
    const result = runTestCase(testCase, userProfile);
    results.push({ testCase, ...result });

    if (result.passed) {
      console.log(`   ✅ PASSED`);
      passedCount++;
    } else {
      console.log(`   ❌ FAILED`);
      failedCount++;
      for (const error of result.errors) {
        console.log(`      - ${error}`);
      }
    }

    // Show feedback summary
    console.log(`   📊 Feedback Summary:`);
    console.log(`      - Pattern ID: ${result.feedback.patternId || 'none'}`);
    console.log(`      - Framework Step: ${result.feedback.frameworkGuidance?.currentStepName || 'none'}`);
    console.log(`      - Remediation Tips: ${result.feedback.remediationTips.length}`);
    console.log(`      - Skill Guidance: ${result.feedback.skillGuidance ? 'Yes' : 'No'}`);
    if (result.feedback.skillGuidance) {
      console.log(`        State: ${result.feedback.skillGuidance.currentState}`);
      console.log(`        Prerequisites Met: ${result.feedback.skillGuidance.prerequisiteCheck.met}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Test Summary\n');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`Success Rate: ${((passedCount / testCases.length) * 100).toFixed(1)}%\n`);

  // Pattern identification accuracy
  const wrongAnswerTests = results.filter(r => !r.testCase.isCorrect);
  const patternIdentified = wrongAnswerTests.filter(r => r.feedback.patternId !== null).length;
  const patternAccuracy = wrongAnswerTests.length > 0 
    ? (patternIdentified / wrongAnswerTests.length) * 100 
    : 0;
  
  console.log('📊 Pattern Identification Metrics:');
  console.log(`   Wrong Answer Tests: ${wrongAnswerTests.length}`);
  console.log(`   Patterns Identified: ${patternIdentified}`);
  console.log(`   Pattern Identification Rate: ${patternAccuracy.toFixed(1)}%\n`);

  // Success criteria check
  console.log('🎯 Success Criteria:');
  const patternThresholdMet = patternAccuracy >= 90;
  const allTestsPassed = failedCount === 0;
  
  console.log(`   Pattern identification ≥90%: ${patternThresholdMet ? '✅' : '❌'} (${patternAccuracy.toFixed(1)}%)`);
  console.log(`   All tests passed: ${allTestsPassed ? '✅' : '❌'}`);
  console.log(`   Framework guidance present: ${results.every(r => !r.testCase.isCorrect ? r.feedback.frameworkGuidance !== null : true) ? '✅' : '❌'}`);
  console.log(`   Remediation tips present: ${results.every(r => r.feedback.remediationTips.length > 0) ? '✅' : '❌'}`);
  console.log(`   Skill guidance present: ${results.every(r => r.testCase.question.skillId ? r.feedback.skillGuidance !== undefined : true) ? '✅' : '❌'}\n`);

  const overallSuccess = patternThresholdMet && allTestsPassed;
  console.log(`\n${overallSuccess ? '✅' : '❌'} Overall: ${overallSuccess ? 'PASSED' : 'FAILED'}\n`);

  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// Run tests
runFeedbackQualityTests();
