/**
 * Banned Terms Regression Test
 * 
 * Checks all questions to ensure distractors don't contain banned terms
 * for their domain. This prevents regression of domain-specific term issues.
 */

import * as fs from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  questionsPath: './src/data/questions.json',
  skillMapPath: './src/data/question-skill-map.json',
};

// ============================================================================
// BANNED TERMS BY DOMAIN
// ============================================================================

const BANNED_TERMS: Record<string, string[]> = {
  consultation: [
    'Tarasoff', 'IDEA', 'Mills', 'Larry P.', 'Lau', 'FERPA', 
    'Section 504', ' v. ', 'Rowley', 'PARC', 'FAPE', 'due process', 'IEP'
  ],
  therapy: [
    'Tarasoff', 'Mills', 'Larry P.', 'Lau', ' v. ', 'IDEA', 'FERPA'
  ],
  intervention: [
    'Tarasoff', 'Mills', 'Larry P.', ' v. ', 'IDEA'
  ],
  fba: [
    'Tarasoff', 'IDEA', 'Mills', ' v. ', 'Larry P.', 'Lau'
  ],
  assessment: [
    'Tarasoff', ' v. '
  ],
  psychometric: [
    'Tarasoff', ' v. '
  ],
  legal: [] // Legal domain can have legal terms, so no bans
};

// Map skills to their expected domains (from audit script)
const SKILL_TO_DOMAIN_MAP: Record<string, string[]> = {
  // Domain 1 - Data-Based Decision Making
  'DBDM-S01': ['psychometric'],
  'DBDM-S02': ['psychometric'],
  'DBDM-S03': ['psychometric'],
  'DBDM-S04': ['psychometric'],
  'DBDM-S05': ['assessment', 'psychometric'],
  'DBDM-S06': ['assessment'],
  'DBDM-S07': ['assessment'],
  'DBDM-S08': ['assessment'],
  'DBDM-S09': ['assessment'],
  'DBDM-S10': ['assessment'],
  'NEW-1-BackgroundInformation': ['assessment'],
  'NEW-1-DynamicAssessment': ['assessment'],
  'NEW-1-IQvsAchievement': ['psychometric', 'assessment'],
  'NEW-1-LowIncidenceExceptionalities': ['assessment'],
  'NEW-1-PerformanceAssessment': ['assessment'],
  'NEW-1-ProblemSolvingFramework': ['intervention'],

  // Domain 2 - Consultation & Collaboration
  'CC-S01': ['consultation'],
  'CC-S03': ['consultation'],
  'NEW-2-ConsultationProcess': ['consultation'],
  'NEW-2-ProblemSolvingSteps': ['consultation'],
  'NEW-2-CommunicationStrategies': ['consultation'],
  'NEW-2-FamilyCollaboration': ['consultation'],
  'NEW-2-CommunityAgencies': ['consultation'],

  // Domain 3 - Academic Interventions
  'ACAD-S01': ['intervention'],
  'ACAD-S02': ['intervention'],
  'ACAD-S03': ['intervention'],
  'ACAD-S04': ['intervention'],
  'ACAD-S05': ['assessment', 'intervention'],
  'NEW-3-AccommodationsModifications': ['intervention'],
  'NEW-3-AcademicProgressFactors': ['intervention'],
  'NEW-3-BioCulturalInfluences': ['intervention'],
  'NEW-3-InstructionalHierarchy': ['intervention'],
  'NEW-3-MetacognitiveStrategies': ['intervention'],

  // Domain 4 - Mental & Behavioral Health
  'MBH-S01': ['fba'],
  'MBH-S02': ['fba'],
  'MBH-S03': ['fba'],
  'MBH-S04': ['therapy'],
  'MBH-S05': ['therapy'],
  'MBH-S06': ['intervention', 'fba'],
  'NEW-4-Psychopathology': ['therapy'],
  'NEW-4-DevelopmentalInterventions': ['therapy'],
  'NEW-4-MentalHealthImpact': ['therapy'],
  'NEW-4-GroupCounseling': ['therapy'],

  // Domain 5 - School-Wide Practices
  'SWP-S01': ['intervention'],
  'SWP-S02': ['intervention'],
  'SWP-S03': ['intervention'],
  'SWP-S04': ['intervention'],
  'NEW-5-EducationalPolicies': ['legal', 'assessment'],
  'NEW-5-EBPImportance': ['intervention'],
  'NEW-5-SchoolClimate': ['intervention'],

  // Domain 6-9 - Other domains
  'RES-S01': ['intervention'],
  'RES-S02': ['intervention'],
  'RES-S03': ['intervention'],
  'RES-S04': ['intervention'],
  'RES-S05': ['intervention'],
  'RES-S06': ['intervention'],
  'NEW-6-BullyingPrevention': ['intervention'],
  'NEW-6-TraumaInformed': ['intervention'],
  'NEW-6-SchoolClimateMeasurement': ['assessment', 'intervention'],

  // Family/Community
  'FSC-S01': ['consultation'],
  'FSC-S02': ['consultation'],
  'FSC-S03': ['therapy'],
  'FSC-S04': ['consultation'],
  'NEW-7-BarriersToEngagement': ['consultation'],
  'NEW-7-FamilySystems': ['consultation'],
  'NEW-7-InteragencyCollaboration': ['consultation'],
  'NEW-7-ParentingInterventions': ['consultation', 'intervention'],

  // Diversity
  'DIV-S01': ['assessment'],
  'DIV-S02': ['assessment'],
  'DIV-S03': ['psychometric'],
  'DIV-S04': ['assessment'],
  'DIV-S05': ['assessment'],
  'DIV-S06': ['assessment'],
  'DIV-S07': ['intervention'],
  'NEW-8-Acculturation': ['assessment'],
  'NEW-8-LanguageAcquisition': ['assessment'],
  'NEW-8-SocialJustice': ['legal'],

  // Research/Statistics
  'NEW-9-DescriptiveStats': ['psychometric'],
  'NEW-9-ValidityThreats': ['psychometric'],
  'NEW-9-StatisticalTests': ['psychometric'],
  'NEW-9-Variables': ['psychometric'],
  'NEW-9-ProgramEvaluation': ['assessment'],
  'NEW-9-ImplementationFidelity': ['intervention'],

  // Legal/Ethical
  'LEG-S01': ['legal'],
  'LEG-S02': ['legal'],
  'LEG-S03': ['legal'],
  'LEG-S04': ['legal'],
  'LEG-S05': ['legal'],
  'LEG-S06': ['legal'],
  'LEG-S07': ['legal'],
  'PC-S01': ['assessment'],
  'PC-S02': ['assessment'],
  'PC-S03': ['legal'],
  'PC-S04': ['intervention'],
  'PC-S05': ['legal'],
  'NEW-10-EducationLaw': ['legal'],
  'NEW-10-EthicalProblemSolving': ['legal'],
  'NEW-10-RecordKeeping': ['legal'],
  'NEW-10-TestSecurity': ['legal'],
  'NEW-10-Supervision': ['legal'],
  'NEW-10-ProfessionalGrowth': ['legal'],
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string | string[];
  rationale?: string;
  skillId?: string;
}

interface Violation {
  questionId: string;
  skillId: string | null;
  domain: string;
  bannedTerm: string;
  distractor: string;
  choiceLetter: string;
}

// ============================================================================
// CHECKING LOGIC
// ============================================================================

function loadQuestions(filePath: string): Question[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading questions from ${filePath}:`, error);
    return [];
  }
}

function checkQuestion(question: Question): Violation[] {
  const violations: Violation[] = [];
  
  if (!question.skillId) {
    return violations; // Skip questions without skill mapping
  }

  const expectedDomains = SKILL_TO_DOMAIN_MAP[question.skillId] || [];
  if (expectedDomains.length === 0) {
    return violations; // Skip if domain mapping not found
  }

  const correctAnswers = Array.isArray(question.correct_answer) 
    ? question.correct_answer 
    : [question.correct_answer];

  // Check each distractor
  for (const [letter, text] of Object.entries(question.choices)) {
    if (!text || text.trim() === '') continue;
    if (correctAnswers.includes(letter)) continue; // Skip correct answers

    const distractorLower = text.toLowerCase();

    // Check banned terms for each expected domain
    for (const domain of expectedDomains) {
      const bannedTerms = BANNED_TERMS[domain] || [];
      
      for (const bannedTerm of bannedTerms) {
        if (distractorLower.includes(bannedTerm.toLowerCase())) {
          violations.push({
            questionId: question.id,
            skillId: question.skillId,
            domain,
            bannedTerm,
            distractor: text,
            choiceLetter: letter
          });
          break; // Only report first violation per distractor
        }
      }
    }
  }

  return violations;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('Banned Terms Check');
  console.log('==================\n');

  const questions = loadQuestions(CONFIG.questionsPath);
  console.log(`Checking ${questions.length} questions...\n`);

  const allViolations: Violation[] = [];
  const questionsWithViolations = new Set<string>();

  for (const question of questions) {
    const violations = checkQuestion(question);
    if (violations.length > 0) {
      questionsWithViolations.add(question.id);
      allViolations.push(...violations);
    }
  }

  // Report results
  console.log('='.repeat(60));
  if (allViolations.length === 0) {
    console.log('✅ PASS: No banned terms found in distractors');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log(`❌ FAIL: Found ${allViolations.length} violations`);
    console.log(`   Affected questions: ${questionsWithViolations.size}`);
    console.log('='.repeat(60));
    
    console.log('\nViolations by Domain:');
    const violationsByDomain = new Map<string, number>();
    for (const v of allViolations) {
      violationsByDomain.set(v.domain, (violationsByDomain.get(v.domain) || 0) + 1);
    }
    for (const [domain, count] of Array.from(violationsByDomain.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${domain}: ${count}`);
    }
    
    console.log('\nTop 20 Violations:');
    console.log('| Question ID | Skill | Domain | Banned Term | Distractor (truncated) |');
    console.log('|-------------|-------|--------|-------------|------------------------|');
    
    for (const v of allViolations.slice(0, 20)) {
      const truncated = v.distractor.length > 40 
        ? v.distractor.substring(0, 37) + '...'
        : v.distractor;
      console.log(`| ${v.questionId} | ${v.skillId || 'N/A'} | ${v.domain} | ${v.bannedTerm} | ${truncated} |`);
    }
    
    if (allViolations.length > 20) {
      console.log(`\n... and ${allViolations.length - 20} more violations`);
    }
    
    process.exit(1);
  }
}

main();
