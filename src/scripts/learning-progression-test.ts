// Learning Progression Test - Tests learning state transitions
// Part of Phase D Step 10: Test and Validate Adaptive Feedback Quality
// Tests: State transitions, consecutiveCorrect tracking, masteryDate, prerequisite blocking

import { calculateLearningState, checkPrerequisitesMet, SkillPerformance, LearningState } from '../brain/learning-state';
import { SkillId, getSkillById, SKILL_MAP } from '../brain/skill-map';
import { UserProfile } from '../hooks/useFirebaseProgress';

interface StateTransitionTest {
  name: string;
  initialState: SkillPerformance;
  updates: Array<{ isCorrect: boolean; expectedState: LearningState }>;
  description: string;
}

// Create initial skill performance
function createSkillPerformance(overrides: Partial<SkillPerformance> = {}): SkillPerformance {
  return {
    score: 0,
    attempts: 0,
    correct: 0,
    consecutiveCorrect: 0,
    history: [],
    learningState: 'emerging',
    ...overrides
  };
}

// Simulate answering questions and track state transitions
function simulateAnswerSequence(
  initialPerf: SkillPerformance,
  answers: boolean[],
  skillId: SkillId
): Array<{ answer: boolean; performance: SkillPerformance; state: LearningState }> {
  const results: Array<{ answer: boolean; performance: SkillPerformance; state: LearningState }> = [];
  let currentPerf = { ...initialPerf };

  const skillPerfLookup = (id: SkillId): SkillPerformance | undefined => {
    if (id === skillId) return currentPerf;
    return undefined; // No prerequisites for this test
  };

  for (const isCorrect of answers) {
    // Update metrics
    currentPerf.attempts += 1;
    if (isCorrect) {
      currentPerf.correct += 1;
      currentPerf.consecutiveCorrect += 1;
    } else {
      currentPerf.consecutiveCorrect = 0;
    }
    currentPerf.score = currentPerf.attempts > 0 ? currentPerf.correct / currentPerf.attempts : 0;
    currentPerf.history = [...currentPerf.history, isCorrect].slice(-5);

    // Calculate new state
    const oldState = currentPerf.learningState;
    const newState = calculateLearningState(currentPerf, skillId, skillPerfLookup);
    
    // Set masteryDate if transitioning to mastery for the first time
    if (newState === 'mastery' && oldState !== 'mastery' && !currentPerf.masteryDate) {
      currentPerf.masteryDate = Date.now();
    }
    
    currentPerf.learningState = newState;

    results.push({
      answer: isCorrect,
      performance: { ...currentPerf },
      state: newState
    });
  }

  return results;
}

// Test 1: Emerging → Developing → Proficient → Mastery progression
function testFullProgression(): {
  passed: boolean;
  errors: string[];
  transitions: Array<{ from: LearningState; to: LearningState; attempt: number }>;
} {
  const errors: string[] = [];
  const transitions: Array<{ from: LearningState; to: LearningState; attempt: number }> = [];
  
  const skillId: SkillId = 'DBDM-S01'; // Use a real skill ID
  let perf = createSkillPerformance();
  
  // Sequence: Start with some wrong, then build up correct answers
  // Need: score >= 0.85, consecutiveCorrect >= 5, history.length >= 5, at least 4/5 recent correct
  const answers = [
    false, false, // 2 wrong - should stay emerging
    true, true,   // 2 correct - should move to developing
    true, true, true, // 3 more correct - should move to proficient
    true, true,   // 2 more correct - now have 5 consecutive, but need to check score
    true, true, true, true, true, // More correct to ensure score >= 0.85
  ];

  const results = simulateAnswerSequence(perf, answers, skillId);
  
  let previousState: LearningState = 'emerging';
  results.forEach((result, index) => {
    if (result.state !== previousState) {
      transitions.push({
        from: previousState,
        to: result.state,
        attempt: index + 1
      });
      previousState = result.state;
    }
  });

  // Verify progression occurred
  const finalState = results[results.length - 1].state;
  if (finalState !== 'mastery') {
    errors.push(`Expected final state 'mastery', got '${finalState}'`);
  }

  // Verify masteryDate was set
  const masteryResult = results.find(r => r.state === 'mastery');
  if (masteryResult && !masteryResult.performance.masteryDate) {
    errors.push(`masteryDate not set when reaching mastery`);
  }

  // Verify consecutiveCorrect tracking (should be at least 5 for mastery)
  const finalConsecutive = results[results.length - 1].performance.consecutiveCorrect;
  if (finalConsecutive < 5) {
    errors.push(`Expected consecutiveCorrect >= 5 for mastery, got ${finalConsecutive}`);
  }
  
  // Verify score is high enough
  const finalScore = results[results.length - 1].performance.score;
  if (finalScore < 0.85) {
    errors.push(`Expected score >= 0.85 for mastery, got ${finalScore.toFixed(2)}`);
  }
  
  // Verify history length
  const finalHistory = results[results.length - 1].performance.history;
  if (finalHistory.length < 5) {
    errors.push(`Expected history.length >= 5 for mastery, got ${finalHistory.length}`);
  }

  return {
    passed: errors.length === 0,
    errors,
    transitions
  };
}

// Test 2: Consecutive correct tracking
function testConsecutiveCorrectTracking(): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const skillId: SkillId = 'DBDM-S01';
  let perf = createSkillPerformance();

  // Sequence: correct, correct, wrong, correct, correct, correct
  const answers = [true, true, false, true, true, true];
  const results = simulateAnswerSequence(perf, answers, skillId);

  // After first two: consecutiveCorrect = 2
  if (results[1].performance.consecutiveCorrect !== 2) {
    errors.push(`After 2 correct: expected consecutiveCorrect=2, got ${results[1].performance.consecutiveCorrect}`);
  }

  // After wrong: consecutiveCorrect = 0
  if (results[2].performance.consecutiveCorrect !== 0) {
    errors.push(`After wrong answer: expected consecutiveCorrect=0, got ${results[2].performance.consecutiveCorrect}`);
  }

  // After three more correct: consecutiveCorrect = 3
  if (results[5].performance.consecutiveCorrect !== 3) {
    errors.push(`After 3 consecutive correct: expected consecutiveCorrect=3, got ${results[5].performance.consecutiveCorrect}`);
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

// Test 3: MasteryDate is set only on first mastery
function testMasteryDateSetting(): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const skillId: SkillId = 'DBDM-S01';
  
  // Start near mastery - need to reach mastery criteria
  // Need: score >= 0.85, consecutiveCorrect >= 5, history.length >= 5, at least 4/5 recent correct
  let perf = createSkillPerformance({
    score: 0.85,
    attempts: 10,
    correct: 8,
    consecutiveCorrect: 4,
    history: [true, true, true, true],
    learningState: 'proficient'
  });

  // Answer correctly multiple times to reach mastery (need 5 consecutive total, and history with 4/5 correct)
  // Answer 2 times to get 5 consecutive and ensure history has 5 items with 4/5 correct
  let currentPerf = perf;
  let masteryResult: { answer: boolean; performance: SkillPerformance; state: LearningState } | undefined;
  
  // Try answering multiple times until we reach mastery
  for (let i = 0; i < 5; i++) {
    const results = simulateAnswerSequence(currentPerf, [true], skillId);
    masteryResult = results.find(r => r.state === 'mastery');
    if (masteryResult) break;
    currentPerf = results[results.length - 1].performance;
  }
  
  if (!masteryResult) {
    errors.push(`Failed to reach mastery state with high performance metrics`);
    return { passed: false, errors };
  }
  
  const masteryDate1 = masteryResult.performance.masteryDate;
  if (!masteryDate1) {
    errors.push(`masteryDate not set on first mastery`);
    return { passed: false, errors };
  }
  
  // Continue answering correctly (should stay in mastery, date shouldn't change)
  const results2 = simulateAnswerSequence(masteryResult.performance, [true, true], skillId);
  const stillMastery = results2[results2.length - 1];
  
  if (stillMastery.performance.masteryDate !== masteryDate1) {
    errors.push(`masteryDate changed after already being in mastery`);
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

// Test 4: Prerequisite blocking
function testPrerequisiteBlocking(): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Find a skill with prerequisites - DBDM-S06 has prerequisites: ["DBDM-S05"]
  const skillId: SkillId = 'DBDM-S06';
  const skill = getSkillById(skillId);
  
  if (!skill || !skill.prerequisites || skill.prerequisites.length === 0) {
    // Try to find any skill with prerequisites
    const allSkills = Object.values(SKILL_MAP)
      .flatMap((domain: any) => domain.clusters.flatMap((c: any) => c.skills))
      .find((s: any) => s.prerequisites && s.prerequisites.length > 0);
    
    if (!allSkills) {
      // No prerequisites in system, skip this test
      return { passed: true, errors: [] };
    }
    
    // Use the found skill
    const foundSkillId = allSkills.skillId;
    return testPrerequisiteBlockingForSkill(foundSkillId, allSkills.prerequisites);
  }
  
  return testPrerequisiteBlockingForSkill(skillId, skill.prerequisites);
}

function testPrerequisiteBlockingForSkill(skillId: SkillId, prerequisites: SkillId[]): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Create performance that would normally reach mastery
  const highPerf: SkillPerformance = {
    score: 0.90,
    attempts: 10,
    correct: 9,
    consecutiveCorrect: 5,
    history: [true, true, true, true, true],
    learningState: 'emerging'
  };

  // Mock prerequisite lookup that returns non-mastery
  const skillPerfLookup = (id: SkillId): SkillPerformance | undefined => {
    if (prerequisites.includes(id)) {
      return {
        score: 0.50,
        attempts: 5,
        correct: 2,
        consecutiveCorrect: 0,
        history: [false, false],
        learningState: 'emerging'
      };
    }
    return undefined;
  };

  const calculatedState = calculateLearningState(highPerf, skillId, skillPerfLookup);
  
  if (calculatedState !== 'emerging') {
    errors.push(`Expected state 'emerging' when prerequisites not met, got '${calculatedState}'`);
  }

  // Test checkPrerequisitesMet function
  const prerequisitesMet = checkPrerequisitesMet(skillId, skillPerfLookup);
  if (prerequisitesMet) {
    errors.push(`checkPrerequisitesMet returned true when prerequisites are not mastered`);
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

// Test 5: State transition validation
function testStateTransitions(): {
  passed: boolean;
  errors: string[];
  transitions: Array<{ from: LearningState; to: LearningState }>;
} {
  const errors: string[] = [];
  const transitions: Array<{ from: LearningState; to: LearningState }> = [];
  const skillId: SkillId = 'DBDM-S01';

  // Test each state transition
  const testScenarios = [
    {
      name: 'Emerging → Developing',
      initial: createSkillPerformance({ score: 0.50, attempts: 3, correct: 1, consecutiveCorrect: 1, history: [true] }),
      answers: [true, true],
      expectedFinal: 'developing' as LearningState
    },
    {
      name: 'Developing → Proficient',
      initial: createSkillPerformance({ score: 0.75, attempts: 8, correct: 6, consecutiveCorrect: 2, history: [true, true] }),
      answers: [true, true],
      expectedFinal: 'proficient' as LearningState
    },
    {
      name: 'Proficient → Mastery',
      initial: createSkillPerformance({ 
        score: 0.85, 
        attempts: 10, 
        correct: 8, 
        consecutiveCorrect: 3, 
        history: [true, true, true] 
      }),
      answers: [true, true, true, true], // Need 5 consecutive total (3+4=7), and history needs 5 items with 4/5 correct
      expectedFinal: 'mastery' as LearningState
    }
  ];

  for (const scenario of testScenarios) {
    const results = simulateAnswerSequence(scenario.initial, scenario.answers, skillId);
    const finalState = results[results.length - 1].state;
    
    if (finalState !== scenario.expectedFinal) {
      errors.push(`${scenario.name}: Expected '${scenario.expectedFinal}', got '${finalState}'`);
    } else {
      transitions.push({
        from: scenario.initial.learningState,
        to: finalState
      });
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    transitions
  };
}

// Main test execution
function runLearningProgressionTests(): void {
  console.log('🧪 Learning Progression Test Suite\n');
  console.log('='.repeat(60));
  console.log('Testing learning state transitions and tracking\n');

  const tests = [
    {
      name: 'Full Progression (Emerging → Mastery)',
      fn: testFullProgression
    },
    {
      name: 'Consecutive Correct Tracking',
      fn: testConsecutiveCorrectTracking
    },
    {
      name: 'MasteryDate Setting',
      fn: testMasteryDateSetting
    },
    {
      name: 'Prerequisite Blocking',
      fn: testPrerequisiteBlocking
    },
    {
      name: 'State Transitions',
      fn: testStateTransitions
    }
  ];

  let passedCount = 0;
  let failedCount = 0;
  const results: Array<{
    name: string;
    passed: boolean;
    errors: string[];
    transitions?: Array<{ from: LearningState; to: LearningState; attempt?: number }>;
  }> = [];

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    const result = test.fn();
    results.push({ name: test.name, ...result });

    if (result.passed) {
      console.log(`   ✅ PASSED`);
      passedCount++;
      if (result.transitions && result.transitions.length > 0) {
        console.log(`   📊 Transitions:`);
        result.transitions.forEach(t => {
          console.log(`      ${t.from} → ${t.to}${t.attempt ? ` (attempt ${t.attempt})` : ''}`);
        });
      }
    } else {
      console.log(`   ❌ FAILED`);
      failedCount++;
      for (const error of result.errors) {
        console.log(`      - ${error}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Test Summary\n');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`Success Rate: ${((passedCount / tests.length) * 100).toFixed(1)}%\n`);

  // Success criteria check
  console.log('🎯 Success Criteria:');
  const allTestsPassed = failedCount === 0;
  const stateTransitionsWork = results.find(r => r.name === 'Full Progression (Emerging → Mastery)')?.passed;
  const consecutiveTrackingWorks = results.find(r => r.name === 'Consecutive Correct Tracking')?.passed;
  const masteryDateWorks = results.find(r => r.name === 'MasteryDate Setting')?.passed;
  const prerequisitesWork = results.find(r => r.name === 'Prerequisite Blocking')?.passed;

  console.log(`   State transitions work correctly: ${stateTransitionsWork ? '✅' : '❌'}`);
  console.log(`   Consecutive correct tracking works: ${consecutiveTrackingWorks ? '✅' : '❌'}`);
  console.log(`   MasteryDate set correctly: ${masteryDateWorks ? '✅' : '❌'}`);
  console.log(`   Prerequisite blocking works: ${prerequisitesWork ? '✅' : '❌'}`);
  console.log(`   All tests passed: ${allTestsPassed ? '✅' : '❌'}\n`);

  const overallSuccess = allTestsPassed;
  console.log(`\n${overallSuccess ? '✅' : '❌'} Overall: ${overallSuccess ? 'PASSED' : 'FAILED'}\n`);

  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// Run tests
runLearningProgressionTests();
