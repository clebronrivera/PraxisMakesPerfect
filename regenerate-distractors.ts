/**
 * Distractor Regeneration Script
 * 
 * This script helps regenerate contextually appropriate distractors
 * for questions that have nonsensical or unrelated answer choices.
 * 
 * Usage:
 * 1. Update CONFIG paths for your project
 * 2. Run: npx tsx regenerate-distractors.ts
 * 3. Review output in questions-with-new-distractors.json
 */

import * as fs from 'fs';
import { convertArrayToScriptFormat, convertArrayToProjectFormat, type ProjectQuestion, type ScriptQuestion } from './question-format-converter.js';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  questionsPath: './src/data/questions.json',
  outputPath: './quality-reports/questions-with-new-distractors.json',
  logPath: './quality-reports/distractor-regeneration.log'
};

// ============================================================================
// SKILL-SPECIFIC DISTRACTOR POOLS
// Each pool contains plausible but incorrect answers for that skill area
// ============================================================================
const DISTRACTOR_POOLS: Record<string, string[]> = {
  
  // =========================================================================
  // MENTAL/BEHAVIORAL HEALTH SKILLS
  // =========================================================================
  
  'MBH-S01': [ // FBA Purpose
    'To document the frequency of behaviors without analyzing function',
    'To determine consequences for misbehavior',
    'To compare a student\'s behavior to classroom norms',
    'To establish baseline data for medication monitoring',
    'To satisfy documentation requirements for suspension',
    'To create a behavior contract between the student and teacher',
    'To identify students who need alternative placement'
  ],
  
  'MBH-S02': [ // Behavior Function Identification
    'The behavior is maintained by attention from adults',
    'The behavior is maintained by escape from demands',
    'The behavior serves a sensory or automatic function',
    'The behavior results in access to tangible items',
    'The behavior is a result of skill deficits only',
    'The behavior occurs randomly without identifiable patterns',
    'The behavior is caused by the student\'s disability alone'
  ],
  
  'MBH-S03': [ // Replacement Behavior Selection
    'Teaching a behavior that requires less effort but serves a different function',
    'Implementing punishment for the problem behavior without alternatives',
    'Selecting a replacement behavior based on what is easiest for adults',
    'Choosing a behavior that the student can already perform fluently',
    'Removing the student from situations where the behavior occurs',
    'Waiting for the behavior to extinguish naturally',
    'Using a time-out procedure without teaching alternative skills'
  ],
  
  'MBH-S04': [ // Suicide Risk Assessment
    'Asking direct questions about suicide may increase risk',
    'Students who talk about suicide are just seeking attention',
    'Risk assessment should only be conducted by mental health professionals outside school',
    'Promising confidentiality to encourage the student to share more',
    'Waiting to see if symptoms improve before intervening',
    'Contacting parents only after completing a full evaluation',
    'Focusing solely on recent precipitating events'
  ],
  
  'MBH-S05': [ // Therapy Model Recognition
    'Using psychodynamic interpretation of unconscious conflicts',
    'Implementing systematic desensitization for anxiety',
    'Applying solution-focused questioning techniques',
    'Utilizing play therapy with symbolic interpretation',
    'Employing behavioral activation strategies',
    'Using motivational interviewing to address ambivalence',
    'Implementing exposure and response prevention'
  ],
  
  'MBH-S06': [ // Behavioral Principles
    'Negative reinforcement involves presenting an aversive stimulus',
    'Punishment always decreases behavior effectively long-term',
    'Extinction bursts indicate the intervention is not working',
    'Intermittent reinforcement leads to faster acquisition',
    'Time-out is effective regardless of the function of behavior',
    'Token economies require tangible backup reinforcers only',
    'Shaping requires reinforcing the target behavior from the start'
  ],
  
  // =========================================================================
  // ASSESSMENT SKILLS (Domain 1)
  // =========================================================================
  
  'NEW-1-BackgroundInformation': [
    'Conducting standardized testing before reviewing any records',
    'Relying primarily on teacher report without other sources',
    'Beginning intervention without understanding student history',
    'Focusing only on current academic performance data',
    'Obtaining medical records without parent authorization',
    'Limiting review to special education records only'
  ],
  
  'NEW-1-DynamicAssessment': [
    'Comparing the student\'s performance to national norms',
    'Measuring specific academic skill levels at one point in time',
    'Identifying specific cognitive processing weaknesses',
    'Determining eligibility for gifted programs',
    'Establishing baseline performance for progress monitoring',
    'Diagnosing specific learning disabilities'
  ],
  
  'NEW-1-IQvsAchievement': [
    'Intelligence tests measure what a student has learned in school',
    'Achievement tests measure innate cognitive potential',
    'Both measure the same underlying constructs',
    'Intelligence is more influenced by instruction than achievement',
    'Achievement tests are better predictors of future success',
    'Intelligence tests should determine grade placement'
  ],
  
  'NEW-1-LowIncidenceExceptionalities': [
    'Using standard assessment procedures without modifications',
    'Relying solely on norm-referenced cognitive measures',
    'Deferring all assessment decisions to medical professionals',
    'Avoiding nonverbal measures to ensure standardization',
    'Completing assessment without specialist consultation',
    'Using the same timeline as typical evaluations'
  ],
  
  'NEW-1-PerformanceAssessment': [
    'A standardized multiple-choice achievement test',
    'A computer-adaptive screening measure',
    'A norm-referenced behavior rating scale',
    'A structured clinical interview protocol',
    'A criterion-referenced skills checklist',
    'An intelligence test battery'
  ],
  
  'NEW-1-ProblemSolvingFramework': [
    'Beginning with comprehensive evaluation for all students',
    'Implementing interventions before identifying problems',
    'Skipping to Tier 3 for students with obvious difficulties',
    'Using only standardized assessment for decision-making',
    'Waiting for failure before providing support',
    'Applying the same intervention to all struggling students'
  ],
  
  // =========================================================================
  // CONSULTATION SKILLS (Domain 2)
  // =========================================================================
  
  'NEW-2-ConsultationProcess': [
    'Implementing the intervention directly with the student',
    'Providing the teacher with a written intervention plan to follow',
    'Observing the student without involving the teacher',
    'Making recommendations based solely on assessment results',
    'Taking over classroom management for the target student',
    'Bypassing the teacher to work directly with administrators'
  ],
  
  'NEW-2-CommunicationStrategies': [
    'Immediately offering solutions to demonstrate expertise',
    'Redirecting the conversation when emotions arise',
    'Providing research evidence to counter teacher concerns',
    'Focusing on what the teacher is doing wrong',
    'Minimizing concerns to keep the consultation moving forward',
    'Suggesting the teacher needs additional training'
  ],
  
  'NEW-2-ProblemSolvingSteps': [
    'Selecting an intervention based on availability of resources',
    'Moving directly to intervention without baseline data',
    'Identifying problems based on teacher frustration level',
    'Skipping problem analysis when the problem seems obvious',
    'Evaluating only at the end of the intervention period',
    'Choosing interventions based on what worked for other students'
  ],
  
  'NEW-2-FamilyCollaboration': [
    'Using the same communication approach with all families',
    'Focusing primarily on the student\'s deficits in conversations',
    'Assuming families understand school procedures and terminology',
    'Scheduling meetings at times convenient for school staff',
    'Providing information only in English',
    'Limiting family input to signature on consent forms'
  ],
  
  'NEW-2-CommunityAgencies': [
    'Working independently without coordinating with providers',
    'Assuming agencies will communicate with each other',
    'Making referrals without following up on outcomes',
    'Limiting collaboration to crisis situations only',
    'Sharing all student information without consent',
    'Expecting agencies to adapt to school schedules'
  ],
  
  // =========================================================================
  // ACADEMIC INTERVENTION SKILLS (Domain 3)
  // =========================================================================
  
  'NEW-3-AccommodationsModifications': [
    'A modification that changes how the student demonstrates learning',
    'An accommodation that changes what the student is expected to learn',
    'A related service provided by a specialist',
    'A supplementary aid for general education access',
    'A behavior support strategy',
    'A transition service for post-school outcomes'
  ],
  
  'NEW-3-AcademicProgressFactors': [
    'Student intelligence is the primary factor in achievement',
    'Motivation alone determines academic success',
    'Teaching quality has minimal impact compared to home factors',
    'Peer relationships do not affect academic performance',
    'Cultural background is irrelevant to learning',
    'Socioeconomic status only affects access to materials'
  ],
  
  'NEW-3-BioCulturalInfluences': [
    'Biological factors alone determine academic outcomes',
    'Cultural influences are secondary to cognitive ability',
    'Social factors only affect behavior, not academics',
    'All students learn the same way regardless of background',
    'Development follows a fixed trajectory for all children',
    'Environmental factors can be controlled through intervention'
  ],
  
  'NEW-3-InstructionalHierarchy': [
    'Providing fluency practice for skills not yet acquired',
    'Moving to application before achieving accuracy',
    'Using the same instructional approach at all stages',
    'Skipping the acquisition phase for struggling learners',
    'Focusing only on generalization from the beginning',
    'Assuming mastery based on initial correct responses'
  ],
  
  'NEW-3-MetacognitiveStrategies': [
    'Providing direct instruction in content without strategy training',
    'Assuming students will develop strategies independently',
    'Focusing only on content knowledge without self-regulation',
    'Teaching strategies in isolation from content application',
    'Waiting until secondary school to introduce metacognition',
    'Using the same strategies for all content areas'
  ],
  
  // =========================================================================
  // MENTAL HEALTH IN SCHOOLS (Domain 4)
  // =========================================================================
  
  'NEW-4-Psychopathology': [
    'Symptoms always present the same way across development',
    'Adult diagnostic criteria apply directly to children',
    'Behavioral symptoms indicate conduct problems, not depression',
    'Anxiety and depression rarely co-occur in students',
    'Mental health conditions do not affect academic performance',
    'School-based identification should focus on behavior only'
  ],
  
  'NEW-4-DevelopmentalInterventions': [
    'Using abstract concepts with elementary students',
    'Implementing lengthy discussion-based sessions with young children',
    'Applying the same intervention approach across all ages',
    'Avoiding play-based approaches with middle school students',
    'Using primarily written materials with non-readers',
    'Focusing on peer relationships with kindergarteners'
  ],
  
  'NEW-4-MentalHealthImpact': [
    'Mental health conditions affect social relationships only',
    'Academic difficulties cause mental health problems, not vice versa',
    'Students with good grades cannot have mental health concerns',
    'Physical symptoms are unrelated to anxiety or depression',
    'School engagement is not affected by mental health',
    'Attention problems are always due to ADHD'
  ],
  
  'NEW-4-GroupCounseling': [
    'Including students with significantly different needs in one group',
    'Forming groups based solely on schedule availability',
    'Starting group counseling without individual screening',
    'Including students who are actively aggressive in social skills groups',
    'Running groups without clear structure or goals',
    'Allowing unlimited group size for efficiency'
  ],
  
  // =========================================================================
  // SYSTEMS-LEVEL SERVICES (Domain 5)
  // =========================================================================
  
  'NEW-5-EducationalPolicies': [
    'Implementing retention based on a single assessment score',
    'Using tracking without monitoring for equity',
    'Applying policies uniformly without considering individual needs',
    'Making placement decisions without data review',
    'Following administrative preference over research evidence',
    'Implementing policies without evaluating effectiveness'
  ],
  
  'NEW-5-EBPImportance': [
    'Selecting interventions based on teacher preference alone',
    'Using interventions because they are popular or well-marketed',
    'Implementing new approaches without evidence of effectiveness',
    'Relying on tradition rather than research',
    'Choosing interventions based on ease of implementation only',
    'Assuming all published programs are evidence-based'
  ],
  
  'NEW-5-SchoolClimate': [
    'Focusing only on discipline data to measure climate',
    'Surveying only staff about school environment',
    'Measuring climate once and assuming stability',
    'Addressing physical safety without emotional safety',
    'Ignoring student voice in climate assessment',
    'Assuming good test scores indicate positive climate'
  ],
  
  // =========================================================================
  // PREVENTION AND CRISIS (Domain 6)
  // =========================================================================
  
  'NEW-6-BullyingPrevention': [
    'Focusing intervention only on the student who was bullied',
    'Using zero-tolerance policies as the primary approach',
    'Encouraging students to handle bullying on their own',
    'Addressing only physical forms of bullying',
    'Implementing one-time assemblies as the main prevention',
    'Punishing bystanders who do not intervene'
  ],
  
  'NEW-6-TraumaInformed': [
    'Requiring students to discuss traumatic experiences',
    'Using punitive approaches for trauma-related behaviors',
    'Treating all behavior problems the same way',
    'Focusing only on academic interventions',
    'Avoiding discussion of difficult topics entirely',
    'Assuming trauma affects all students the same way'
  ],
  
  'NEW-6-SchoolClimateMeasurement': [
    'Using discipline referrals as the only climate indicator',
    'Surveying only once per year',
    'Focusing solely on student perceptions',
    'Measuring only safety-related factors',
    'Ignoring data disaggregation by student groups',
    'Assuming high attendance indicates positive climate'
  ],
  
  // =========================================================================
  // FAMILY AND COMMUNITY (Domain 7)
  // =========================================================================
  
  'NEW-7-BarriersToEngagement': [
    'Assuming parents who don\'t attend meetings don\'t care',
    'Providing information only during school hours',
    'Using professional jargon in all communications',
    'Offering only one method of communication',
    'Scheduling meetings without considering family needs',
    'Requiring in-person attendance for all interactions'
  ],
  
  'NEW-7-FamilySystems': [
    'Viewing the student in isolation from family context',
    'Assuming all families function the same way',
    'Focusing only on the identified student\'s needs',
    'Ignoring family structure in intervention planning',
    'Treating parents as passive recipients of information',
    'Assuming two-parent nuclear family structure'
  ],
  
  'NEW-7-InteragencyCollaboration': [
    'Working independently without involving community partners',
    'Limiting transition planning to the final year of school',
    'Assuming families will make community connections independently',
    'Coordinating only with educational agencies',
    'Ending school involvement immediately at graduation',
    'Making referrals without follow-up'
  ],
  
  'NEW-7-ParentingInterventions': [
    'Telling parents what to do without teaching strategies',
    'Focusing only on what parents are doing wrong',
    'Using the same approach with all families',
    'Implementing school-only interventions without home component',
    'Assuming parents know how to implement behavioral strategies',
    'Recommending primarily punitive approaches'
  ],
  
  // =========================================================================
  // DIVERSITY (Domain 8)
  // =========================================================================
  
  'NEW-8-Acculturation': [
    'Assuming all members of a cultural group are the same',
    'Ignoring acculturation level in assessment interpretation',
    'Using only English-language assessments',
    'Attributing all difficulties to cultural differences',
    'Assuming assimilation is the goal for all students',
    'Ignoring within-group individual differences'
  ],
  
  'NEW-8-LanguageAcquisition': [
    'Expecting academic language proficiency within two years',
    'Using social language fluency to rule out language needs',
    'Assessing only in the dominant language',
    'Attributing all academic difficulties to language status',
    'Recommending English-only instruction',
    'Ignoring first language proficiency in assessment'
  ],
  
  'NEW-8-SocialJustice': [
    'Maintaining neutrality on equity issues',
    'Focusing only on individual student factors',
    'Ignoring systemic barriers to student success',
    'Assuming equal access means equal outcomes',
    'Avoiding advocacy to maintain professional relationships',
    'Treating disproportionality as inevitable'
  ],
  
  // =========================================================================
  // RESEARCH AND EVALUATION (Domain 9)
  // =========================================================================
  
  'NEW-9-DescriptiveStats': [
    'Using the mean when data is highly skewed',
    'Reporting only measures of central tendency',
    'Ignoring variability in data interpretation',
    'Assuming normal distribution without checking',
    'Treating ordinal data as interval data',
    'Ignoring outliers in analysis'
  ],
  
  'NEW-9-ValidityThreats': [
    'Attributing all improvement to the intervention',
    'Ignoring developmental changes over time',
    'Assuming the intervention caused observed effects',
    'Not considering historical events that occurred',
    'Ignoring selection bias in group comparisons',
    'Generalizing findings to all populations'
  ],
  
  'NEW-9-StatisticalTests': [
    'Using parametric tests with non-normal distributions',
    'Ignoring assumptions of statistical tests',
    'Interpreting statistical significance as practical significance',
    'Using correlation to establish causation',
    'Selecting tests based on desired outcomes',
    'Ignoring effect sizes in interpretation'
  ],
  
  'NEW-9-Variables': [
    'Treating the independent variable as the outcome',
    'Ignoring confounding variables',
    'Not operationally defining variables',
    'Confusing mediators and moderators',
    'Ignoring measurement error',
    'Assuming variables are measured without error'
  ],
  
  'NEW-9-ProgramEvaluation': [
    'Collecting only outcome data without process measures',
    'Evaluating only at the end of implementation',
    'Ignoring stakeholder perspectives',
    'Using only quantitative measures',
    'Not establishing baseline before implementation',
    'Focusing only on intended outcomes'
  ],
  
  'NEW-9-ImplementationFidelity': [
    'Assuming training alone ensures implementation',
    'Not monitoring implementation over time',
    'Ignoring adaptations made during implementation',
    'Measuring fidelity only at the end',
    'Not providing ongoing support after training',
    'Assuming high fidelity in absence of measurement'
  ],
  
  // =========================================================================
  // LEGAL AND ETHICAL (Domain 10)
  // =========================================================================
  
  'NEW-10-EducationLaw': [
    'Section 504 requires an IEP',
    'IDEA covers all students with disabilities',
    'Accommodations require specialized instruction',
    'All disabilities qualify for IDEA services',
    'Section 504 has the same procedural requirements as IDEA',
    'Both laws use the same definition of disability'
  ],
  
  'NEW-10-EthicalProblemSolving': [
    'Making decisions unilaterally to resolve conflicts quickly',
    'Avoiding the ethical issue to maintain relationships',
    'Following rules without considering context',
    'Prioritizing administrative convenience over student welfare',
    'Keeping all ethical concerns confidential',
    'Deferring all ethical decisions to supervisors'
  ],
  
  'NEW-10-RecordKeeping': [
    'Sharing records with any school employee who requests them',
    'Denying all parent requests for record access',
    'Keeping personal notes in the official student file',
    'Destroying records immediately after services end',
    'Sharing records with outside agencies without consent',
    'Maintaining records indefinitely without purging'
  ],
  
  'NEW-10-TestSecurity': [
    'Sharing test items with teachers to help them prepare students',
    'Allowing parents to keep test protocols',
    'Using test items for teaching purposes',
    'Releasing complete protocols upon request',
    'Copying test forms for documentation',
    'Sharing scoring criteria with examinees'
  ],
  
  'NEW-10-Supervision': [
    'Providing supervision without observing supervisee work',
    'Allowing supervisees to practice independently immediately',
    'Signing off on work without review',
    'Supervising outside areas of competence',
    'Limiting supervision to crisis consultation only',
    'Not documenting supervision activities'
  ],
  
  'NEW-10-ProfessionalGrowth': [
    'Relying only on training received in graduate school',
    'Limiting professional development to required activities',
    'Avoiding challenging cases to maintain competence',
    'Not seeking supervision when facing new situations',
    'Assuming competence in all areas of practice',
    'Ignoring research developments in the field'
  ]
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

interface Question extends ScriptQuestion {}

function loadQuestions(filePath: string): Question[] {
  const data = fs.readFileSync(filePath, 'utf-8');
  const projectQuestions: ProjectQuestion[] = JSON.parse(data);
  // Convert from project format to script format
  return convertArrayToScriptFormat(projectQuestions);
}

function saveQuestions(questions: Question[], filePath: string): void {
  // Convert back to project format before saving
  const projectQuestions = convertArrayToProjectFormat(questions);
  fs.writeFileSync(filePath, JSON.stringify(projectQuestions, null, 2));
}

function isNonsensicalDistractor(text: string): boolean {
  const patterns = [
    'Tarasoff', 'IDEA', 'Investigate the abuse', 'Provide less than',
    'Decide on placement without', 'Data collection all comes',
    'Data collection every comes', 'Data collection only comes',
    'Data collection never comes', 'The program resulted in improvement',
    'The intervention caused', 'Allow full copying', 'Prescribe treatment',
    'Make a medical diagnosis', 'Diagnose the student with a medical',
    'Breach confidentiality for general', 'Use progress monitoring tools for program',
    'Use curriculum-based measurement for comprehensive',
    'Use a diagnostic assessment for weekly', 'Use an individual assessment for universal',
    'Use a screening tool to determine eligibility', 'Provide direct instruction only',
    'Apply adult diagnostic criteria', 'Apply the rule absolutely',
    'Include students with severe conduct', 'A replacement behavior that serves a different',
    'Intervention before assessment', 'Schedule assessment for next',
    'Assign homework to the student', 'Make disciplinary decisions',
    'Determine appropriate punishment', 'Provide the best possible education',
    'Recommend services without analyzing', 'Make a recommendation based on teacher observations alone',
    'Deny access to records without', 'Disclose confidential information',
    'Low scores lead to special education', 'Cognitive Behavioral Therapy'
  ];
  
  return patterns.some(p => text.includes(p)) || (text.split(' ').length <= 2 && text.length < 30);
}

function selectNewDistractors(
  skillId: string, 
  correctAnswerText: string, 
  count: number = 3
): string[] {
  const pool = DISTRACTOR_POOLS[skillId] || [];
  
  if (pool.length === 0) {
    console.log(`  ⚠️  No distractor pool for skill: ${skillId}`);
    return [];
  }
  
  // Filter out any that are too similar to the correct answer
  const correctLower = correctAnswerText.toLowerCase();
  const available = pool.filter(d => {
    const dLower = d.toLowerCase();
    return !dLower.includes(correctLower.substring(0, 20)) && 
           !correctLower.includes(dLower.substring(0, 20));
  });
  
  // Shuffle and select
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function regenerateDistractors(questions: Question[]): {
  updated: Question[];
  log: string[];
} {
  const log: string[] = [];
  const updated: Question[] = [];
  
  log.push('Distractor Regeneration Log');
  log.push('=' .repeat(50));
  log.push(`Started: ${new Date().toISOString()}`);
  log.push('');
  
  for (const question of questions) {
    // Only process generated questions with issues
    if (!question.id.startsWith('GEN-')) {
      updated.push(question);
      continue;
    }
    
    const correctAnswer = question.choices.find(
      c => c.letter === question.correctAnswer || c.isCorrect
    );
    
    if (!correctAnswer) {
      log.push(`⚠️  ${question.id}: No correct answer found, skipping`);
      updated.push(question);
      continue;
    }
    
    // Check which distractors need replacement
    const needsReplacement: number[] = [];
    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      if (choice.letter === question.correctAnswer || choice.isCorrect) continue;
      
      if (isNonsensicalDistractor(choice.text)) {
        needsReplacement.push(i);
      }
    }
    
    if (needsReplacement.length === 0) {
      updated.push(question);
      continue;
    }
    
    // Get new distractors
    const newDistractors = selectNewDistractors(
      question.skillId,
      correctAnswer.text,
      needsReplacement.length
    );
    
    if (newDistractors.length < needsReplacement.length) {
      log.push(`⚠️  ${question.id}: Not enough distractors in pool for ${question.skillId}`);
      log.push(`    Need: ${needsReplacement.length}, Available: ${newDistractors.length}`);
    }
    
    // Apply replacements
    const updatedQuestion = { ...question, choices: [...question.choices] };
    
    for (let i = 0; i < needsReplacement.length && i < newDistractors.length; i++) {
      const choiceIndex = needsReplacement[i];
      const oldText = updatedQuestion.choices[choiceIndex].text;
      const newText = newDistractors[i];
      
      updatedQuestion.choices[choiceIndex] = {
        ...updatedQuestion.choices[choiceIndex],
        text: newText
      };
      
      log.push(`✓ ${question.id} Choice ${updatedQuestion.choices[choiceIndex].letter}:`);
      log.push(`  OLD: "${oldText.substring(0, 50)}..."`);
      log.push(`  NEW: "${newText.substring(0, 50)}..."`);
    }
    
    updated.push(updatedQuestion);
  }
  
  log.push('');
  log.push('=' .repeat(50));
  log.push(`Completed: ${new Date().toISOString()}`);
  
  return { updated, log };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Distractor Regeneration Script');
  console.log('==============================\n');
  
  if (!fs.existsSync(CONFIG.questionsPath)) {
    console.log(`Questions file not found at ${CONFIG.questionsPath}`);
    console.log('\nTo use this script:');
    console.log('1. Update CONFIG.questionsPath to point to your questions.json');
    console.log('2. Run: npx tsx regenerate-distractors.ts');
    return;
  }
  
  const questions = loadQuestions(CONFIG.questionsPath);
  console.log(`Loaded ${questions.length} questions\n`);
  
  console.log('Regenerating distractors for GEN-* questions...\n');
  
  const { updated, log } = regenerateDistractors(questions);
  
  // Count changes
  const genQuestions = questions.filter(q => q.id.startsWith('GEN-'));
  const changedQuestions = log.filter(l => l.startsWith('✓')).length;
  
  console.log(`\nProcessed ${genQuestions.length} generated questions`);
  console.log(`Made ${changedQuestions} distractor replacements\n`);
  
  // Save output
  saveQuestions(updated, CONFIG.outputPath);
  console.log(`Updated questions saved to: ${CONFIG.outputPath}`);
  
  // Ensure log directory exists
  const logDir = CONFIG.logPath.split('/').slice(0, -1).join('/');
  if (logDir && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.logPath, log.join('\n'));
  console.log(`Regeneration log saved to: ${CONFIG.logPath}`);
  
  console.log('\n✅ Distractor regeneration complete!');
  console.log('\nNext steps:');
  console.log('1. Review the regeneration log for any warnings');
  console.log('2. Manually review questions with skill-specific concerns');
  console.log('3. Replace original questions.json with the updated version');
}

main().catch(console.error);
